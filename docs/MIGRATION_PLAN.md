# Migration Plan

## Overview

This plan moves the project from an in-app React Native prototype to a real Android Auto Clicker. The migration should be incremental. The current UI must keep working while native Android features are added and tested one step at a time.

The project already contains an `android/` directory and Kotlin native module placeholder files. Future work should build on that existing structure instead of restarting the project.

## Migration Strategy

Keep:

- Expo SDK 54
- React Native UI
- Expo Router
- Existing draggable target prototype
- Existing interval and Start / Stop controls
- Existing AsyncStorage position persistence

Add gradually:

- TypeScript native module wrapper
- Kotlin native module implementation
- Accessibility Service
- Native click timer
- `dispatchGesture()`
- Floating overlay
- Permission flows

## What Stays In React Native

React Native should remain responsible for user-facing configuration and in-app prototype behavior:

- Main screen
- Start / Stop buttons
- Interval controls
- Status display
- Click count display
- In-app target preview
- In-app click ripple feedback

Relevant files:

- `app/(tabs)/index.tsx`
- `components/draggable-target.tsx`
- `components/auto-click-panel.tsx`
- `components/click-ripple.tsx`
- `hooks/use-auto-click-engine.ts`
- `lib/target-position-storage.ts`

## What Moves To Native Android

Native Android should own all real auto clicker behavior:

- Accessibility Service lifecycle
- Real tap dispatch through `dispatchGesture()`
- Native click timer
- Floating overlay window
- Overlay drag behavior
- Accessibility permission flow
- Overlay permission flow

Relevant current files:

- `android/app/src/main/java/com/cro383/autoclicker/AutoClickerModule.kt`
- `android/app/src/main/java/com/cro383/autoclicker/AutoClickerPackage.kt`
- `android/app/src/main/AndroidManifest.xml`

## Recommended Phases

### Phase 1: In-App Prototype

Status: completed.

Already implemented:

- Draggable target
- Coordinates
- Position persistence
- Start / Stop
- Interval controls
- Click count
- Ripple feedback

### Phase 2: Prototype Cleanup

Goal:

- Fix current small issues without changing architecture.

Tasks:

- Fix corrupted interval minus button text in `AutoClickPanel`.
- Run lint.
- Run Android build.
- Confirm the app still works on Android.

### Phase 3: Native Module Contract

Goal:

- Define a stable bridge between React Native and Kotlin.

Tasks:

- Add a TypeScript wrapper for the native module.
- Align Kotlin method names with the TypeScript wrapper.
- Keep methods simple and predictable.
- Do not implement real clicking yet.

Recommended API:

```ts
start(): void
stop(): void
setInterval(intervalMs: number): void
setTargetPosition(x: number, y: number): void
checkAccessibilityPermission(): Promise<boolean>
requestAccessibilityPermission(): void
checkOverlayPermission(): Promise<boolean>
requestOverlayPermission(): void
```

### Phase 4: Accessibility Service Skeleton

Goal:

- Add the Android Accessibility Service safely.

Tasks:

- Create `AutoClickerAccessibilityService.kt`.
- Add the service declaration to `AndroidManifest.xml`.
- Add accessibility service XML config under `res/xml/`.
- Add string resources for the service label and description.
- Implement lifecycle logging only.
- Verify the service appears in Android Accessibility settings.

Do not implement real repeated clicking in this phase.

### Phase 5: Permission Flow

Goal:

- Let React Native check and open required Android settings screens.

Tasks:

- Add accessibility permission check.
- Add accessibility settings intent.
- Add overlay permission check.
- Add overlay settings intent.
- Show permission state in the React Native UI if needed.

### Phase 6: Native Click Engine

Goal:

- Move real click execution into the Accessibility Service.

Tasks:

- Store target coordinates in native state.
- Store interval in native state.
- Start and stop native timer.
- Use `dispatchGesture()` for single taps.
- Handle gesture completion and cancellation.
- Stop timer when service is interrupted or destroyed.

### Phase 7: Floating Overlay

Goal:

- Show and drag the target over other Android apps.

Tasks:

- Use `WindowManager`.
- Use `TYPE_APPLICATION_OVERLAY` on supported Android versions.
- Add native overlay target view.
- Implement drag handling.
- Update native target coordinates while dragging.
- Clean up overlay on service stop or destruction.

### Phase 8: Full Integration

Goal:

- Combine React Native controls, native service, real clicking, and overlay.

Tasks:

- Wire Start / Stop to native module.
- Decide how click count should be reported back to React Native.
- Add robust permission error handling.
- Test across device restart, app close, service interruption, screen rotation, and overlay permission changes.

## Current Risks

- Accessibility Service work is permission-sensitive and must be tested manually on Android.
- Overlay windows can leak if lifecycle cleanup is incomplete.
- `dispatchGesture()` requires Accessibility Service permission and Android API support.
- JavaScript timers should not be used for the final real click loop.
- Current native module files are placeholders and do not yet connect to a service.

## Migration Rule

Do not remove the current working prototype while adding native behavior. Each native step should be small, testable, and reversible.
