# Recommended Project Structure

After creating the Xcode app, keep this structure:

- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync.xcodeproj`
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/`
- `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/Config/Env.local.xcconfig`

Inside app source folder, we will add:

- `App/`
- `Features/Sync/`
- `Features/Permissions/`
- `HealthKit/Queries/`
- `Networking/`
- `Persistence/`
- `Models/`
- `Utilities/`

Module intent:

1. `Features/Permissions`:
   - Health access request + status display.
2. `HealthKit/Queries`:
   - Anchored queries and data mapping.
3. `Persistence`:
   - Anchor tokens, retry queue, last-sync metadata.
4. `Networking`:
   - API client and request signing/headers.
5. `Features/Sync`:
   - Sync coordinator and UI actions.

This keeps the code clean and easy for iterative improvements.
