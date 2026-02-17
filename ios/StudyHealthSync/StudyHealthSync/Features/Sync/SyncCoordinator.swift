import Foundation
import Combine
import HealthKit
import UIKit

@MainActor
final class SyncCoordinator: ObservableObject {
    @Published private(set) var authorizationState: AuthorizationState = .unknown
    @Published private(set) var needsHealthPermissionsInSettings = false
    @Published private(set) var isSyncing = false
    @Published private(set) var lastSyncAt: Date?
    @Published private(set) var lastAttemptAt: Date?
    @Published private(set) var nextScheduledAt: Date?
    @Published private(set) var pendingQueueCount: Int = 0
    @Published private(set) var lastErrorMessage: String?
    @Published private(set) var recentLogs: [SyncAttemptLog] = []

    var settings: AppSettingsStore

    private let healthService: HealthKitService
    private let anchorStore: AnchorStore
    private let queueStore: SyncQueueStore
    private let apiClient: SyncAPIClient

    private var autoSyncTask: Task<Void, Never>?
    private var observersStarted = false
    private var hasStarted = false
    private var lastObserverSyncRequestAt: Date?
    private let observerSyncCooldownSeconds: TimeInterval = 20
    private var isRepairBackfillRunning = false
    private let repairBackfillDays = 90

    private enum Keys {
        static let repairBackfillCompleted = "sync.healthkit.repairBackfillCompleted"
    }

    init() {
        let settings = AppSettingsStore()
        let anchorStore = AnchorStore()
        let queueStore = SyncQueueStore()
        let apiClient = SyncAPIClient()

        self.settings = settings
        self.anchorStore = anchorStore
        self.queueStore = queueStore
        self.apiClient = apiClient
        self.healthService = HealthKitService(anchorStore: anchorStore)
    }

    func start() {
        if hasStarted {
            return
        }
        hasStarted = true

        Task {
            await refreshAuthorizationState(runRepairIfRecovered: true)
        }

        BackgroundSyncScheduler.shared.register { [weak self] trigger in
            guard let self else {
                return false
            }
            return await self.syncNow(trigger: trigger)
        }

        rescheduleBackgroundTasks()
        restartForegroundAutoSyncLoop()

        Task {
            await refreshQueueState()
            await refreshLastSyncFromStore()
            _ = await syncNow(trigger: .appLaunch)
        }
    }

    func requestPermissions() {
        Task {
            let requestStatus = await healthService.authorizationRequestStatus()

            do {
                if requestStatus == .shouldRequest || requestStatus == .unknown {
                    try await healthService.requestAuthorization()
                }

                await refreshAuthorizationState(runRepairIfRecovered: true)
                if authorizationState == .authorized {
                    lastErrorMessage = nil
                    await startObserversIfNeeded()
                    await queueStore.appendLog("Health permissions are authorized.")
                    await refreshQueueState()
                    return
                }

                if requestStatus == .unnecessary {
                    needsHealthPermissionsInSettings = true
                    lastErrorMessage = "Health permissions are disabled. Open Settings to re-enable Health access."
                    await queueStore.appendLog("Health permissions denied. Opening Settings.")
                    openAppSettings()
                } else {
                    lastErrorMessage = "Health permissions are required before syncing."
                    await queueStore.appendLog("Health permissions are not granted.")
                }
                await refreshQueueState()
            } catch {
                lastErrorMessage = error.localizedDescription
                await queueStore.appendLog("Authorization failed: \(error.localizedDescription)")
                await refreshQueueState()
            }
        }
    }

    func triggerManualSync() {
        Task {
            _ = await syncNow(trigger: .manual)
        }
    }

    func triggerManualRangeUpload(days: Int) {
        Task {
            _ = await syncRange(days: days)
        }
    }

