import Foundation

enum DateFormatting {
    static func relative(_ date: Date?) -> String {
        guard let date else {
            return "Never"
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    static func absolute(_ date: Date?) -> String {
        guard let date else {
            return "-"
        }

        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    static func syncWindow(from: Date?, to: Date?, initialLookbackDays: Int) -> String {
        guard let to else {
            return "-"
        }

        let toLabel = absolute(to)
        if let from {
            return "\(absolute(from)) -> \(toLabel)"
        }

        return "Initial lookback (~\(initialLookbackDays)d) -> \(toLabel)"
    }
}
