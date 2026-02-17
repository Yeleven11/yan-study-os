import Foundation

struct AnchorSnapshot: Codable {
    let key: String
    let encodedAnchor: Data
}

struct PendingSyncBatch: Codable, Identifiable {
    let id: String
    let createdAt: String
    var attemptCount: Int
    let payload: MobileSyncPayload
    let anchors: [AnchorSnapshot]
}

struct SyncAttemptLog: Codable, Identifiable {
    let id: String
    let timestamp: String
    let message: String
}

enum AuthorizationState: String {
    case unknown
    case authorized
    case denied
}

enum SyncTrigger: String {
    case appLaunch
    case foregroundInterval
    case manual
    case manualRange
    case backgroundTask
    case healthObserver
    case retryQueue
}
