# Enterprise Codebase Function Catalog

Generated: 2026-02-19T21:34:37.954Z

Workspace: /Users/yanborovyk/Desktop/Code Projects/IbWebsite

## Summary

- Total source files scanned: 74
- Files containing function-like definitions: 59
- Total function-like definitions: 600
- Exported function-like definitions: 77
- Async function-like definitions: 154

## Function Inventory By File

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/ContentView.swift`

- L239 | swift-func | `copySelectedLog`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Features/Sync/BackgroundSyncScheduler.swift`

- L12 | swift-init | `init`
- L14 | swift-func | `register` | async
- L32 | swift-func | `scheduleNext`
- L56 | swift-func | `cancelAllScheduledTasks`
- L61 | swift-func | `handleRefreshTask`
- L72 | swift-func | `handleProcessingTask`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Features/Sync/SyncCoordinator.swift`

- L54 | swift-init | `init`
- L67 | swift-func | `start`
- L106 | swift-func | `requestPermissions`
- L142 | swift-func | `triggerManualSync`
- L148 | swift-func | `triggerManualRangeUpload`
- L154 | swift-func | `disconnectAppleHealth`
- L185 | swift-func | `syncNow` | async
- L251 | swift-func | `applySettingsAndReschedule`
- L256 | swift-func | `handleSyncIntervalChanged`
- L267 | swift-func | `syncRange` | async
- L370 | swift-func | `flushPendingQueue` | async
- L399 | swift-func | `uploadBatch`
- L425 | swift-func | `persistAnchorsAfterUpload` | async
- L435 | swift-func | `refreshAuthorizationState` | async
- L448 | swift-func | `runRepairBackfillIfNeeded` | async
- L479 | swift-func | `startObserversIfNeeded` | async
- L496 | swift-func | `handleObserverSignal`
- L513 | swift-func | `restartForegroundAutoSyncLoop`
- L565 | swift-func | `rescheduleBackgroundTasks`
- L573 | swift-func | `restoreOrInitializeNextScheduledAt`
- L595 | swift-func | `runDueSyncIfNeededOnStart` | async
- L617 | swift-func | `persistNextScheduledAt`
- L624 | swift-func | `clearPersistedSchedule`
- L629 | swift-func | `resetScheduleFromNow`
- L642 | swift-func | `advanceScheduleAfterRun`
- L664 | swift-func | `refreshNextSyncWindowPreview`
- L674 | swift-func | `refreshQueueState` | async
- L679 | swift-func | `refreshLastSyncFromStore` | async
- L684 | swift-func | `payloadDiagnostics`
- L701 | swift-func | `chunkRangePayload`
- L727 | swift-func | `buildChunkPayload`
- L745 | swift-func | `appendCurrentChunk`
- L845 | swift-func | `payloadByteCount`
- L854 | swift-func | `openAppSettings`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/HealthKit/HealthKitService.swift`

- L19 | swift-init | `init`
- L23 | swift-func | `authorizationState` | async
- L42 | swift-func | `authorizationRequestStatus` | async
- L67 | swift-func | `requestAuthorization` | async
- L80 | swift-func | `stopBackgroundObserversAndDelivery` | async
- L94 | swift-func | `clearAuthorizationTracking`
- L98 | swift-func | `startBackgroundObservers`
- L124 | swift-func | `collectDelta` | async
- L238 | swift-func | `collectRange` | async
- L298 | swift-func | `readTypes`
- L361 | swift-func | `insertQuantityTypes`
- L370 | swift-func | `insertCategoryTypes`
- L379 | swift-func | `insertAdditionalReadTypes`
- L384 | swift-func | `sampleType`
- L409 | swift-func | `mergeWorkoutCandidatesForDelta`
- L440 | swift-func | `runAnchoredQuery`
- L494 | swift-func | `buildDailyHealthPayload` | async
- L545 | swift-func | `buildWorkoutPayloads` | async
- L642 | swift-func | `resampleHeartRateSeriesPerMinute`
- L689 | swift-func | `floorToMinute`
- L694 | swift-func | `fetchQuantitySamples`
- L704 | swift-func | `fetchDailyQuantities` | async
- L777 | swift-func | `fetchDailySleep` | async
- L881 | swift-func | `longestMergedInterval`
- L909 | swift-func | `decimalHour`
- L917 | swift-func | `currentDeviceInfo` | async
- L928 | swift-func | `enableBackgroundDeliveryIfNeeded`
- L936 | swift-func | `probeReadAuthorization` | async
- L949 | swift-func | `canReadSampleType` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Networking/SyncAPIClient.swift`

- L27 | swift-func | `SyncAPIClient.send`
- L76 | swift-func | `buildURL`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Persistence/AnchorStore.swift`

