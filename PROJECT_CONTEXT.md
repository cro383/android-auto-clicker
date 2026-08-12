# Android Auto Clicker Project Context

## Project Overview

This repository is an Android-only Auto Clicker project.

The current app is built with:

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- React Native Reanimated
- React Native Gesture Handler
- AsyncStorage
- Kotlin native Android module placeholders

Target platform:

- Android only
- iOS support is not required

The current product state is an in-app prototype. The final goal is a real Android Auto Clicker that works over other Android apps through Android Accessibility Service and native Android overlay code.

There is also a browser demonstration mode for presentations. The web demo is only a simulation of the UI and click feedback. It does not perform real Android taps.

## Development Environment

Primary project path:

```text
E:\Projects\my-first-app
```

Secondary project path:

```text
D:\Projects\android-auto-clicker
```

Expected environment:

- Windows
- Node.js v24.x
- npm / npx
- Git
- VS Code
- Android device or emulator

GitHub repository:

```text
https://github.com/cro383/android-auto-clicker
```

Git is the single source of truth. When switching computers, pull the latest changes, install dependencies if needed, start Expo with a clean cache, and test on Android.

### Local Android Device Connection

These settings apply only to this project workspace.

- Android SDK: `C:\Users\home\AppData\Local\Android\Sdk`
- ADB executable: `C:\Users\home\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- Primary test device ID: `R3CWA0L9A3D`
- Primary test device model: Samsung `SM-S916N`

`adb` is not currently available through `PATH`, so invoke it with the full path above. In a restricted execution environment, access to the SDK under `AppData` can be denied and may incorrectly appear as though the SDK does not exist. Before suggesting that the SDK be reinstalled, retry the full ADB path with the required filesystem or sandbox approval.

Check the device connection with:

```powershell
& 'C:\Users\home\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices -l
```

Install an APK with:

```powershell
& 'C:\Users\home\AppData\Local\Android\Sdk\platform-tools\adb.exe' -s R3CWA0L9A3D install -r '<absolute-apk-path>'
```

If the device is listed as `unauthorized`, unlock the phone and approve the USB debugging prompt before retrying. For standalone testing without Metro, install the release APK containing `assets/index.android.bundle`; a debug APK requires Metro on port `8081` and can otherwise remain on the splash screen.

## Expo SDK 54 Notes

Before writing code, read the exact versioned Expo docs:

```text
https://docs.expo.dev/versions/v54.0.0/
```

Important SDK 54 baseline from the docs:

- Expo SDK 54 targets React Native 0.81.
- Expo SDK 54 targets React 19.1.
- Minimum Node.js version is 20.19.x.
- Android compile SDK is 36.
- Android target SDK is 36.

This project currently uses Expo `~54.0.34`, React Native `0.81.5`, and React `19.1.0`.

## Main Goal

Build a real Android Auto Clicker with:

1. Draggable target
2. Auto click engine
3. Adjustable click interval
4. Floating overlay
5. Tapping inside other Android apps
6. Background operation

The final implementation must use native Android APIs:

- Accessibility Service
- `dispatchGesture()`
- Overlay Window
- Kotlin native code

## Current Architecture

Main screen:

- `app/(tabs)/index.tsx`

Main UI components:

- `components/draggable-target.tsx`
- `components/auto-click-panel.tsx`
- `components/click-ripple.tsx`
- `components/web-demo-auto-clicker.tsx`

Main state hook:

- `hooks/use-auto-click-engine.ts`

Storage:

- `lib/target-position-storage.ts`
- AsyncStorage key: `auto-clicker/target-position`

Native Android placeholders:

- `android/app/src/main/java/com/cro383/autoclicker/AutoClickerModule.kt`
- `android/app/src/main/java/com/cro383/autoclicker/AutoClickerPackage.kt`

Current flow:

```text
Home Screen
-> AutoClickPanel
-> useAutoClickEngine
-> clickCount / interval / running state

