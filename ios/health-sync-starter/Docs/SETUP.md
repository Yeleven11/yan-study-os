# iOS Health Sync App Setup (Good Version)

This is a click-by-click setup for a private app (just for you).

## 1) Prerequisites

1. Install Xcode from App Store.
2. Open Xcode once and accept the license.
3. Confirm tools from Terminal:
   - `xcodebuild -version`
4. Sign in with Apple ID in Xcode:
   - Xcode -> Settings -> Accounts -> `+` -> Apple Account
5. Plug your iPhone into the Mac once and trust the computer.

Notes:
- HealthKit data is not realistic in Simulator. We will test sync on your real iPhone.
- You do not need a paid Apple Developer account for personal device testing.

## 2) Create the App Project in the Existing Repo

1. Open Xcode.
2. File -> New -> Project...
3. Choose `iOS` -> `App` -> Next.
4. Use these values:
   - Product Name: `StudyHealthSync`
   - Team: your Apple ID team
   - Organization Identifier: `com.yanborovyk`
   - Bundle Identifier: let Xcode generate
   - Interface: `SwiftUI`
   - Language: `Swift`
   - Testing: include tests
   - Storage: SwiftData unchecked (not needed)
5. Save location:
   - `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync`
6. Important: if Xcode asks to create a new git repo, choose `No` (we already have one).

Expected result:
- You should have `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync.xcodeproj`.

## 3) Enable Required Capabilities

Open target `StudyHealthSync` -> Signing & Capabilities.

1. Ensure Signing works for your team.
2. Add capability: `HealthKit`.
3. Add capability: `Background Modes`.
4. Under Background Modes, enable:
   - `Background fetch`
   - `Background processing`

## 4) Add Privacy Strings (Info.plist)

Open target `StudyHealthSync` -> Info tab and add:

1. `Privacy - Health Share Usage Description`
   - Example value: `This app reads your health data to sync your training metrics to your private server.`
2. `Privacy - Health Update Usage Description`
   - Example value: `This app may write sync metadata for your private health workflow.`

We will start read-only, but keeping both keys avoids future friction.

## 5) Add Build Config for Server URL and Token

1. In Finder, copy template:
   - `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/health-sync-starter/Config/Env.sample.xcconfig`
2. Create real file in your app folder:
   - `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/Config/Env.local.xcconfig`
3. Fill values:
   - `SYNC_BASE_URL`
   - `SYNC_BEARER_TOKEN`
4. In Xcode project settings:
   - Add `Env.local.xcconfig` to Debug and Release configurations.

## 6) First Device Run

1. Select your iPhone as run destination.
2. Press Run.
3. If iPhone blocks launch:
   - Settings -> General -> VPN & Device Management -> trust developer profile.
4. Re-run.

You are done with setup when app launches on iPhone.

## 7) What We Build Next (Good Version)

After project exists, we implement in this order:

1. HealthKit permission manager
2. Anchored incremental queries for:
   - Workouts
   - Heart rate samples
   - Distance
   - Active energy
   - Resting HR and HRV
   - Sleep
3. Local sync state store (anchors + last success)
4. Upload client with retry queue
5. Manual `Sync now` screen + last sync diagnostics
6. Background refresh scheduling

## 8) Important Data Reality

Minute-by-minute HR is usually not guaranteed by HealthKit.

Plan:
1. Export all available HR samples with timestamps.
2. Bucket/resample to 1-minute on server.

This gives you stable analytics even if sample intervals are irregular.

## 9) If You Get Stuck During Setup

Send me:
1. Screenshot of the failing Xcode screen
2. Error text from the issue navigator
3. Output of:
   - `xcodebuild -version`

I will unblock you step-by-step.