- L10 | swift-func | `anchor`
- L18 | swift-func | `encodeAnchors`
- L27 | swift-func | `persist`
- L36 | swift-func | `persistRawAnchorMap`
- L41 | swift-func | `lastSuccessfulSyncAt`
- L49 | swift-func | `rawAnchorMap`
- L53 | swift-func | `clearSyncState`
- L58 | swift-func | `readAnchorMap`
- L62 | swift-func | `encodeAnchor`
- L66 | swift-func | `decodeAnchor`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Persistence/AppSettingsStore.swift`

- L51 | swift-init | `init`
- L71 | swift-func | `clearToken`
- L76 | swift-func | `performFullDisconnect`
- L81 | swift-func | `clampInterval`
- L85 | swift-func | `persistToken`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Persistence/KeychainStore.swift`

- L5 | swift-func | `KeychainStore.set`
- L30 | swift-func | `get`
- L51 | swift-func | `delete`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Persistence/SyncQueueStore.swift`

- L16 | swift-init | `init`
- L28 | swift-func | `pendingCount`
- L32 | swift-func | `pendingBatches`
- L36 | swift-func | `nextBatch`
- L40 | swift-func | `latestBatch`
- L44 | swift-func | `enqueue`
- L58 | swift-func | `removeBatch`
- L64 | swift-func | `incrementAttempts`
- L73 | swift-func | `recentLogs`
- L77 | swift-func | `appendLog`
- L91 | swift-func | `clearPending`
- L97 | swift-func | `discardAllButLatest`
- L108 | swift-func | `loadState`
- L119 | swift-func | `saveState`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSync/Utilities/DateFormatting.swift`

- L4 | swift-func | `DateFormatting.relative`
- L14 | swift-func | `absolute`
- L25 | swift-func | `syncWindow`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSyncTests/StudyHealthSyncTests.swift`

- L13 | swift-func | `StudyHealthSyncTests.example` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSyncUITests/StudyHealthSyncUITests.swift`

- L12 | swift-func | `setUpWithError`
- L21 | swift-func | `tearDownWithError`
- L26 | swift-func | `testExample`
- L35 | swift-func | `testLaunchPerformance`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/ios/StudyHealthSync/StudyHealthSyncUITests/StudyHealthSyncUITestsLaunchTests.swift`

- L16 | swift-func | `setUpWithError`
- L21 | swift-func | `testLaunch`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/scripts/import-health-folder.mjs`

- L6 | function | `readCsvFiles` | async
- L24 | function | `main` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/auth/login/route.ts`

- L10 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/auth/logout/route.ts`

- L4 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/auth/session/route.ts`

- L5 | function | `GET` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/dashboard/bootstrap/route.ts`

- L9 | function | `GET` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/flashcards/review/route.ts`

- L8 | function | `isValidOutcome`
- L12 | function | `isValidGradeInput`
- L27 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/flashcards/route.ts`

- L8 | function | `isValidFlashcard`
- L27 | function | `GET` | exported, async
- L44 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/health/raw/files/route.ts`

- L6 | function | `GET` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/integrations/health/csv/route.ts`

- L12 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/integrations/health/import-batch/route.ts`

- L12 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/integrations/health/mobile-sync/route.ts`

