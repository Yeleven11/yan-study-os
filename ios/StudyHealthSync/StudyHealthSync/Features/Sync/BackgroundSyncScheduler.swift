import Foundation
import BackgroundTasks

final class BackgroundSyncScheduler {
    static let shared = BackgroundSyncScheduler()

    static let refreshTaskIdentifier = "com.yanborovyk.studyhealthsync.refresh"
    static let processingTaskIdentifier = "com.yanborovyk.studyhealthsync.processing"

    private var taskHandler: (@Sendable (SyncTrigger) async -> Bool)?

    private init() {}

    func register(taskHandler: @escaping @Sendable (SyncTrigger) async -> Bool) {
        self.taskHandler = taskHandler

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.refreshTaskIdentifier,
            using: nil
        ) { task in
            self.handleRefreshTask(task: task as! BGAppRefreshTask)
        }

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.processingTaskIdentifier,
            using: nil
        ) { task in
            self.handleProcessingTask(task: task as! BGProcessingTask)
        }
    }

    func scheduleNext(intervalMinutes: Int) {
        let minutes = max(15, min(intervalMinutes, 180))

        let refresh = BGAppRefreshTaskRequest(identifier: Self.refreshTaskIdentifier)
        refresh.earliestBeginDate = Date(timeIntervalSinceNow: TimeInterval(minutes * 60))

        do {
            try BGTaskScheduler.shared.submit(refresh)
        } catch {
            print("Failed to schedule BGAppRefreshTask: \(error.localizedDescription)")
        }

        let processing = BGProcessingTaskRequest(identifier: Self.processingTaskIdentifier)
        processing.requiresNetworkConnectivity = true
        processing.requiresExternalPower = false
        processing.earliestBeginDate = Date(timeIntervalSinceNow: TimeInterval(minutes * 60))

        do {
            try BGTaskScheduler.shared.submit(processing)
        } catch {
            print("Failed to schedule BGProcessingTask: \(error.localizedDescription)")
        }
    }

    private func handleRefreshTask(task: BGAppRefreshTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        Task {
            let success = await taskHandler?(.backgroundTask) ?? false
            scheduleNext(intervalMinutes: AppConfig.defaultIntervalMinutes)
            task.setTaskCompleted(success: success)
        }
    }

    private func handleProcessingTask(task: BGProcessingTask) {
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        Task {
            let success = await taskHandler?(.backgroundTask) ?? false
            scheduleNext(intervalMinutes: AppConfig.defaultIntervalMinutes)
            task.setTaskCompleted(success: success)
        }
    }
}
