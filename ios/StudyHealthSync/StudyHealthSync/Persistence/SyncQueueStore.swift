import Foundation

actor SyncQueueStore {
    private struct PersistedState: Codable {
        var batches: [PendingSyncBatch]
        var logs: [SyncAttemptLog]
    }

    private var batches: [PendingSyncBatch] = []
    private var logs: [SyncAttemptLog] = []

    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(filename: String = "sync-queue.json") {
        let baseURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let directory = baseURL.appendingPathComponent("StudyHealthSync", isDirectory: true)
        self.fileURL = directory.appendingPathComponent(filename)

        encoder.outputFormatting = [.prettyPrinted]
        let state = Self.loadState(decoder: decoder, fileURL: fileURL, directory: directory)
        self.batches = state.batches
        self.logs = state.logs
    }

    func pendingCount() -> Int {
        batches.count
    }

    func pendingBatches() -> [PendingSyncBatch] {
        batches
    }

    func nextBatch() -> PendingSyncBatch? {
        batches.first
    }

    func enqueue(payload: MobileSyncPayload, anchors: [AnchorSnapshot]) {
        let batch = PendingSyncBatch(
            id: payload.batchId,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            attemptCount: 0,
            payload: payload,
            anchors: anchors
        )

        batches.append(batch)
        appendLog("Enqueued batch \(payload.batchId). Pending queue: \(batches.count)")
        saveState()
    }

    func removeBatch(id: String) {
        batches.removeAll { $0.id == id }
        appendLog("Completed batch \(id). Pending queue: \(batches.count)")
        saveState()
    }

    func incrementAttempts(for id: String, reason: String) {
        guard let index = batches.firstIndex(where: { $0.id == id }) else {
            return
        }
        batches[index].attemptCount += 1
        appendLog("Retry \(batches[index].attemptCount) for batch \(id): \(reason)")
        saveState()
    }

    func recentLogs(limit: Int = 12) -> [SyncAttemptLog] {
        Array(logs.suffix(limit)).reversed()
    }

    func appendLog(_ message: String) {
        logs.append(
            SyncAttemptLog(
                id: UUID().uuidString,
                timestamp: ISO8601DateFormatter().string(from: Date()),
                message: message
            )
        )
        if logs.count > 120 {
            logs.removeFirst(logs.count - 120)
        }
        saveState()
    }

    private static func loadState(decoder: JSONDecoder, fileURL: URL, directory: URL) -> PersistedState {
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let data = try Data(contentsOf: fileURL)
            let persisted = try decoder.decode(PersistedState.self, from: data)
            return persisted
        } catch {
            return PersistedState(batches: [], logs: [])
        }
    }

    private func saveState() {
        let persisted = PersistedState(batches: batches, logs: logs)
        do {
            let data = try encoder.encode(persisted)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            print("Failed to persist queue: \(error.localizedDescription)")
        }
    }
}