- L8 | function | `isRecord`
- L12 | function | `isNonEmptyString`
- L16 | function | `isIsoDate`
- L25 | function | `asArrayOfRecords`
- L33 | function | `optionalNumber`
- L41 | function | `optionalIsoString`
- L49 | function | `normalizeSeries`
- L65 | function | `normalizeSyncRequest`
- L258 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/settings/exams/route.ts`

- L7 | function | `isValidExamList`
- L24 | function | `GET` | exported, async
- L35 | function | `PUT` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/settings/goals/route.ts`

- L8 | function | `isValidTime`
- L12 | function | `isValidGoals`
- L47 | function | `GET` | exported, async
- L61 | function | `PUT` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/study-sessions/route.ts`

- L7 | function | `isValidSession`
- L23 | function | `GET` | exported, async
- L34 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/todos/[id]/archive/route.ts`

- L6 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/todos/[id]/restore/route.ts`

- L6 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/todos/route.ts`

- L7 | function | `isValidTodo`
- L25 | function | `GET` | exported, async
- L36 | function | `POST` | exported, async
- L52 | function | `PATCH` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/workouts/[id]/route.ts`

- L8 | function | `GET` | exported, async
- L31 | function | `DELETE` | exported, async
- L69 | function | `isValidDifficultyUser`
- L81 | function | `PATCH` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/api/workouts/route.ts`

- L7 | function | `isValidWorkout`
- L25 | function | `GET` | exported, async
- L64 | function | `POST` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/layout.tsx`

- L18 | function | `RootLayout` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/app/page.tsx`

- L3 | function | `HomePage` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/components/scientific-dashboard.tsx`

- L42 | function | `clamp`
- L46 | function | `scoreColor`
- L59 | function | `formatStateLabel`
- L65 | function | `formatContributionMap`
- L75 | function | `shortDate`
- L86 | function | `safeAvg`
- L93 | function | `syntheticPayload`
- L103 | function | `parseBedtimeMinutes`
- L118 | function | `formatClockMinutes`
- L127 | function | `formatDelta`
- L133 | function | `GaugeRing`
- L184 | function | `RangeBar`
- L228 | function | `MetricBar`
- L258 | function | `ReasonList`
- L275 | function | `TrendChart`
- L321 | function | `TrendChart.handleMove`
- L403 | function | `SnapshotCircleMatrix`
- L487 | function | `StatCard`
- L514 | function | `ScientificTrendsRail` | exported
- L645 | function | `ScientificDashboard` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/components/study-dashboard.tsx`

