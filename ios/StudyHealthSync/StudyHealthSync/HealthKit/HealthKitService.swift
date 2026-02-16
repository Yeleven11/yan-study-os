import Foundation
import HealthKit
import UIKit

struct HealthDeltaBatch {
    let payload: MobileSyncPayload
    let anchorSnapshots: [AnchorSnapshot]
}

actor HealthKitService {
    private enum Keys {
        static let requestedAuthorization = "sync.healthkit.requestedAuthorization"
    }

    private let healthStore = HKHealthStore()
    private let anchorStore: AnchorStore
    private var observerQueries: [HKObserverQuery] = []

    init(anchorStore: AnchorStore) {
        self.anchorStore = anchorStore
    }

    func authorizationState() async -> AuthorizationState {
        guard HKHealthStore.isHealthDataAvailable() else {
            return .denied
        }

        let hasRequested = UserDefaults.standard.bool(forKey: Keys.requestedAuthorization)
        if !hasRequested {
            return .unknown
        }

        do {
            let canRead = try await probeReadAuthorization()
            return canRead ? .authorized : .denied
        } catch {
            print("Authorization probe failed: \(error.localizedDescription)")
            return .unknown
        }
    }

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw NSError(
                domain: "HealthKitService",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Health data is not available on this device"]
            )
        }

        try await healthStore.requestAuthorization(toShare: [], read: readTypes())
        UserDefaults.standard.set(true, forKey: Keys.requestedAuthorization)
    }

    func startBackgroundObservers(onUpdate: @escaping @Sendable () -> Void) {
        observerQueries.forEach { healthStore.stop($0) }
        observerQueries.removeAll()

        for key in HealthSampleKey.allCases {
            guard let sampleType = sampleType(for: key) else {
                continue
            }

            let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { _, completionHandler, error in
                defer { completionHandler() }

                if let error {
                    print("Observer error for \(key.rawValue): \(error.localizedDescription)")
                    return
                }

                onUpdate()
            }

            observerQueries.append(query)
            healthStore.execute(query)
            enableBackgroundDeliveryIfNeeded(for: sampleType)
        }
    }

    func collectDelta(intervalMinutes: Int) async throws -> HealthDeltaBatch? {
        let now = Date()
        let lastSync = await anchorStore.lastSuccessfulSyncAt()
        let initialLookbackStart = Calendar.current.date(byAdding: .day, value: -120, to: now)

        var changedByKey: [HealthSampleKey: [HKSample]] = [:]
        var deletedPayloads: [DeletionPayload] = []
        var nextAnchors: [HealthSampleKey: HKQueryAnchor] = [:]
        var touchedDates = Set<String>()
        var minDate: Date?
        var maxDate: Date?

        for key in HealthSampleKey.allCases {
            guard let sampleType = sampleType(for: key) else {
                continue
            }

            let currentAnchor = await anchorStore.anchor(for: key)
            let predicate: NSPredicate?
            if currentAnchor == nil, let initialLookbackStart {
                predicate = HKQuery.predicateForSamples(
                    withStart: initialLookbackStart,
                    end: nil,
                    options: .strictStartDate
                )
            } else {
                predicate = nil
            }

            let result = try await runAnchoredQuery(
                sampleType: sampleType,
                predicate: predicate,
                anchor: currentAnchor
            )

            nextAnchors[key] = result.newAnchor
            changedByKey[key] = result.samples

            for sample in result.samples {
                touchedDates.insert(sample.startDate.dateKey)
                touchedDates.insert(sample.endDate.dateKey)
                minDate = minDate.map { min($0, sample.startDate) } ?? sample.startDate
                maxDate = maxDate.map { max($0, sample.endDate) } ?? sample.endDate
            }

            deletedPayloads.append(
                contentsOf: result.deleted.map {
                    DeletionPayload(
                        sampleType: key.identifier,
                        uuid: $0.uuid.uuidString,
                        deletedAt: now.isoTimestamp
                    )
                }
            )
        }

        if touchedDates.isEmpty, lastSync == nil {
            for offset in 0..<14 {
                if let day = Calendar.current.date(byAdding: .day, value: -offset, to: now) {
                    touchedDates.insert(day.dateKey)
                }
            }
        }

        let dailyHealth = try await buildDailyHealthPayload(for: touchedDates)
        let workouts = try await buildWorkoutPayloads(changedByKey[.workouts] ?? [])

        let hasMeaningfulPayload = !dailyHealth.isEmpty || !workouts.isEmpty || !deletedPayloads.isEmpty
        guard hasMeaningfulPayload else {
            return nil
        }

        let deviceInfo = await MainActor.run {
            MobileSyncPayload.DeviceInfo(
                deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "ios-device",
                appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0",
                osVersion: UIDevice.current.systemVersion,
                timezone: TimeZone.current.identifier
            )
        }

        let payload = MobileSyncPayload(
            schemaVersion: 1,
            batchId: UUID().uuidString.lowercased(),
            generatedAt: now.isoTimestamp,
            device: deviceInfo,
            syncWindow: .init(
                from: minDate?.isoTimestamp,
                to: maxDate?.isoTimestamp
            ),
            settings: .init(syncIntervalMinutes: intervalMinutes),
            dailyHealth: dailyHealth,
            workouts: workouts,
            deletions: deletedPayloads
        )

        let snapshots = await anchorStore.encodeAnchors(nextAnchors)
        return HealthDeltaBatch(payload: payload, anchorSnapshots: snapshots)
    }

    private func readTypes() -> Set<HKObjectType> {
        var types: Set<HKObjectType> = [HKObjectType.workoutType()]

        let quantityIds: [HKQuantityTypeIdentifier] = [
            .heartRate,
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .stepCount,
            .distanceWalkingRunning,
            .activeEnergyBurned,
            .basalEnergyBurned,
            .respiratoryRate,
        ]

        for id in quantityIds {
            if let type = HKObjectType.quantityType(forIdentifier: id) {
                types.insert(type)
            }
        }

        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleep)
        }

        return types
    }

    private func sampleType(for key: HealthSampleKey) -> HKSampleType? {
        switch key {
        case .workouts:
            return HKObjectType.workoutType()
        case .heartRate:
            return HKObjectType.quantityType(forIdentifier: .heartRate)
        case .restingHeartRate:
            return HKObjectType.quantityType(forIdentifier: .restingHeartRate)
        case .hrv:
            return HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
        case .sleepAnalysis:
            return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
        case .steps:
            return HKObjectType.quantityType(forIdentifier: .stepCount)
        case .distanceWalkingRunning:
            return HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)
        case .activeEnergy:
            return HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)
        case .basalEnergy:
            return HKObjectType.quantityType(forIdentifier: .basalEnergyBurned)
        case .respiratoryRate:
            return HKObjectType.quantityType(forIdentifier: .respiratoryRate)
        }
    }

    private func runAnchoredQuery(
        sampleType: HKSampleType,
        predicate: NSPredicate?,
        anchor: HKQueryAnchor?
    ) async throws -> (samples: [HKSample], deleted: [HKDeletedObject], newAnchor: HKQueryAnchor?) {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKAnchoredObjectQuery(
                type: sampleType,
                predicate: predicate,
                anchor: anchor,
                limit: HKObjectQueryNoLimit
            ) { _, samples, deleted, newAnchor, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                continuation.resume(
                    returning: (
                        samples ?? [],
                        deleted ?? [],
                        newAnchor
                    )
                )
            }

            healthStore.execute(query)
        }
    }

    private func runSampleQuery<T: HKSample>(
        sampleType: HKSampleType,
        predicate: NSPredicate,
        sortDescriptors: [NSSortDescriptor] = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
    ) async throws -> [T] {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sampleType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: sortDescriptors
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                continuation.resume(returning: samples as? [T] ?? [])
            }

            healthStore.execute(query)
        }
    }

    private func buildDailyHealthPayload(for dateKeys: Set<String>) async throws -> [DailyHealthPayload] {
        let sortedDateKeys = dateKeys.sorted()
        guard !sortedDateKeys.isEmpty else {
            return []
        }

        var result: [DailyHealthPayload] = []

        for dateKey in sortedDateKeys {
            guard let dayStart = dateKey.dayStart,
                  let dayEnd = Calendar.current.date(byAdding: .day, value: 1, to: dayStart)
            else {
                continue
            }

            let quantities = try await fetchDailyQuantities(dayStart: dayStart, dayEnd: dayEnd)
            let sleep = try await fetchDailySleep(dayStart: dayStart, dayEnd: dayEnd)

            let payload = DailyHealthPayload(
                date: dateKey,
                sleepHours: sleep.totalSleepHours,
                sleepAsleepHours: sleep.asleepHours,
                sleepInBedHours: sleep.inBedHours,
                sleepCoreHours: sleep.coreHours,
                sleepDeepHours: sleep.deepHours,
                sleepRemHours: sleep.remHours,
                sleepAwakeHours: sleep.awakeHours,
                hrvMs: quantities.hrvMs,
                restingHrBpm: quantities.restingHr,
                heartRateMinBpm: quantities.hrMin,
                heartRateMaxBpm: quantities.hrMax,
                heartRateAvgBpm: quantities.hrAvg,
                respiratoryRateBpm: quantities.respiratoryRate,
                steps: quantities.steps,
                walkRunDistanceKm: quantities.distanceKm,
                activeEnergyKj: quantities.activeEnergyKj,
                restingEnergyKj: quantities.basalEnergyKj,
                exerciseTimeMin: quantities.exerciseMinutes
            )

            result.append(payload)
        }

        return result
    }

    private func buildWorkoutPayloads(_ samples: [HKSample]) async throws -> [WorkoutPayload] {
        let workouts = samples.compactMap { $0 as? HKWorkout }
        guard !workouts.isEmpty else {
            return []
        }

        var payloads: [WorkoutPayload] = []

        for workout in workouts {
            let rangePredicate = HKQuery.predicateForSamples(
                withStart: workout.startDate,
                end: workout.endDate,
                options: [.strictStartDate, .strictEndDate]
            )

            let heartRateSamples: [HKQuantitySample] = try await fetchQuantitySamples(
                identifier: .heartRate,
                predicate: rangePredicate
            )
            let distanceSamples: [HKQuantitySample] = try await fetchQuantitySamples(
                identifier: .distanceWalkingRunning,
                predicate: rangePredicate
            )
            let stepSamples: [HKQuantitySample] = try await fetchQuantitySamples(
                identifier: .stepCount,
                predicate: rangePredicate
            )
            let activeEnergySamples: [HKQuantitySample] = try await fetchQuantitySamples(
                identifier: .activeEnergyBurned,
                predicate: rangePredicate
            )
            let basalEnergySamples: [HKQuantitySample] = try await fetchQuantitySamples(
                identifier: .basalEnergyBurned,
                predicate: rangePredicate
            )

            let hrSeries = heartRateSamples
                .map { TimeValuePoint(timestamp: $0.endDate.isoTimestamp, value: $0.quantity.doubleValue(for: .beatsPerMinute)) }
                .sorted(by: { $0.timestamp < $1.timestamp })
            let distanceSeries = distanceSamples
                .map { TimeValuePoint(timestamp: $0.endDate.isoTimestamp, value: $0.quantity.doubleValue(for: .meters) / 1000.0) }
                .sorted(by: { $0.timestamp < $1.timestamp })
            let stepSeries = stepSamples
                .map { TimeValuePoint(timestamp: $0.endDate.isoTimestamp, value: $0.quantity.doubleValue(for: .count())) }
                .sorted(by: { $0.timestamp < $1.timestamp })
            let activeEnergySeries = activeEnergySamples
                .map { TimeValuePoint(timestamp: $0.endDate.isoTimestamp, value: $0.quantity.doubleValue(for: .kilojoule)) }
                .sorted(by: { $0.timestamp < $1.timestamp })
            let restingEnergySeries = basalEnergySamples
                .map { TimeValuePoint(timestamp: $0.endDate.isoTimestamp, value: $0.quantity.doubleValue(for: .kilojoule)) }
                .sorted(by: { $0.timestamp < $1.timestamp })

            let hrValues = hrSeries.map { $0.value }
            let avgHeartRate = hrValues.isEmpty ? nil : hrValues.reduce(0, +) / Double(hrValues.count)
            let hrMin = hrValues.min()
            let hrMax = hrValues.max()
            let distanceFromSamples = distanceSeries.reduce(0) { $0 + $1.value }
            let stepCount = stepSeries.reduce(0) { $0 + $1.value }
            let activeEnergyFromSamples = activeEnergySeries.reduce(0) { $0 + $1.value }
            let restingEnergyFromSamples = restingEnergySeries.reduce(0) { $0 + $1.value }

            let payload = WorkoutPayload(
                hkWorkoutUuid: workout.uuid.uuidString,
                workoutType: workout.workoutActivityType.syncName,
                startedAt: workout.startDate.isoTimestamp,
                endedAt: workout.endDate.isoTimestamp,
                durationMin: workout.duration / 60,
                distanceKm: {
                    if let totalDistance = workout.totalDistance?.doubleValue(for: .meters) {
                        return totalDistance / 1000.0
                    }
                    return distanceFromSamples > 0 ? distanceFromSamples : nil
                }(),
                activeEnergyKj: workout.totalEnergyBurned?.doubleValue(for: .kilojoule) ?? (activeEnergyFromSamples > 0 ? activeEnergyFromSamples : nil),
                restingEnergyKj: restingEnergyFromSamples > 0 ? restingEnergyFromSamples : nil,
                avgHeartRate: avgHeartRate,
                hrMin: hrMin,
                hrMax: hrMax,
                hrAvg: avgHeartRate,
                stepCount: stepCount > 0 ? stepCount : nil,
                streams: WorkoutStreamsPayload(
                    heartRateSeries: hrSeries.isEmpty ? nil : hrSeries,
                    distanceSeries: distanceSeries.isEmpty ? nil : distanceSeries,
                    stepSeries: stepSeries.isEmpty ? nil : stepSeries,
                    activeEnergySeries: activeEnergySeries.isEmpty ? nil : activeEnergySeries,
                    restingEnergySeries: restingEnergySeries.isEmpty ? nil : restingEnergySeries
                )
            )

            payloads.append(payload)
        }

        return payloads
    }

    private func fetchQuantitySamples(
        identifier: HKQuantityTypeIdentifier,
        predicate: NSPredicate
    ) async throws -> [HKQuantitySample] {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else {
            return []
        }
        return try await runSampleQuery(sampleType: type, predicate: predicate)
    }

    private func fetchDailyQuantities(dayStart: Date, dayEnd: Date) async throws -> (
        hrvMs: Double?,
        restingHr: Double?,
        hrMin: Double?,
        hrMax: Double?,
        hrAvg: Double?,
        respiratoryRate: Double?,
        steps: Double?,
        distanceKm: Double?,
        activeEnergyKj: Double?,
        basalEnergyKj: Double?,
        exerciseMinutes: Double?
    ) {
        let predicate = HKQuery.predicateForSamples(withStart: dayStart, end: dayEnd, options: [.strictStartDate, .strictEndDate])

        async let heartRateSamples = fetchQuantitySamples(identifier: .heartRate, predicate: predicate)
        async let restingHeartRateSamples = fetchQuantitySamples(identifier: .restingHeartRate, predicate: predicate)
        async let hrvSamples = fetchQuantitySamples(identifier: .heartRateVariabilitySDNN, predicate: predicate)
        async let respiratorySamples = fetchQuantitySamples(identifier: .respiratoryRate, predicate: predicate)
        async let stepSamples = fetchQuantitySamples(identifier: .stepCount, predicate: predicate)
        async let distanceSamples = fetchQuantitySamples(identifier: .distanceWalkingRunning, predicate: predicate)
        async let activeEnergySamples = fetchQuantitySamples(identifier: .activeEnergyBurned, predicate: predicate)
        async let basalEnergySamples = fetchQuantitySamples(identifier: .basalEnergyBurned, predicate: predicate)

        let workouts: [HKWorkout] = try await runSampleQuery(
            sampleType: HKObjectType.workoutType(),
            predicate: predicate
        )

        let heartRates = try await heartRateSamples.map {
            $0.quantity.doubleValue(for: .beatsPerMinute)
        }
        let restingHeartRates = try await restingHeartRateSamples.map {
            $0.quantity.doubleValue(for: .beatsPerMinute)
        }
        let hrvValues = try await hrvSamples.map {
            $0.quantity.doubleValue(for: .milliseconds)
        }
        let respiratoryValues = try await respiratorySamples.map {
            $0.quantity.doubleValue(for: .beatsPerMinute)
        }
        let steps = try await stepSamples.reduce(0.0) {
            $0 + $1.quantity.doubleValue(for: .count())
        }
        let distanceKm = try await distanceSamples.reduce(0.0) {
            $0 + ($1.quantity.doubleValue(for: .meters) / 1000.0)
        }
        let activeEnergyKj = try await activeEnergySamples.reduce(0.0) {
            $0 + $1.quantity.doubleValue(for: .kilojoule)
        }
        let basalEnergyKj = try await basalEnergySamples.reduce(0.0) {
            $0 + $1.quantity.doubleValue(for: .kilojoule)
        }

        let exerciseMinutes = workouts.reduce(0.0) { sum, workout in
            sum + (workout.duration / 60.0)
        }

        return (
            hrvValues.average,
            restingHeartRates.average,
            heartRates.min(),
            heartRates.max(),
            heartRates.average,
            respiratoryValues.average,
            steps > 0 ? steps : nil,
            distanceKm > 0 ? distanceKm : nil,
            activeEnergyKj > 0 ? activeEnergyKj : nil,
            basalEnergyKj > 0 ? basalEnergyKj : nil,
            exerciseMinutes > 0 ? exerciseMinutes : nil
        )
    }

    private func fetchDailySleep(dayStart: Date, dayEnd: Date) async throws -> (
        totalSleepHours: Double?,
        asleepHours: Double?,
        inBedHours: Double?,
        coreHours: Double?,
        deepHours: Double?,
        remHours: Double?,
        awakeHours: Double?
    ) {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            return (nil, nil, nil, nil, nil, nil, nil)
        }

        let start = Calendar.current.date(byAdding: .hour, value: -12, to: dayStart) ?? dayStart
        let end = Calendar.current.date(byAdding: .hour, value: 12, to: dayEnd) ?? dayEnd

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let samples: [HKCategorySample] = try await runSampleQuery(sampleType: sleepType, predicate: predicate)

        var asleepSeconds = 0.0
        var inBedSeconds = 0.0
        var coreSeconds = 0.0
        var deepSeconds = 0.0
        var remSeconds = 0.0
        var awakeSeconds = 0.0

        for sample in samples {
            let overlapStart = max(sample.startDate, dayStart)
            let overlapEnd = min(sample.endDate, dayEnd)
            guard overlapEnd > overlapStart else {
                continue
            }

            let duration = overlapEnd.timeIntervalSince(overlapStart)
            switch sample.value {
            case HKCategoryValueSleepAnalysis.inBed.rawValue:
                inBedSeconds += duration
            case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                asleepSeconds += duration
            case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                coreSeconds += duration
                asleepSeconds += duration
            case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                deepSeconds += duration
                asleepSeconds += duration
            case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                remSeconds += duration
                asleepSeconds += duration
            case HKCategoryValueSleepAnalysis.awake.rawValue:
                awakeSeconds += duration
            default:
                break
            }
        }

        let totalSleepHours = asleepSeconds > 0 ? asleepSeconds / 3600.0 : nil

        return (
            totalSleepHours,
            asleepSeconds > 0 ? asleepSeconds / 3600.0 : nil,
            inBedSeconds > 0 ? inBedSeconds / 3600.0 : nil,
            coreSeconds > 0 ? coreSeconds / 3600.0 : nil,
            deepSeconds > 0 ? deepSeconds / 3600.0 : nil,
            remSeconds > 0 ? remSeconds / 3600.0 : nil,
            awakeSeconds > 0 ? awakeSeconds / 3600.0 : nil
        )
    }

    private func enableBackgroundDeliveryIfNeeded(for sampleType: HKSampleType) {
        healthStore.enableBackgroundDelivery(for: sampleType, frequency: .immediate) { success, error in
            if !success, let error {
                print("Background delivery setup failed: \(error.localizedDescription)")
            }
        }
    }

    private func probeReadAuthorization() async throws -> Bool {
        try await withCheckedThrowingContinuation { continuation in
            let end = Date()
            let start = Calendar.current.date(byAdding: .day, value: -1, to: end) ?? end
            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])

            let query = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: predicate,
                limit: 1,
                sortDescriptors: nil
            ) { _, _, error in
                if let hkError = error as? HKError, hkError.code == .errorAuthorizationDenied {
                    continuation.resume(returning: false)
                    return
                }

                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                continuation.resume(returning: true)
            }

            healthStore.execute(query)
        }
    }
}

