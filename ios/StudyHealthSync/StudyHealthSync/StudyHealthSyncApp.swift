import SwiftUI

@main
struct StudyHealthSyncApp: App {
    @StateObject private var coordinator = SyncCoordinator()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(coordinator)
                .task {
                    coordinator.start()
                }
        }
    }
}