- L96 | function | `createOfflineAction`
- L106 | function | `toDateKeyInTimezone`
- L140 | function | `shiftDateKeyByDays`
- L150 | function | `computeStudyStreakDays`
- L205 | function | `getActiveElapsedSeconds`
- L221 | function | `toGoalsDraft`
- L234 | function | `parseGoalsDraft`
- L239 | arrow-var | `parseGoalsDraft.parseBoundedNumber`
- L312 | function | `getExamSubjectIds`
- L327 | function | `applyOfflineAction`
- L421 | function | `getExamMonthDayValue`
- L428 | function | `getExamTimeSlotValue`
- L433 | function | `toExamDraftRow`
- L441 | function | `monthDayToIso`
- L492 | function | `readStoredTimer`
- L510 | function | `readStoredQueue`
- L529 | function | `readCountdownBaselines`
- L556 | function | `mergeCountdownBaselines`
- L591 | function | `request` | async
- L611 | function | `toAppData`
- L630 | function | `FocusModal`
- L666 | arrow-var | `FocusModal.onKeyDown`
- L733 | function | `StudyDashboard` | exported
- L952 | function | `StudyDashboard.loadDashboard` | async
- L1003 | arrow-var | `StudyDashboard.onOnline`
- L1516 | arrow-var | `StudyDashboard.handleRefresh`
- L1537 | arrow-var | `StudyDashboard.handleLogin` | async
- L1564 | arrow-var | `StudyDashboard.handleLogout` | async
- L1595 | arrow-var | `StudyDashboard.handleStartTimer`
- L1610 | arrow-var | `StudyDashboard.handlePauseResumeTimer`
- L1639 | arrow-var | `StudyDashboard.handleEndTimer` | async
- L1676 | arrow-var | `StudyDashboard.handleQuickAddSession` | async
- L1716 | arrow-var | `StudyDashboard.handleAddTodo` | async
- L1727 | arrow-var | `StudyDashboard.handleCreateFlashcard` | async
- L1755 | arrow-var | `StudyDashboard.handleGradeFlashcard` | async
- L1795 | arrow-var | `StudyDashboard.handleArchiveTodo` | async
- L1817 | arrow-var | `StudyDashboard.handleRestoreTodo` | async
- L1839 | arrow-var | `StudyDashboard.handleUpdateExams` | async
- L1873 | arrow-var | `StudyDashboard.handleSaveGoals` | async
- L1905 | arrow-var | `StudyDashboard.handleGoalFieldChange`
- L1919 | arrow-var | `StudyDashboard.handleResetGoalsDraft`
- L1928 | arrow-var | `StudyDashboard.handleImportCsv` | async
- L1953 | arrow-var | `StudyDashboard.handleImportBatchFiles` | async
- L3223 | function | `MetricBar`
- L3244 | function | `formatRelativeTimestamp`
- L3278 | function | `StatusStrip`
- L3315 | function | `StatusStripItem`
- L3334 | function | `FlashcardRail`
- L3367 | arrow-var | `FlashcardRail.handleCreate` | async
- L3384 | arrow-var | `FlashcardRail.handleGrade` | async
- L3549 | function | `TodoRail`
- L3571 | arrow-var | `TodoRail.handleSubmit` | async
- L3747 | function | `HealthRail`
- L3871 | function | `HealthExplorer`
- L3926 | arrow-var | `HealthExplorer.handleSaveDifficulty` | async
- L3954 | arrow-var | `HealthExplorer.handleClearDifficulty` | async
- L4303 | function | `SleepScoreScatter`
- L4325 | arrow-var | `SleepScoreScatter.xForIndex`
- L4333 | arrow-var | `SleepScoreScatter.yForScore`
- L4414 | function | `MetricTile`
- L4423 | function | `CompactBars`
- L4489 | function | `SeriesPanel`
- L4544 | function | `formatOptionalNumber`
- L4560 | function | `formatTimeLabel`
- L4567 | function | `formatWorkoutLabel`
- L4575 | function | `formatWorkoutDetailLabel`
- L4583 | function | `ExamSubjectRings`
- L4611 | function | `ExamEditor`
- L4635 | arrow-var | `ExamEditor.updateRow`
- L4641 | arrow-var | `ExamEditor.addExam`
- L4662 | arrow-var | `ExamEditor.removeExam`
- L4666 | arrow-var | `ExamEditor.handleSave` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/calendar-tooltip.ts`

- L34 | function | `clamp`
- L38 | function | `classifyCalendarDayState` | exported
- L53 | function | `buildDayHoverModel` | exported
- L119 | function | `computeTooltipPlacement` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/client/repository.ts`

