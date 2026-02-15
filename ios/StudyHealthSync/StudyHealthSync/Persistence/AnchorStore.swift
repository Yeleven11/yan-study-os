import Foundation
import HealthKit

actor AnchorStore {
    private enum Keys {
        static let anchors = "sync.healthkit.anchors"
        static let lastSyncAt = "sync.healthkit.lastSuccessAt"
    }

    func anchor(for key: HealthSampleKey) -> HKQueryAnchor? {
        let anchors = readAnchorMap()
        guard let data = anchors[key.rawValue] else {
            return nil
        }
        return decodeAnchor(data)
    }

    func encodeAnchors(_ anchors: [HealthSampleKey: HKQueryAnchor]) -> [AnchorSnapshot] {
        anchors.compactMap { key, anchor in
            guard let data = encodeAnchor(anchor) else {
                return nil
            }
            return AnchorSnapshot(key: key.rawValue, encodedAnchor: data)
        }
    }

    func persist(anchorSnapshots: [AnchorSnapshot], lastSyncAt: Date) {
        var stored = readAnchorMap()
        for snapshot in anchorSnapshots {
            stored[snapshot.key] = snapshot.encodedAnchor
        }
        UserDefaults.standard.set(stored, forKey: Keys.anchors)
        UserDefaults.standard.set(lastSyncAt.timeIntervalSince1970, forKey: Keys.lastSyncAt)
    }

    func persistRawAnchorMap(_ map: [String: Data], lastSyncAt: Date) {
        UserDefaults.standard.set(map, forKey: Keys.anchors)
        UserDefaults.standard.set(lastSyncAt.timeIntervalSince1970, forKey: Keys.lastSyncAt)
    }

    func lastSuccessfulSyncAt() -> Date? {
        let timestamp = UserDefaults.standard.double(forKey: Keys.lastSyncAt)
        if timestamp <= 0 {
            return nil
        }
        return Date(timeIntervalSince1970: timestamp)
    }

    func rawAnchorMap() -> [String: Data] {
        readAnchorMap()
    }

    private func readAnchorMap() -> [String: Data] {
        UserDefaults.standard.dictionary(forKey: Keys.anchors) as? [String: Data] ?? [:]
    }

    private func encodeAnchor(_ anchor: HKQueryAnchor) -> Data? {
        try? NSKeyedArchiver.archivedData(withRootObject: anchor, requiringSecureCoding: true)
    }

    private func decodeAnchor(_ data: Data) -> HKQueryAnchor? {
        try? NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: data)
    }
}