    func disconnectAppleHealth() {
        Task {
            if isSyncing {
                lastErrorMessage = "Please wait for the current sync to finish before disconnecting."
                return
            }

            await healthService.stopBackgroundObserversAndDelivery()
            observersStarted = false
            lastObserverSyncRequestAt = nil

            await anchorStore.clearSyncState()
            await queueStore.clearPending()
            await healthService.clearAuthorizationTracking()
            UserDefaults.standard.removeObject(forKey: Keys.repairBackfillCompleted)

            settings.performFullDisconnect()
            applySettingsAndReschedule()

            await refreshLastSyncFromStore()
            await refreshAuthorizationState(runRepairIfRecovered: false)

            lastErrorMessage = "Apple Health disconnected. Re-enable access in iOS Settings when you want to sync again."
            await queueStore.appendLog(
                "Apple Health disconnected: token cleared, auto-sync disabled, anchors reset."
            )
            await refreshQueueState()
            openAppSettings()
        }
    }

    func syncNow(trigger: SyncTrigger) async -> Bool {
        if isSyncing {
            return false
        }

        if authorizationState != .authorized {
            await refreshAuthorizationState(runRepairIfRecovered: true)
            if authorizationState != .authorized {
                lastErrorMessage = needsHealthPermissionsInSettings
                    ? "Health permissions are disabled. Open iOS Settings and allow Health access."
                    : "Health permissions are required before syncing."
                await queueStore.appendLog("Sync skipped (\(trigger.rawValue)): authorization not granted")
                await refreshQueueState()
                return false
            }
        }

        guard let baseURL = settings.resolvedBaseURL else {
            lastErrorMessage = "Base URL is invalid."
            await queueStore.appendLog("Sync failed: invalid base URL")
            await refreshQueueState()
            return false
        }

        isSyncing = true
        lastAttemptAt = Date()
        lastErrorMessage = nil

        do {
            await startObserversIfNeeded()

            try await flushPendingQueue(baseURL: baseURL)

            if let deltaBatch = try await healthService.collectDelta(intervalMinutes: settings.syncIntervalMinutes) {
                await queueStore.appendLog("Prepared payload (\(trigger.rawValue)): \(payloadDiagnostics(deltaBatch.payload))")
                _ = try await uploadBatch(
                    payload: deltaBatch.payload,
                    anchorSnapshots: deltaBatch.anchorSnapshots,
                    baseURL: baseURL,
                    trigger: trigger
                )
            } else {
                if trigger == .manual || trigger == .appLaunch || trigger == .backgroundTask {
                    await queueStore.appendLog("No health changes detected for \(trigger.rawValue)")
                }
            }

            await refreshLastSyncFromStore()
            await refreshQueueState()
            scheduleNextForegroundTick()
            isSyncing = false
            return true
        } catch {
            let message = error.localizedDescription
            lastErrorMessage = message
            await queueStore.appendLog("Sync error (\(trigger.rawValue)): \(message)")
            await refreshQueueState()
            scheduleNextForegroundTick()
            isSyncing = false
            return false
        }
    }

    func applySettingsAndReschedule() {
        restartForegroundAutoSyncLoop()
        rescheduleBackgroundTasks()
        scheduleNextForegroundTick()
    }