- L60 | function | `parseDailyHealth`
- L74 | function | `parseWorkouts`
- L91 | function | `parseWorkoutDetails`
- L112 | function | `parseRawFiles`
- L128 | function | `parseGoals`
- L168 | function | `parseStoredData`
- L198 | function | `getTimezone`
- L202 | function | `readLocalData`
- L210 | function | `writeLocalData`
- L224 | function | `createLocalRepository`
- L227 | method | `createLocalRepository.getBootstrap` | async
- L236 | method | `createLocalRepository.createStudySession` | async
- L241 | method | `createLocalRepository.createWorkout` | async
- L247 | method | `createLocalRepository.updateWorkout` | async
- L270 | method | `createLocalRepository.createTodo` | async
- L275 | method | `createLocalRepository.createFlashcard` | async
- L283 | method | `createLocalRepository.gradeFlashcard` | async
- L290 | method | `createLocalRepository.updateTodo` | async
- L297 | method | `createLocalRepository.archiveTodo` | async
- L313 | method | `createLocalRepository.restoreTodo` | async
- L329 | method | `createLocalRepository.updateExams` | async
- L336 | method | `createLocalRepository.updateGoals` | async
- L341 | method | `createLocalRepository.importHealthCsv` | async
- L395 | method | `createLocalRepository.importHealthBatch` | async
- L414 | method | `createLocalRepository.getWorkoutDetail` | async
- L418 | method | `createLocalRepository.getHealthRawFiles` | async
- L425 | function | `apiRequest` | async
- L448 | function | `createApiRepository`
- L451 | method | `createApiRepository.getBootstrap` | async
- L457 | method | `createApiRepository.createStudySession` | async
- L463 | method | `createApiRepository.createWorkout` | async
- L469 | method | `createApiRepository.updateWorkout` | async
- L475 | method | `createApiRepository.createTodo` | async
- L481 | method | `createApiRepository.createFlashcard` | async
- L487 | method | `createApiRepository.gradeFlashcard` | async
- L493 | method | `createApiRepository.updateTodo` | async
- L499 | method | `createApiRepository.archiveTodo` | async
- L504 | method | `createApiRepository.restoreTodo` | async
- L509 | method | `createApiRepository.updateExams` | async
- L515 | method | `createApiRepository.updateGoals` | async
- L521 | method | `createApiRepository.importHealthCsv` | async
- L536 | method | `createApiRepository.importHealthBatch` | async
- L548 | method | `createApiRepository.getWorkoutDetail` | async
- L552 | method | `createApiRepository.getHealthRawFiles` | async
- L559 | function | `createDashboardRepository` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/constants.ts`

- L224 | function | `createEmptySubjectTotals` | exported
- L231 | function | `createDefaultPerformanceGoals` | exported
- L244 | function | `createDefaultAppData` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/dashboard-utils.ts`

- L21 | function | `toDateKey` | exported
- L29 | function | `toOperationalDateKey` | exported
- L38 | function | `parseDateKey` | exported
- L42 | function | `formatDuration` | exported
- L59 | function | `formatClock` | exported
- L76 | function | `formatDateTime` | exported
- L86 | function | `sortTodos` | exported
- L103 | function | `getNearestExams` | exported
- L113 | function | `getCountdown` | exported
- L149 | function | `buildDayAggregates` | exported
- L190 | function | `buildSubjectTotals` | exported
- L200 | function | `buildForwardDates` | exported
- L214 | function | `getGreetingBucket` | exported
- L232 | function | `selectGreeting` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/flashcards/scheduler.test.ts`

- L13 | function | `ms`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/flashcards/scheduler.ts`

- L42 | function | `parseDateMs`
- L51 | function | `clamp`
- L55 | function | `toDateKeyInTimezone`
- L79 | function | `hashToUnit`
- L89 | function | `fuzzDelta`
- L100 | function | `constrainedFuzzBounds`
- L122 | function | `withReviewFuzz`
- L137 | function | `delayMinutesToMs`
- L141 | function | `sanitizeStatus`
- L149 | function | `nextLearningStep`
- L165 | function | `normalizeCard`
- L211 | function | `compareByQueueOrder`
- L230 | function | `isCritical`
- L236 | function | `pickNextInternal`
- L261 | function | `graduateToReview`
- L272 | function | `applyIncorrect`
- L315 | function | `applyCorrect`
- L355 | function | `createFlashcard` | exported
- L375 | function | `pickNextFlashcard` | exported
- L384 | function | `buildFlashcardSessionSnapshot` | exported
- L417 | function | `applyFlashcardGrade` | exported
- L461 | function | `normalizeFlashcards` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.test.ts`

- L7 | function | `addDays`
- L13 | function | `makeHealthDay`
- L36 | function | `makeBaseData`
- L54 | function | `addWorkout`
- L93 | function | `addStudySession`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/health-engine.ts`

