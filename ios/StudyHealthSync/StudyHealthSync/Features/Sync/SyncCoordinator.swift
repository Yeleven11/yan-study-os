import Foundation
import Combine

@MainActor
final class SyncCoordinator: ObservableObject {
    @Published private(set) var authorizationState: AuthorizationState = .unknown
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
            await updateAuthorizationState()
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
            do {
                try await healthService.requestAuthorization()
                await updateAuthorizationState()
                if authorizationState == .authorized {
                    await startObserversIfNeeded()
                }
                _ = await syncNow(trigger: .manual)
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

    func syncNow(trigger: SyncTrigger) async -> Bool {
        if isSyncing {
            return false
        }

        if authorizationState != .authorized {
            await updateAuthorizationState()
            if authorizationState != .authorized {
                lastErrorMessage = "Health permissions are required before syncing."
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

                let map = Dictionary(uniqueKeysWithValues: batch.anchors.map { ($0.key, $0.encodedAnchor) })
                await anchorStore.persistRawAnchorMap(map, lastSyncAt: Date())
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

        let map = Dictionary(uniqueKeysWithValues: anchorSnapshots.map { ($0.key, $0.encodedAnchor) })
        await anchorStore.persistRawAnchorMap(map, lastSyncAt: Date())
        lastSyncAt = Date()

        await queueStore.appendLog(
            "Sync ok (\(trigger.rawValue)): +\(response.importedHealthDays) days, +\(response.importedWorkouts) workouts, updated \(response.updatedWorkouts)"
        )

        return response
    }

    private func updateAuthorizationState() async {
        authorizationState = await healthService.authorizationState()
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
        BackgroundSyncScheduler.shared.scheduleNext(intervalMinutes: settings.syncIntervalMinutes)
    }

    private func refreshQueueState() async {
        pendingQueueCount = await queueStore.pendingCount()
        recentLogs = await queueStore.recentLogs(limit: 10)
    }

    private func refreshLastSyncFromStore() async {
        lastSyncAt = await anchorStore.lastSuccessfulSyncAt()
    }
}
