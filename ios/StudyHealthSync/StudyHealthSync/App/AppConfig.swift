import Foundation

enum AppConfig {
    private static let info = Bundle.main.infoDictionary ?? [:]

    static let syncBaseURL: String = {
        if let value = info["SyncBaseURL"] as? String, !value.trimmingCharacters(in: .whitespaces).isEmpty {
            return value
        }
        return "https://www.ibdp.study"
    }()

    static let syncEndpointPath: String = {
        if let value = info["SyncEndpointPath"] as? String, !value.trimmingCharacters(in: .whitespaces).isEmpty {
            return value
        }
        return "/api/integrations/health/mobile-sync"
    }()

    static let defaultToken: String = {
        (info["SyncBearerToken"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }()

    static let requestTimeoutSeconds: TimeInterval = {
        if let value = info["SyncRequestTimeoutSeconds"] as? String, let parsed = Double(value) {
            return parsed
        }
        if let value = info["SyncRequestTimeoutSeconds"] as? Double {
            return value
        }
        return 30
    }()

    static let defaultIntervalMinutes: Int = {
        if let value = info["SyncDefaultIntervalMinutes"] as? String, let parsed = Int(value) {
            return parsed
        }
        if let value = info["SyncDefaultIntervalMinutes"] as? Int {
            return value
        }
        return 30
    }()

    static let minimumIntervalMinutes: Int = {
        if let value = info["SyncMinIntervalMinutes"] as? String, let parsed = Int(value) {
            return parsed
        }
        if let value = info["SyncMinIntervalMinutes"] as? Int {
            return value
        }
        return 1
    }()

    static let maximumIntervalMinutes: Int = {
        if let value = info["SyncMaxIntervalMinutes"] as? String, let parsed = Int(value) {
            return parsed
        }
        if let value = info["SyncMaxIntervalMinutes"] as? Int {
            return value
        }
        return 180
    }()
}