    private func syncRange(days: Int) async -> Bool {
        let boundedDays = max(1, min(days, 365))

        if isSyncing {
            return false
        }

        if authorizationState != .authorized {
            await refreshAuthorizationState(runRepairIfRecovered: true)
            if authorizationState != .authorized {
                lastErrorMessage = needsHealthPermissionsInSettings
                    ? "Health permissions are disabled. Open iOS Settings and allow Health access."
                    : "Health permissions are required before syncing."
                await queueStore.appendLog("Range upload skipped: authorization not granted")
                await refreshQueueState()
                return false
            }
        }

        guard let baseURL = settings.resolvedBaseURL else {
            lastErrorMessage = "Base URL is invalid."
            await queueStore.appendLog("Range upload failed: invalid base URL")
            await refreshQueueState()
            return false
        }

        isSyncing = true
        lastAttemptAt = Date()
        lastErrorMessage = nil

        do {
            await startObserversIfNeeded()
            try await flushPendingQueue(baseURL: baseURL)

            let now = Date()
            let startOfToday = Calendar.current.startOfDay(for: now)
            let rangeStart = Calendar.current.date(byAdding: .day, value: -(boundedDays - 1), to: startOfToday) ?? now

            if let payload = try await healthService.collectRange(
                from: rangeStart,
                to: now,
                intervalMinutes: settings.syncIntervalMinutes
            ) {
                await queueStore.appendLog("Prepared range payload (\(boundedDays)d): \(payloadDiagnostics(payload))")
                _ = try await uploadBatch(
                    payload: payload,
                    anchorSnapshots: [],
                    baseURL: baseURL,
                    trigger: .manualRange
                )
            } else {
                await queueStore.appendLog("No health data found for manual range (\(boundedDays) days)")
            }

            await refreshLastSyncFromStore()
            await refreshQueueState()
            scheduleNextForegroundTick()
            isSyncing = false
            return true
        } catch {
            let message = error.localizedDescription
            lastErrorMessage = message
            await queueStore.appendLog("Range upload error (\(boundedDays)d): \(message)")
            await refreshQueueState()
            scheduleNextForegroundTick()
            isSyncing = false
            return false
        }
    }

    private func flushPendingQueue(baseURL: URL) async throws {
        while let batch = await queueStore.nextBatch() {
            do {
                _ = try await apiClient.send(
                    payload: batch.payload,
                    baseURL: baseURL,
                    endpointPath: settings.endpointPath,
                    bearerToken: settings.token,
                    timeoutSeconds: settings.timeoutSeconds
                )

                await persistAnchorsAfterUpload(batch.anchors, at: Date())
                await queueStore.removeBatch(id: batch.id)
            } catch {
                await queueStore.incrementAttempts(for: batch.id, reason: error.localizedDescription)
                throw error
            }
        }
    }

    private func uploadBatch(
        payload: MobileSyncPayload,
        anchorSnapshots: [AnchorSnapshot],
        baseURL: URL,
        trigger: SyncTrigger
    ) async throws -> MobileSyncResponse {
        let response = try await apiClient.send(
            payload: payload,
            baseURL: baseURL,
            endpointPath: settings.endpointPath,
            bearerToken: settings.token,
            timeoutSeconds: settings.timeoutSeconds
        )

        let syncDate = Date()
        await persistAnchorsAfterUpload(anchorSnapshots, at: syncDate)
        lastSyncAt = syncDate

        await queueStore.appendLog(
            "Sync ok (\(trigger.rawValue)): +\(response.importedHealthDays) days, +\(response.importedWorkouts) workouts, updated \(response.updatedWorkouts)"
        )

        return response
    }

    private func persistAnchorsAfterUpload(_ snapshots: [AnchorSnapshot], at syncDate: Date) async {
        guard !snapshots.isEmpty else {
            await anchorStore.persist(anchorSnapshots: [], lastSyncAt: syncDate)
            return
        }

        let map = Dictionary(uniqueKeysWithValues: snapshots.map { ($0.key, $0.encodedAnchor) })
        await anchorStore.persistRawAnchorMap(map, lastSyncAt: syncDate)
    }

    private func refreshAuthorizationState(runRepairIfRecovered: Bool) async {
        let previousState = authorizationState
        authorizationState = await healthService.authorizationState()

        let requestStatus = await healthService.authorizationRequestStatus()
        needsHealthPermissionsInSettings =
            authorizationState != .authorized && requestStatus == .unnecessary

        if runRepairIfRecovered {
            await runRepairBackfillIfNeeded(previousState: previousState)
        }
    }

