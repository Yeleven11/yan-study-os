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
    @Published private(set) var nextSyncWindowFrom: Date?
    @Published private(set) var nextSyncWindowTo: Date?
    @Published private(set) var nextSyncWindowLabel: String = "-"
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
    private let initialLookbackDays = 120

    private enum Keys {
        static let repairBackfillCompleted = "sync.healthkit.repairBackfillCompleted"
        static let schedulerNextPlannedAt = "sync.scheduler.nextPlannedAt"
        static let schedulerIntervalAtSchedule = "sync.scheduler.intervalAtSchedule"
    }

    private enum ScheduleRestoreResult {
        case restored(Date)
        case initialized(Date)
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

        Task {
            await refreshQueueState()
            await refreshLastSyncFromStore()
            switch restoreOrInitializeNextScheduledAt() {
            case let .restored(date):
                await queueStore.appendLog("Restored planned sync at \(DateFormatting.absolute(date)).")
            case let .initialized(date):
                await queueStore.appendLog("Initialized planned sync at \(DateFormatting.absolute(date)).")
            case .none:
                break
            }

            let ranDueSync = await runDueSyncIfNeededOnStart()
            if !ranDueSync {
                _ = await syncNow(trigger: .appLaunch)
            }
            restartForegroundAutoSyncLoop()
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
                rescheduleBackgroundTasks()
                return false
            }
        }

        guard let baseURL = settings.resolvedBaseURL else {
            lastErrorMessage = "Base URL is invalid."
            await queueStore.appendLog("Sync failed: invalid base URL")
            await refreshQueueState()
            rescheduleBackgroundTasks()
            return false
        }

        isSyncing = true
        lastAttemptAt = Date()
        refreshNextSyncWindowPreview()
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
            rescheduleBackgroundTasks()
            isSyncing = false
            return true
        } catch {
            let message = error.localizedDescription
            lastErrorMessage = message
            await queueStore.appendLog("Sync error (\(trigger.rawValue)): \(message)")
            await refreshQueueState()
            rescheduleBackgroundTasks()
            isSyncing = false
            return false
        }
    }

    func applySettingsAndReschedule() {
        restartForegroundAutoSyncLoop()
        rescheduleBackgroundTasks()
    }

    func handleSyncIntervalChanged() {
        resetScheduleFromNow()
        Task {
            await queueStore.appendLog(
                "Sync interval changed to \(settings.syncIntervalMinutes)m. Planned sync reset to \(DateFormatting.absolute(nextScheduledAt))."
            )
            await refreshQueueState()
        }
        applySettingsAndReschedule()
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
                rescheduleBackgroundTasks()
                return false
            }
        }

        guard let baseURL = settings.resolvedBaseURL else {
            lastErrorMessage = "Base URL is invalid."
            await queueStore.appendLog("Range upload failed: invalid base URL")
            await refreshQueueState()
            rescheduleBackgroundTasks()
            return false
        }

        isSyncing = true
        lastAttemptAt = Date()
        refreshNextSyncWindowPreview()
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
            rescheduleBackgroundTasks()
            isSyncing = false
            return true
        } catch {
            let message = error.localizedDescription
            lastErrorMessage = message
            await queueStore.appendLog("Range upload error (\(boundedDays)d): \(message)")
            await refreshQueueState()
            rescheduleBackgroundTasks()
            isSyncing = false
            return false
        }
    }

    private func flushPendingQueue(baseURL: URL) async throws {
        let pendingBefore = await queueStore.pendingCount()
        let removed = await queueStore.discardAllButLatest()
        if removed > 0 {
            await queueStore.appendLog("Compacted pending queue from \(pendingBefore) to 1 (latest-only).")
            await refreshQueueState()
        }

        guard let batch = await queueStore.latestBatch() else {
            return
        }

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
        refreshNextSyncWindowPreview()

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
            clearPersistedSchedule()
            refreshNextSyncWindowPreview()
            return
        }

        if nextScheduledAt == nil {
            _ = restoreOrInitializeNextScheduledAt()
        }

        autoSyncTask = Task { [weak self] in
            guard let self else {
                return
            }

            while !Task.isCancelled {
                guard settings.autoSyncEnabled else {
                    break
                }
                guard let scheduledAt = nextScheduledAt else {
                    _ = restoreOrInitializeNextScheduledAt()
                    continue
                }

                let secondsUntilDue = max(0, scheduledAt.timeIntervalSinceNow)
                if secondsUntilDue > 0 {
                    try? await Task.sleep(nanoseconds: UInt64(secondsUntilDue * 1_000_000_000))
                }
                if Task.isCancelled {
                    break
                }

                guard let dueAt = nextScheduledAt else {
                    continue
                }
                if Date() < dueAt {
                    continue
                }

                await queueStore.appendLog("Auto-sync due. Estimated window: \(nextSyncWindowLabel)")
                let runNow = Date()
                _ = await self.syncNow(trigger: .foregroundInterval)
                self.advanceScheduleAfterRun(now: runNow)
            }
        }
    }

    private func rescheduleBackgroundTasks() {
        guard settings.autoSyncEnabled else {
            BackgroundSyncScheduler.shared.cancelAllScheduledTasks()
            return
        }
        BackgroundSyncScheduler.shared.scheduleNext(intervalMinutes: settings.syncIntervalMinutes)
    }

    private func restoreOrInitializeNextScheduledAt() -> ScheduleRestoreResult? {
        guard settings.autoSyncEnabled else {
            nextScheduledAt = nil
            clearPersistedSchedule()
            refreshNextSyncWindowPreview()
            return nil
        }

        let storedTimestamp = UserDefaults.standard.double(forKey: Keys.schedulerNextPlannedAt)
        let storedInterval = UserDefaults.standard.integer(forKey: Keys.schedulerIntervalAtSchedule)
        if storedTimestamp > 0, storedInterval == settings.syncIntervalMinutes {
            let restored = Date(timeIntervalSince1970: storedTimestamp)
            nextScheduledAt = restored
            refreshNextSyncWindowPreview()
            return .restored(restored)
        }

        let initialized = Date(timeIntervalSinceNow: TimeInterval(settings.syncIntervalMinutes * 60))
        persistNextScheduledAt(initialized)
        return .initialized(initialized)
    }

    private func runDueSyncIfNeededOnStart() async -> Bool {
        guard settings.autoSyncEnabled else {
            return false
        }
        guard let planned = nextScheduledAt else {
            return false
        }
        guard planned <= Date() else {
            return false
        }

        await queueStore.appendLog(
            "Planned sync was overdue (\(DateFormatting.absolute(planned))). Running once now."
        )
        await refreshQueueState()

        let runNow = Date()
        _ = await syncNow(trigger: .foregroundInterval)
        advanceScheduleAfterRun(now: runNow)
        return true
    }

    private func persistNextScheduledAt(_ date: Date) {
        nextScheduledAt = date
        UserDefaults.standard.set(date.timeIntervalSince1970, forKey: Keys.schedulerNextPlannedAt)
        UserDefaults.standard.set(settings.syncIntervalMinutes, forKey: Keys.schedulerIntervalAtSchedule)
        refreshNextSyncWindowPreview()
    }

    private func clearPersistedSchedule() {
        UserDefaults.standard.removeObject(forKey: Keys.schedulerNextPlannedAt)
        UserDefaults.standard.removeObject(forKey: Keys.schedulerIntervalAtSchedule)
    }

    private func resetScheduleFromNow() {
        guard settings.autoSyncEnabled else {
            nextScheduledAt = nil
            clearPersistedSchedule()
            refreshNextSyncWindowPreview()
            return
        }

        clearPersistedSchedule()
        let next = Date(timeIntervalSinceNow: TimeInterval(settings.syncIntervalMinutes * 60))
        persistNextScheduledAt(next)
    }

    private func advanceScheduleAfterRun(now: Date) {
        guard settings.autoSyncEnabled else {
            nextScheduledAt = nil
            clearPersistedSchedule()
            refreshNextSyncWindowPreview()
            return
        }

        let intervalSeconds = TimeInterval(settings.syncIntervalMinutes * 60)
        let base = nextScheduledAt ?? now
        let next: Date
        if base <= now {
            let elapsed = now.timeIntervalSince(base)
            let intervalsToAdvance = floor(elapsed / intervalSeconds) + 1
            next = base.addingTimeInterval(intervalSeconds * intervalsToAdvance)
        } else {
            next = base.addingTimeInterval(intervalSeconds)
        }

        persistNextScheduledAt(next)
    }

    private func refreshNextSyncWindowPreview() {
        nextSyncWindowFrom = lastSyncAt
        nextSyncWindowTo = nextScheduledAt
        nextSyncWindowLabel = DateFormatting.syncWindow(
            from: nextSyncWindowFrom,
            to: nextSyncWindowTo,
            initialLookbackDays: initialLookbackDays
        )
    }

    private func refreshQueueState() async {
        pendingQueueCount = await queueStore.pendingCount()
        recentLogs = await queueStore.recentLogs(limit: 10)
    }

    private func refreshLastSyncFromStore() async {
        lastSyncAt = await anchorStore.lastSuccessfulSyncAt()
        refreshNextSyncWindowPreview()
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