- L354 | function | `clamp`
- L358 | function | `round`
- L363 | function | `sigmoid`
- L367 | function | `median`
- L379 | function | `quantile`
- L400 | function | `mad`
- L409 | function | `robustScale`
- L413 | function | `robustZ`
- L424 | function | `circularDistanceMinutes`
- L431 | function | `circularMedianMinutes`
- L454 | function | `circularMeanMinutes`
- L479 | function | `unwrapClockSeries`
- L502 | function | `olsSlope`
- L526 | function | `isMinuteInSleepInterval`
- L541 | function | `computeSRI14`
- L573 | function | `ewmaTau`
- L578 | function | `safeFinite`
- L585 | function | `positiveFinite`
- L593 | function | `shiftDate`
- L599 | function | `buildDateRange`
- L617 | function | `parseClockToMinutes`
- L639 | function | `formatClockLabel`
- L648 | function | `toIsoOnDate`
- L656 | function | `localClockMinutesFromIso`
- L669 | function | `sleepDateFromWakeTimestamp`
- L691 | function | `mergeHealthFacts`
- L706 | function | `normalizeGoals`
- L747 | function | `windowCenterMinutes`
- L757 | function | `sentenceForDriver`
- L795 | function | `zoneForScore`
- L808 | function | `getWeekStartDate`
- L816 | function | `isWalkSession`
- L821 | function | `isRunSession`
- L829 | function | `classifyWorkoutMode`
- L846 | function | `workoutAverageHeartRate`
- L856 | function | `computeWorkoutDifficultyAuto`
- L882 | function | `examImportance`
- L897 | function | `todoImportance`
- L904 | function | `daysUntil`
- L912 | function | `computeExamUrgency`
- L949 | function | `physicalStrainFromImpulse`
- L956 | function | `mentalStrainFromImpulse`
- L963 | function | `sleepReasonText`
- L988 | function | `recoveryReasonText`
- L1010 | function | `targetReasonText`
- L1065 | function | `sanitizeHealthDay`
- L1104 | function | `sleepNeedForDay`
- L1144 | function | `physicalStateRationale`
- L1148 | function | `mentalStateRationale`
- L1152 | function | `buildTrainingCategory`
- L1187 | function | `computeDaysSinceRun`
- L1199 | function | `recentValues`
- L1206 | function | `extractSeriesHr`
- L1224 | function | `workoutDayKey`
- L1228 | function | `runModel`
- L2868 | function | `defaultScientificMetric`
- L3094 | function | `defaultReadiness`
- L3136 | function | `defaultRecommendation`
- L3183 | function | `freshnessMinutes`
- L3196 | function | `buildPerformanceInsights` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/auth.ts`

- L13 | function | `getSessionSecret`
- L17 | function | `toBase64Url`
- L25 | function | `fromBase64Url`
- L31 | function | `signPayload`
- L37 | function | `verifyAndDecodeSessionToken`
- L76 | function | `createSessionToken` | exported
- L87 | function | `verifySessionToken` | exported
- L91 | function | `parseScryptHash`
- L121 | function | `verifyPasscode` | exported
- L151 | function | `buildScryptHash` | exported
- L160 | function | `getSessionCookieName` | exported
- L164 | function | `getSessionCookieOptions` | exported
- L180 | function | `isAuthenticatedRequest` | exported
- L189 | function | `getSessionFromRequest` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-csv.ts`

- L61 | function | `normalizeHeader`
- L65 | function | `normalizeStem`
- L72 | function | `titleCaseWords`
- L80 | function | `humanizeStem`
- L84 | function | `parseCsvRows`
- L138 | function | `parseNumber`
- L156 | function | `parseDateValue`
- L169 | function | `parseDurationToMinutes`
- L183 | function | `classifyFile`
- L186 | arrow-var | `classifyFile.hasHeader`
- L297 | function | `toRecord`
- L305 | function | `getValue`
- L316 | function | `hashText`
- L320 | function | `inferWorkoutType`
- L338 | function | `defaultWorkoutNameForType`
- L351 | function | `buildWorkoutDisplayLabel`
- L367 | function | `timestampToToken`
- L377 | function | `extractWorkoutKeyFromFilename`
- L400 | function | `mergeDailyHealth`
- L411 | function | `parseAggregateRows`
- L480 | function | `parseWorkoutSummaryRows`
- L702 | function | `pickNumericValue`
- L712 | function | `parseWorkoutStreamRows`
- L801 | function | `parseFile`
- L929 | function | `clamp`
- L933 | function | `workoutStemFromKey`
- L937 | function | `getRowWeightMinutes`
- L951 | function | `flattenSeries`
- L961 | function | `summarizeStreamMetrics`
- L1058 | function | `computeMergeConfidence`
- L1071 | function | `pickSeriesTimestamp`
- L1090 | function | `buildSummaryFallbackSeries`
- L1145 | function | `buildWorkoutDetail`
- L1189 | function | `preferCanonicalMetric`
- L1199 | function | `hasPositiveMetric`
- L1203 | function | `mergeWorkoutEntryPreservingMetrics`
- L1253 | function | `mergeWorkoutDetailPreservingSeries`
- L1262 | arrow-var | `mergeWorkoutDetailPreservingSeries.pickSeries`
- L1312 | function | `mergeWorkouts`
- L1467 | function | `importHealthFiles` | exported
- L1475 | arrow-var | `importHealthFiles.isWorkoutLikeRawFile`
- L1582 | function | `importSingleHealthCsv` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-ingest-auth.ts`

- L13 | function | `tokensMatch`
- L24 | function | `normalizeToken`
- L36 | function | `getConfiguredTokenInfo`
- L74 | function | `getBearerTokenFromHeader`
- L83 | function | `unauthorizedResponse`
- L110 | function | `requireHealthIngestAuth` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-ingest-request.ts`