Home Screen
-> DraggableTarget
-> AsyncStorage target position
-> ClickRipple visual feedback
```

## Current Implemented Features

### Draggable Target

Status: complete for in-app prototype.

- Red circular target
- Size: 80 x 80
- Smooth dragging
- Gesture Handler based pan gesture
- Reanimated shared values
- Constrained to screen bounds

### Coordinate Display

Status: complete.

- Shows real-time X coordinate
- Shows real-time Y coordinate
- Coordinates represent the top-left corner of the target
- Target center is `x + 40`, `y + 40`

### Target Position Persistence

Status: complete.

- Saves target position automatically
- Restores position after restart
- Persists across app launches
- Clamps saved position inside current screen bounds

### Auto Click Engine

Status: complete for simulation only.

- Start
- Stop
- Running state
- Click count
- JavaScript timer

Important limitation:

- It does not perform real Android taps yet.

### Interval Controls

Status: complete for in-app prototype.

- Default interval: `1000 ms`
- Minimum interval: `100 ms`
- Maximum interval: `5000 ms`
- Step: `100 ms`
- Interval buttons are disabled while running

### Visual Click Feedback

Status: complete.

- White ripple animation
- Ripple appears at the captured click position
- Ripple expands and fades
- Ripple is intentionally not attached to the draggable target after the click point is captured

### Web Demonstration Mode

Status: complete for browser presentation.

- Runs through `npm run web`
- Uses the existing auto click engine state
- Provides mouse-drag target movement
- Shows click count, interval, running state, and ripple feedback
- Does not use Accessibility Service, overlay windows, or native Android clicking

## Known Issues

- Some older documentation files contained broken encoding artifacts and stale roadmap details.
- Native Android module methods currently only log placeholder messages.
- Real Android clicking is not implemented yet.

## Current Project Status

Current phase:

```text
In-app UI prototype with native module placeholders
```

The in-app prototype should be preserved while native Android functionality is added incrementally.

## Important Design Decisions

### Android Only

Do not spend effort on iOS unless explicitly requested.

### Prototype vs Real Clicker

The current React Native UI simulates clicking inside the app. It is useful for target positioning, interval control, and UX validation.

Real clicking outside the app must move to native Android code.

### Native Ownership

The native Android layer should eventually own:

- Accessibility permission checks
- Overlay permission checks
- Floating overlay lifecycle
- Target position used for real taps
- Timer for real auto clicking
- `dispatchGesture()` calls

React Native should remain the configuration and control UI.

## Roadmap

### Phase 1: In-App UI Prototype

Status: completed.

Includes:

- Draggable target
- Coordinate display
- Position persistence
- Start / Stop controls
- Interval controls
- Click count
- Ripple feedback

### Phase 2: Clean Current Prototype

Status: next.

Recommended tasks:

- Fix corrupted text in `AutoClickPanel`
- Verify current Android build
- Confirm native module registration
- Keep all existing UI behavior working

### Phase 3: Native Module Contract

Goal:

- Define a stable TypeScript-to-Kotlin API.

Expected native calls:

- `start`
- `stop`
- `setInterval`
- `setTargetPosition`
- Permission check methods
- Permission request methods

### Phase 4: Accessibility Service

Goal:

- Add and register an Android Accessibility Service.
- Implement service lifecycle.
- Add permission guidance.
- Do not add risky click automation until service wiring is verified.

### Phase 5: Real Gesture Dispatch

Goal:

- Implement real tap gestures through `dispatchGesture()`.
- Move real click timer into native Android code.

### Phase 6: Floating Overlay

Goal:

- Add an Android overlay target using `WindowManager`.
- Request and validate overlay permission.
- Allow dragging target over other apps.

### Phase 7: Complete Real Android Auto Clicker

Goal:

- Combine React Native UI, native module, Accessibility Service, real gesture dispatch, overlay, and robust permission handling.

## Development Principles

- Build incrementally.
- Preserve existing working functionality.
- Prefer editing existing files.
- Avoid unnecessary refactoring.
- Keep implementations simple.
- Test after every feature.
- Keep Android as the only supported platform.
- Do not implement large architectural changes without user approval.

## Notes For Future AI Sessions

Before making code changes:

1. Read this file completely.
2. Read `AGENTS.md`.
3. Read the Expo SDK 54 docs.
4. Inspect the existing project.
5. Explain the implementation plan.
6. Wait for user approval before modifying files.

After completing changes, always report:

- Files modified
- Summary
- Reason
- Testing
- Risks