    private func runRepairBackfillIfNeeded(previousState: AuthorizationState) async {
        guard authorizationState == .authorized else {
            return
        }
        guard previousState != .authorized else {
            return
        }
        guard !isRepairBackfillRunning else {
            return
        }
        guard !UserDefaults.standard.bool(forKey: Keys.repairBackfillCompleted) else {
            return
        }

        isRepairBackfillRunning = true
        defer { isRepairBackfillRunning = false }

        await queueStore.appendLog("Running one-time repair backfill (\(repairBackfillDays)d)")
        await refreshQueueState()

        let success = await syncRange(days: repairBackfillDays)
        if success {
            UserDefaults.standard.set(true, forKey: Keys.repairBackfillCompleted)
            await queueStore.appendLog("Repair backfill completed (\(repairBackfillDays)d)")
        } else {
            await queueStore.appendLog("Repair backfill failed; it will retry after next permission recovery")
        }

        await refreshQueueState()
    }

    private func startObserversIfNeeded() async {
        guard !observersStarted else {
            return
        }
        guard authorizationState == .authorized else {
            return
        }

        await healthService.startBackgroundObservers { [weak self] in
            Task { @MainActor [weak self] in
                self?.handleObserverSignal()
            }
        }

        observersStarted = true
    }

    private func handleObserverSignal() {
        let now = Date()

        if let lastObserverSyncRequestAt,
           now.timeIntervalSince(lastObserverSyncRequestAt) < observerSyncCooldownSeconds {
            return
        }

        lastObserverSyncRequestAt = now
        Task { [weak self] in
            guard let self else {
                return
            }
            _ = await self.syncNow(trigger: .healthObserver)
        }
    }

    private func restartForegroundAutoSyncLoop() {
        autoSyncTask?.cancel()
        autoSyncTask = nil

        guard settings.autoSyncEnabled else {
            nextScheduledAt = nil
            return
        }

        scheduleNextForegroundTick()

        autoSyncTask = Task { [weak self] in
            guard let self else {
                return
            }

            while !Task.isCancelled {
                let seconds = max(15 * 60, min(180 * 60, settings.syncIntervalMinutes * 60))
                try? await Task.sleep(nanoseconds: UInt64(seconds) * 1_000_000_000)
                if Task.isCancelled {
                    break
                }
                _ = await self.syncNow(trigger: .foregroundInterval)
            }
        }
    }

    private func scheduleNextForegroundTick() {
        guard settings.autoSyncEnabled else {
            nextScheduledAt = nil
            return
        }

        nextScheduledAt = Date(timeIntervalSinceNow: TimeInterval(settings.syncIntervalMinutes * 60))
    }

    private func rescheduleBackgroundTasks() {
        guard settings.autoSyncEnabled else {
            BackgroundSyncScheduler.shared.cancelAllScheduledTasks()
            return
        }
        BackgroundSyncScheduler.shared.scheduleNext(intervalMinutes: settings.syncIntervalMinutes)
    }

    private func refreshQueueState() async {
        pendingQueueCount = await queueStore.pendingCount()
        recentLogs = await queueStore.recentLogs(limit: 10)
    }

    private func refreshLastSyncFromStore() async {
        lastSyncAt = await anchorStore.lastSuccessfulSyncAt()
    }

    private func payloadDiagnostics(_ payload: MobileSyncPayload) -> String {
        let workoutsWithHeartRate = payload.workouts.filter { workout in
            let hasMetrics = workout.hrAvg != nil || workout.avgHeartRate != nil
            let hasSeries = !(workout.streams?.heartRateSeries?.isEmpty ?? true)
            return hasMetrics || hasSeries
        }.count

        let daysWithHeartRate = payload.dailyHealth.filter { day in
            day.heartRateAvgBpm != nil ||
                day.heartRateMinBpm != nil ||
                day.heartRateMaxBpm != nil ||
                day.restingHrBpm != nil
        }.count

        return "days \(payload.dailyHealth.count) (\(daysWithHeartRate) HR), workouts \(payload.workouts.count) (\(workoutsWithHeartRate) HR), deletions \(payload.deletions.count)"
    }

    private func openAppSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else {
            return
        }
        UIApplication.shared.open(url)
    }
}