- L20 | function | `normalizeFilename`
- L28 | function | `ensureCsvExtension`
- L36 | function | `csvLikeFile`
- L46 | function | `fallbackFilename`
- L59 | function | `toIngestFile`
- L74 | function | `parseMultipartCsvFiles` | async
- L109 | function | `parseJsonCsvFiles`
- L156 | function | `normalizeHealthIngestRequest` | exported, async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-mobile.test.ts`

- L7 | function | `buildPayload`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-mobile.ts`

- L31 | function | `hashText`
- L35 | function | `clamp`
- L39 | function | `round`
- L44 | function | `wrapHour`
- L49 | function | `normalizeFinite`
- L57 | function | `normalizeIso`
- L70 | function | `normalizeDateKey`
- L88 | function | `sanitizeUuid`
- L92 | function | `inferWorkoutType`
- L122 | function | `normalizeStreamPoints`
- L155 | function | `toMs`
- L160 | function | `isDateKeyOnOrBefore`
- L168 | function | `buildStream`
- L189 | function | `mergeNumericDailyHealth`
- L206 | function | `mergeIsoDailyHealth`
- L223 | function | `upsertDailyHealth`
- L311 | function | `buildWorkoutEntry`
- L373 | function | `buildWorkoutDetail`
- L445 | function | `mergeWorkoutEntry`
- L464 | function | `mergeWorkoutDetail`
- L482 | function | `applyDeletions`
- L504 | function | `importMobileSyncPayload` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-time-sanity.test.ts`

- L7 | function | `pastWorkout`
- L20 | function | `futureWorkout`
- L33 | function | `pastDetail`
- L69 | function | `futureDetail`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/health-time-sanity.ts`

- L28 | function | `toMs`
- L40 | function | `isOnOrBeforeCutoff`
- L48 | function | `sanitizeSeriesRows`
- L63 | function | `sanitizeWorkoutDetail`
- L104 | function | `sanitizeFutureHealthData` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/route-helpers.ts`

- L5 | function | `requireSession` | exported
- L13 | function | `badRequest` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/dynamo-store.ts`