private extension HKUnit {
    nonisolated static let beatsPerMinute = HKUnit.count().unitDivided(by: .minute())
    nonisolated static let milliseconds = HKUnit.secondUnit(with: .milli)
    nonisolated static let kilojoule = HKUnit.jouleUnit(with: .kilo)
    nonisolated static let meters = HKUnit.meter()
}

private extension HKWorkoutActivityType {
    nonisolated var syncName: String {
        switch self {
        case .running:
            return "Running"
        case .walking:
            return "Walking"
        case .hiking:
            return "Hiking"
        case .cycling:
            return "Cycling"
        case .swimming:
            return "Swimming"
        case .traditionalStrengthTraining:
            return "Strength Training"
        case .functionalStrengthTraining:
            return "Functional Strength"
        case .mindAndBody:
            return "Mind and Body"
        case .yoga:
            return "Yoga"
        case .cooldown:
            return "Cooldown"
        default:
            return "Workout \(rawValue)"
        }
    }
}

private extension Date {
    nonisolated var isoTimestamp: String {
        ISO8601DateFormatter.string(
            from: self,
            timeZone: TimeZone.current,
            formatOptions: [.withInternetDateTime, .withFractionalSeconds]
        )
    }

    nonisolated var dateKey: String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone.current

        let components = calendar.dateComponents([.year, .month, .day], from: self)
        guard let year = components.year,
              let month = components.month,
              let day = components.day else {
            return ""
        }

        return String(format: "%04d-%02d-%02d", year, month, day)
    }
}

private extension String {
    nonisolated var dayStart: Date? {
        let parts = split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              let day = Int(parts[2]) else {
            return nil
        }

        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone.current

        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        components.hour = 0
        components.minute = 0
        components.second = 0

        return calendar.date(from: components)
    }
}

private extension Array where Element == Double {
    nonisolated var average: Double? {
        guard !isEmpty else { return nil }
        return reduce(0, +) / Double(count)
    }
}
