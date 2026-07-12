# Architecture

## Overview

This project is an Android-only Auto Clicker. The current app is an in-app React Native prototype with Android native module placeholders. The final architecture should keep React Native focused on configuration UI while moving real clicking, overlay behavior, and permission-sensitive work into native Android code.

## Current Runtime Architecture

```text
app/(tabs)/index.tsx
-> AutoClickPanel
-> useAutoClickEngine
-> JavaScript interval
-> clickCount

app/(tabs)/index.tsx
-> DraggableTarget
-> Gesture Handler / Reanimated
-> AsyncStorage position persistence
-> ClickRipple visual feedback
```

Current native files:

- `AutoClickerModule.kt` exposes placeholder methods to React Native.
- `AutoClickerPackage.kt` registers the native module package.
- `AndroidManifest.xml` already includes `SYSTEM_ALERT_WINDOW`, but no overlay implementation exists yet.

## Current Layer Responsibilities

### React Native UI

Files:

- `app/(tabs)/index.tsx`
- `components/draggable-target.tsx`
- `components/auto-click-panel.tsx`
- `components/click-ripple.tsx`

Responsibilities:

- Show the auto clicker control screen
- Display target coordinates
- Allow in-app target dragging
- Show Start / Stop state
- Show and change interval
- Show simulated click feedback

### React Native State

File:

- `hooks/use-auto-click-engine.ts`

Responsibilities:

- Track running state
- Track click count
- Track selected interval
- Run the current simulation timer

Limitation:

- This hook does not perform real Android clicks.

### Storage

File:

- `lib/target-position-storage.ts`

Responsibilities:

- Load target position from AsyncStorage
- Save target position to AsyncStorage
- Clamp target position to visible bounds

### Native Android Placeholder

Files:

- `android/app/src/main/java/com/cro383/autoclicker/AutoClickerModule.kt`
- `android/app/src/main/java/com/cro383/autoclicker/AutoClickerPackage.kt`

Responsibilities today:

- Register a React Native native module
- Provide placeholder methods for start, stop, interval, and target position

Responsibilities later:

- Bridge React Native commands to the Accessibility Service
- Expose permission checks and permission request entry points
- Send native state updates back to React Native if needed

## Target Native Architecture

```text
React Native UI
-> TypeScript native module wrapper
-> Kotlin AutoClickerModule
-> AutoClickerAccessibilityService
-> Native timer
-> dispatchGesture()
-> Real Android tap

AutoClickerAccessibilityService
-> WindowManager overlay
-> Draggable native target
-> Overlay permission handling
-> Accessibility permission handling
```

## Final Native Responsibilities

### Kotlin Native Module

The native module should be a thin bridge. It should not own the click loop long term.

Expected responsibilities:

- `start`
- `stop`
- `setInterval`
- `setTargetPosition`
- `checkAccessibilityPermission`
- `requestAccessibilityPermission`
- `checkOverlayPermission`
- `requestOverlayPermission`

### Accessibility Service

The Accessibility Service should own the real auto clicker engine.

Expected responsibilities:

- Maintain service lifecycle
- Store active target coordinates
- Store active click interval
- Start and stop native click timer
- Call `dispatchGesture()`
- Clean up on interruption or service destruction

### Floating Overlay

The overlay should be native Android UI managed through `WindowManager`.

Expected responsibilities:

- Show the target over other apps
- Allow target dragging outside the React Native app
- Update target coordinates in native state
- Respect overlay permission and lifecycle

## Design Rules

- Preserve the current in-app prototype while adding native features.
- Keep React Native as the control/configuration layer.
- Keep real clicking inside the Accessibility Service.
- Do not implement large native architecture changes without approval.
- Add native behavior incrementally and verify each step on Android.
