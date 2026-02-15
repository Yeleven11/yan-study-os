import Foundation
import HealthKit

struct MobileSyncPayload: Codable {
    let schemaVersion: Int
    let batchId: String
    let generatedAt: String
    let device: DeviceInfo
    let syncWindow: SyncWindow?
    let settings: SyncSettings?
    let dailyHealth: [DailyHealthPayload]
    let workouts: [WorkoutPayload]
    let deletions: [DeletionPayload]

    struct DeviceInfo: Codable {
        let deviceId: String
        let appVersion: String
        let osVersion: String
        let timezone: String
    }

    struct SyncWindow: Codable {
        let from: String?
        let to: String?
    }

    struct SyncSettings: Codable {
        let syncIntervalMinutes: Int
    }
}

struct DailyHealthPayload: Codable {
    let date: String
    let sleepHours: Double?
    let sleepAsleepHours: Double?
    let sleepInBedHours: Double?
    let sleepCoreHours: Double?
    let sleepDeepHours: Double?
    let sleepRemHours: Double?
    let sleepAwakeHours: Double?
    let hrvMs: Double?
    let restingHrBpm: Double?
    let heartRateMinBpm: Double?
    let heartRateMaxBpm: Double?
    let heartRateAvgBpm: Double?
    let respiratoryRateBpm: Double?
    let steps: Double?
    let walkRunDistanceKm: Double?
    let activeEnergyKj: Double?
    let restingEnergyKj: Double?
    let exerciseTimeMin: Double?
}

struct WorkoutPayload: Codable {
    let hkWorkoutUuid: String
    let workoutType: String
    let startedAt: String
    let endedAt: String
    let durationMin: Double
    let distanceKm: Double?
    let activeEnergyKj: Double?
    let restingEnergyKj: Double?
    let avgHeartRate: Double?
    let hrMin: Double?
    let hrMax: Double?
    let hrAvg: Double?
    let stepCount: Double?
    let streams: WorkoutStreamsPayload?
}

struct WorkoutStreamsPayload: Codable {
    let heartRateSeries: [TimeValuePoint]?
    let distanceSeries: [TimeValuePoint]?
    let stepSeries: [TimeValuePoint]?
    let activeEnergySeries: [TimeValuePoint]?
    let restingEnergySeries: [TimeValuePoint]?
}

struct TimeValuePoint: Codable {
    let timestamp: String
    let value: Double
}

struct DeletionPayload: Codable {
    let sampleType: String
    let uuid: String
    let deletedAt: String
}

struct MobileSyncResponse: Codable {
    let ok: Bool
    let importedHealthDays: Int
    let importedWorkouts: Int
    let updatedWorkouts: Int
    let filesProcessed: Int
    let filesSkipped: Int
    let linkedStreams: Int
    let duplicateBatch: Bool
    let serverTime: String
    let nextSuggestedSyncSeconds: Int
}

enum HealthSampleKey: String, CaseIterable {
    case workouts
    case heartRate
    case restingHeartRate
    case hrv
    case sleepAnalysis
    case steps
    case distanceWalkingRunning
    case activeEnergy
    case basalEnergy
    case respiratoryRate

    var identifier: String {
        switch self {
        case .workouts:
            return "HKWorkoutType"
        case .heartRate:
            return HKQuantityTypeIdentifier.heartRate.rawValue
        case .restingHeartRate:
            return HKQuantityTypeIdentifier.restingHeartRate.rawValue
        case .hrv:
            return HKQuantityTypeIdentifier.heartRateVariabilitySDNN.rawValue
        case .sleepAnalysis:
            return HKCategoryTypeIdentifier.sleepAnalysis.rawValue
        case .steps:
            return HKQuantityTypeIdentifier.stepCount.rawValue
        case .distanceWalkingRunning:
            return HKQuantityTypeIdentifier.distanceWalkingRunning.rawValue
        case .activeEnergy:
            return HKQuantityTypeIdentifier.activeEnergyBurned.rawValue
        case .basalEnergy:
            return HKQuantityTypeIdentifier.basalEnergyBurned.rawValue
        case .respiratoryRate:
            return HKQuantityTypeIdentifier.respiratoryRate.rawValue
        }
    }
}
