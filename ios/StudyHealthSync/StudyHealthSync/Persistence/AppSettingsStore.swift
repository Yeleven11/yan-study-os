import Foundation
import Combine

@MainActor
final class AppSettingsStore: ObservableObject {
    @Published var baseURL: String {
        didSet {
            UserDefaults.standard.set(baseURL, forKey: Keys.baseURL)
        }
    }

    @Published var syncIntervalMinutes: Int {
        didSet {
            let bounded = clampInterval(syncIntervalMinutes)
            if bounded != syncIntervalMinutes {
                syncIntervalMinutes = bounded
                return
            }
            UserDefaults.standard.set(syncIntervalMinutes, forKey: Keys.syncIntervalMinutes)
        }
    }

    @Published var autoSyncEnabled: Bool {
        didSet {
            UserDefaults.standard.set(autoSyncEnabled, forKey: Keys.autoSyncEnabled)
        }
    }

    @Published var token: String {
        didSet {
            persistToken(token)
        }
    }

    let endpointPath: String
    let timeoutSeconds: TimeInterval
    let minIntervalMinutes: Int
    let maxIntervalMinutes: Int

    private enum Keys {
        static let baseURL = "sync.baseURL"
        static let syncIntervalMinutes = "sync.intervalMinutes"
        static let autoSyncEnabled = "sync.autoEnabled"
    }

    private enum SecureKeys {
        static let service = "com.yanborovyk.studyhealthsync"
        static let account = "syncBearerToken"
    }

    init() {
        self.endpointPath = AppConfig.syncEndpointPath
        self.timeoutSeconds = AppConfig.requestTimeoutSeconds
        self.minIntervalMinutes = AppConfig.minimumIntervalMinutes
        self.maxIntervalMinutes = AppConfig.maximumIntervalMinutes

        self.baseURL = UserDefaults.standard.string(forKey: Keys.baseURL) ?? AppConfig.syncBaseURL
        self.syncIntervalMinutes = UserDefaults.standard.object(forKey: Keys.syncIntervalMinutes) as? Int
            ?? AppConfig.defaultIntervalMinutes
        self.autoSyncEnabled = UserDefaults.standard.object(forKey: Keys.autoSyncEnabled) as? Bool ?? true
        self.token = KeychainStore.get(service: SecureKeys.service, account: SecureKeys.account)
            ?? AppConfig.defaultToken

        self.syncIntervalMinutes = clampInterval(self.syncIntervalMinutes)
    }

    var resolvedBaseURL: URL? {
        URL(string: baseURL.trimmingCharacters(in: .whitespacesAndNewlines))
    }

    func clearToken() {
        token = ""
        KeychainStore.delete(service: SecureKeys.service, account: SecureKeys.account)
    }

    private func clampInterval(_ minutes: Int) -> Int {
        min(max(minutes, minIntervalMinutes), maxIntervalMinutes)
    }

    private func persistToken(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            KeychainStore.delete(service: SecureKeys.service, account: SecureKeys.account)
            return
        }

        do {
            try KeychainStore.set(value: trimmed, service: SecureKeys.service, account: SecureKeys.account)
        } catch {
            print("Keychain save failed: \(error.localizedDescription)")
        }
    }
}