- L35 | function | `takeTail`
- L47 | function | `normalizeGoals`
- L87 | function | `normalizeDailyHealth`
- L108 | function | `normalizeWorkouts`
- L135 | function | `normalizeWorkoutDetails`
- L206 | function | `normalizeRawFiles`
- L230 | function | `normalizeRawRows`
- L237 | function | `getRequiredEnv`
- L245 | function | `createDocumentClient`
- L263 | function | `normalizeData`
- L289 | function | `buildSettingsItem`
- L306 | function | `settingsItemSizeBytes`
- L310 | function | `compactForSettingsItem`
- L341 | function | `createDynamoStore`
- L347 | function | `createDynamoStore.loadData` | async
- L400 | function | `createDynamoStore.persistSettings` | async
- L416 | method | `createDynamoStore.getData` | async
- L419 | method | `createDynamoStore.saveData` | async
- L442 | method | `createDynamoStore.appendStudySession` | async
- L450 | method | `createDynamoStore.addTodo` | async
- L458 | method | `createDynamoStore.updateTodo` | async
- L485 | method | `createDynamoStore.archiveTodo` | async
- L500 | method | `createDynamoStore.restoreTodo` | async
- L514 | method | `createDynamoStore.updateExams` | async
- L519 | method | `createDynamoStore.appendHealthRawFiles` | async
- L532 | method | `createDynamoStore.appendHealthRawRows` | async
- L545 | method | `createDynamoStore.upsertWorkoutDetails` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/index.ts`

- L8 | function | `getBackendMode`
- L19 | function | `getDashboardStore` | exported

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/local-file-store.ts`

- L26 | function | `normalizeGoals`
- L66 | function | `normalizeDailyHealth`
- L87 | function | `normalizeWorkouts`
- L114 | function | `normalizeWorkoutDetails`
- L162 | function | `normalizeRawFiles`
- L184 | function | `normalizeRawRows`
- L209 | function | `normalizeData`
- L232 | function | `ensureDataFile` | async
- L243 | function | `readData` | async
- L257 | function | `writeData` | async
- L268 | function | `writeExamBackup` | async
- L283 | function | `createLocalFileStore`
- L285 | method | `createLocalFileStore.getData` | async
- L288 | method | `createLocalFileStore.saveData` | async
- L291 | method | `createLocalFileStore.appendStudySession` | async
- L296 | method | `createLocalFileStore.addTodo` | async
- L301 | method | `createLocalFileStore.updateTodo` | async
- L308 | method | `createLocalFileStore.archiveTodo` | async
- L324 | method | `createLocalFileStore.restoreTodo` | async
- L340 | method | `createLocalFileStore.updateExams` | async
- L348 | method | `createLocalFileStore.appendHealthRawFiles` | async
- L361 | method | `createLocalFileStore.appendHealthRawRows` | async
- L374 | method | `createLocalFileStore.upsertWorkoutDetails` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/store/neon-store.ts`

- L22 | function | `normalizeGoals`
- L62 | function | `normalizeDailyHealth`
- L83 | function | `normalizeWorkouts`
- L110 | function | `normalizeWorkoutDetails`
- L158 | function | `normalizeRawFiles`
- L180 | function | `normalizeRawRows`
- L205 | function | `normalizeData`
- L228 | function | `getStateTableName`
- L236 | function | `getDatabaseUrl`
- L255 | function | `getSqlClient`
- L259 | function | `ensureSchema` | async
- L280 | function | `parseStoredAppData`
- L303 | function | `writeDataDirect` | async
- L321 | function | `readData` | async
- L338 | function | `runQueuedWrite` | async
- L343 | function | `mutateData` | async
- L351 | function | `createNeonStore`
- L353 | method | `createNeonStore.getData` | async
- L357 | method | `createNeonStore.saveData` | async
- L362 | method | `createNeonStore.appendStudySession` | async
- L367 | method | `createNeonStore.addTodo` | async
- L372 | method | `createNeonStore.updateTodo` | async
- L379 | method | `createNeonStore.archiveTodo` | async
- L395 | method | `createNeonStore.restoreTodo` | async
- L411 | method | `createNeonStore.updateExams` | async
- L418 | method | `createNeonStore.appendHealthRawFiles` | async
- L431 | method | `createNeonStore.appendHealthRawRows` | async
- L444 | method | `createNeonStore.upsertWorkoutDetails` | async

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/workout-detail.test.ts`

- L6 | function | `makeDetail`

### `/Users/yanborovyk/Desktop/Code Projects/IbWebsite/src/lib/server/workout-detail.ts`

- L3 | function | `pickSeriesTimestamp`
- L22 | function | `hasSeries`
- L26 | function | `isFiniteNumber`
- L30 | function | `buildHeartRateSeriesFromStreams`
- L80 | function | `toFallbackDetailFromWorkout`
- L115 | function | `withWorkoutSeriesFallback` | exported

