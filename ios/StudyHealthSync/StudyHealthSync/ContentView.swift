import SwiftUI
import UIKit

struct ContentView: View {
    @EnvironmentObject private var coordinator: SyncCoordinator
    @EnvironmentObject private var settings: AppSettingsStore

    @State private var manualRangeDays = 30
    @State private var showConnectionSettings = false
    @State private var showDisconnectConfirmation = false
    @State private var selectedLogForCopy: SyncAttemptLog?
    @State private var copyFeedback: String?

    private let manualRangeOptions = [7, 14, 30, 60, 90, 180, 365]

    var body: some View {
        NavigationStack {
            Form {
                Section("Permissions") {
                    HStack {
                        Text("HealthKit Access")
                        Spacer()
                        Text(permissionLabel)
                            .foregroundStyle(permissionColor)
                            .fontWeight(.semibold)
                    }

                    Button(permissionActionTitle) {
                        coordinator.requestPermissions()
                    }

                    if coordinator.authorizationState == .denied {
                        Text("Enable access in Settings > Health > Data Access & Devices > StudyHealthSync, then allow workout, sleep, heart, and movement data.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else if coordinator.needsHealthPermissionsInSettings {
                        Text("Health access currently requires an update in iOS Settings.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    Button(role: .destructive) {
                        showDisconnectConfirmation = true
                    } label: {
                        Text("Disconnect Apple Health")
                    }
                    .disabled(coordinator.isSyncing)
                }

                Section("Sync Configuration") {
                    Button {
                        showConnectionSettings = true
                    } label: {
                        Label("Server and Token Settings", systemImage: "gearshape")
                    }
                    .buttonStyle(.plain)

                    Toggle("Auto Sync", isOn: $settings.autoSyncEnabled)
                        .onChange(of: settings.autoSyncEnabled) { _, _ in
                            coordinator.applySettingsAndReschedule()
                        }

                    Stepper(
                        "Update interval: \(settings.syncIntervalMinutes) min",
                        value: $settings.syncIntervalMinutes,
                        in: settings.minIntervalMinutes...settings.maxIntervalMinutes,
                        step: 5
                    )
                    .onChange(of: settings.syncIntervalMinutes) { _, _ in
                        coordinator.applySettingsAndReschedule()
                    }

                    Button {
                        coordinator.triggerManualSync()
                    } label: {
                        if coordinator.isSyncing {
                            HStack {
                                ProgressView()
                                Text("Syncing...")
                            }
                        } else {
                            Text("Sync Now")
                        }
                    }
                    .disabled(coordinator.isSyncing)
                }

                Section("Manual Backfill") {
                    Picker("Time range", selection: $manualRangeDays) {
                        ForEach(manualRangeOptions, id: \.self) { option in
                            Text("Last \(option) days").tag(option)
                        }
                    }
                    .pickerStyle(.menu)

                    Button {
                        coordinator.triggerManualRangeUpload(days: manualRangeDays)
                    } label: {
                        if coordinator.isSyncing {
                            HStack {
                                ProgressView()
                                Text("Uploading range...")
                            }
                        } else {
                            Text("Upload Last \(manualRangeDays) Days")
                        }
                    }
                    .disabled(coordinator.isSyncing)
                }

                Section("Status") {
                    LabeledContent("Last Successful Sync", value: DateFormatting.absolute(coordinator.lastSyncAt))
                    LabeledContent("Last Attempt", value: DateFormatting.absolute(coordinator.lastAttemptAt))
                    LabeledContent("Next Planned Attempt", value: DateFormatting.absolute(coordinator.nextScheduledAt))
                    LabeledContent("Queue", value: "\(coordinator.pendingQueueCount) pending")

                    if let error = coordinator.lastErrorMessage, !error.isEmpty {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }

                Section("Recent Sync Logs") {
                    if let copyFeedback, !copyFeedback.isEmpty {
                        Text(copyFeedback)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    if coordinator.recentLogs.isEmpty {
                        Text("No sync logs yet.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(coordinator.recentLogs) { log in
                            Button {
                                selectedLogForCopy = log
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(log.message)
                                        .font(.footnote)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                    Text(log.timestamp)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .padding(.vertical, 2)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .navigationTitle("StudyHealthSync")
            .sheet(isPresented: $showConnectionSettings) {
                ConnectionSettingsView(
                    baseURL: $settings.baseURL,
                    token: $settings.token,
                    onSave: {
                        coordinator.applySettingsAndReschedule()
                    }
                )
            }
            .confirmationDialog(
                "Disconnect Apple Health?",
                isPresented: $showDisconnectConfirmation
            ) {
                Button("Disconnect", role: .destructive) {
                    coordinator.disconnectAppleHealth()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This clears your sync token, disables auto sync, and resets local Health sync state.")
            }
            .confirmationDialog(
                "Copy Sync Log",
                isPresented: Binding(
                    get: { selectedLogForCopy != nil },
                    set: { isPresented in
                        if !isPresented {
                            selectedLogForCopy = nil
                        }
                    }
                )
            ) {
                Button("Copy message") {
                    copySelectedLog(includeTimestamp: false)
                }
                Button("Copy timestamp + message") {
                    copySelectedLog(includeTimestamp: true)
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private var permissionLabel: String {
        switch coordinator.authorizationState {
        case .authorized:
            return "Authorized"
        case .denied:
            return "Denied"
        case .unknown:
            return "Unknown"
        }
    }

    private var permissionColor: Color {
        switch coordinator.authorizationState {
        case .authorized:
            return .green
        case .denied:
            return .red
        case .unknown:
            return .orange
        }
    }

    private var permissionActionTitle: String {
        switch coordinator.authorizationState {
        case .authorized:
            return "Review Health Permissions"
        case .denied:
            return "Open Health Permissions in Settings"
        case .unknown:
            return coordinator.needsHealthPermissionsInSettings
                ? "Open Health Permissions in Settings"
                : "Grant Health Permissions"
        }
    }

    private func copySelectedLog(includeTimestamp: Bool) {
        guard let log = selectedLogForCopy else {
            return
        }

        let copied = includeTimestamp ? "\(log.timestamp) \(log.message)" : log.message
        UIPasteboard.general.string = copied
        selectedLogForCopy = nil

        let message = includeTimestamp ? "Copied timestamp + message." : "Copied message."
        copyFeedback = message

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            if copyFeedback == message {
                copyFeedback = nil
            }
        }
    }
}

private struct ConnectionSettingsView: View {
    @Binding var baseURL: String
    @Binding var token: String
    let onSave: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showTokenPlainText = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Server") {
                    TextField("Server Base URL", text: $baseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .keyboardType(.URL)
                }

                Section("Authentication") {
                    HStack {
                        Group {
                            if showTokenPlainText {
                                TextField("Bearer Token", text: $token)
                            } else {
                                SecureField("Bearer Token", text: $token)
                            }
                        }
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)

                        Button(showTokenPlainText ? "Hide" : "Show") {
                            showTokenPlainText.toggle()
                        }
                        .font(.caption)
                    }
                }
            }
            .navigationTitle("Connection Settings")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave()
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    let coordinator = SyncCoordinator()
    return ContentView()
        .environmentObject(coordinator)
        .environmentObject(coordinator.settings)
}
