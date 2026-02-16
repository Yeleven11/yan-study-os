import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var coordinator: SyncCoordinator
    @EnvironmentObject private var settings: AppSettingsStore

    @State private var manualRangeDays = 30
    @State private var showConnectionSettings = false

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

                    Button("Grant or Refresh Permissions") {
                        coordinator.requestPermissions()
                    }
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
                    if coordinator.recentLogs.isEmpty {
                        Text("No sync logs yet.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(coordinator.recentLogs) { log in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(log.message)
                                    .font(.footnote)
                                Text(log.timestamp)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 2)
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
