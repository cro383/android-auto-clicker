# Migration Plan

## Overview
The refined migration plan focuses on transitioning the Expo prototype to a robust Android native architecture, explicitly abandoning Expo Go for a standalone native build. The ultimate goal is a real Android Auto Clicker leveraging Android Accessibility Service, a floating overlay, native Android services, `SYSTEM_ALERT_WINDOW`, accessibility gestures, and background operation.

## Code Reusability and Native Module Requirements

### Parts that can remain unchanged (React Native):
*   **UI Components:** `DraggableTarget`, `AutoClickPanel`, `ClickRipple`, `ThemedText`, `ThemedView`, etc., will continue to form the user interface for setting up and controlling the auto-clicker. These will primarily be concerned with displaying the target, controls, and visual feedback.
*   **Hooks (Partial):** `useAutoClickEngine` can still manage the *state* of the auto-clicker within the React Native UI (e.g., `isRunning`, `clickCount`, `interval`). However, the actual *triggering* of clicks will be offloaded to the native layer.
*   **Utilities:** Generic utility functions or components that are purely presentational or perform calculations not tied to native modules can remain in React Native.

### Parts that should become Android native modules:
*   **Auto-Click Engine Logic:** The core auto-clicking mechanism, including the timer and dispatching of gestures, needs to be implemented as an Android native module. This module will be responsible for interacting with the Accessibility Service.
*   **Floating Overlay:** The draggable target and its controls, when operating over other applications, will require an Android native overlay window implementation using `SYSTEM_ALERT_WINDOW` permission.
*   **Accessibility Service Interaction:** All interactions with the Android Accessibility Service (e.g., requesting permissions, dispatching gestures) will be handled by a native module.
*   **Background Operation:** Logic for persistent background operation of the auto-clicker will reside in an Android native service.

## Key Migration Decisions

### 1. When to leave Expo Go:
We should transition away from Expo Go at the **end of Phase 2: Accessibility Service Architecture Preparation**. This phase focuses on preparing the project structure for native integration without implementing native clicking yet. By the end of this phase, the project should be ready for `npx expo prebuild` to generate the native Android project, effectively moving out of the Expo Go managed workflow.

### 2. Expo Prebuild vs. React Native CLI for long-term choice:
**Expo Prebuild is the recommended long-term choice.** While the goal is a fully native Android application, Expo Prebuild offers a smoother transition from the existing Expo project. It allows us to retain the benefits of Expo tooling (e.g., development server, asset management) while gaining access to the native project for custom native module development. Migrating directly to React Native CLI would involve recreating much of the project setup that Expo already provides, leading to a more complex and time-consuming migration. Expo Prebuild allows incremental native development while still leveraging the Expo ecosystem for parts that remain in React Native.

### 3. Which Android native components should own the auto-click engine:
The auto-click engine should primarily be owned by an **Android Native Service** that utilizes the **Accessibility Service**. This Native Service will:
*   Manage the click interval and count.
*   Receive commands (start/stop, update interval, target position) from the React Native UI via a Native Module.
*   Interact directly with the Android Accessibility Service to dispatch gestures at the specified coordinates and interval.
*   Handle background operation and ensure persistence.

### 4. Which React Native components should remain only as the UI layer:
All existing React Native components that are primarily responsible for visual presentation and user interaction should remain as the UI layer. This includes:
*   `app/(tabs)/index.tsx` (Home Screen)
*   `components/draggable-target.tsx` (Draggable Target UI, without native overlay logic)
*   `components/auto-click-panel.tsx` (Controls for start/stop, interval adjustments)
*   `components/click-ripple.tsx` (Visual click feedback)
*   `components/themed-text.tsx`, `components/themed-view.tsx`, and other UI-related components in `components/` and `constants/`.
*   `hooks/use-auto-click-engine.ts` (The state management part, sending commands to native, but not triggering actual clicks).

## Recommended Project Folder Structure After Migration
```
android-auto-clicker/
├── android/                # Generated native Android project (after expo prebuild)
│   ├── app/
│   ├── build.gradle
│   └── ...
├── app/                    # React Native UI components and screens
│   ├── (tabs)/
│   ├── _layout.tsx
│   ├── modal.tsx
│   └── ...
├── assets/
├── components/
├── constants/
├── hooks/
├── lib/
├── native-modules/         # New directory for custom native modules (e.g., AutoClickerModule.kt)
│   ├── AutoClickerModule.ts  # TypeScript interface for Native Module
│   └── android/              # Native Android code for the module
│       ├── src/
│       └── build.gradle
├── services/               # New directory for Android Services (e.g., AutoClickerService.kt)
│   └── android/              # Native Android code for services
│       ├── src/
│       └── build.gradle
├── .gitignore
├── AGENTS.md
├── app.json
├── package.json
├── PROJECT_CONTEXT.md
└── ...
```

## Step-by-Step Roadmap with Milestones

**Phase 1: UI Prototype (Completed)**
*   Draggable target, coordinates, position persistence, start/stop, interval controls, click feedback.

**Phase 2: Accessibility Service Architecture Preparation (Current Milestone)**
*   **Goal:** Prepare the project structure for native integration without implementing native clicking yet. Establish the communication bridge between React Native and the future native modules.
*   **Tasks:**
    *   Define Native Module interfaces in TypeScript for future native functionality (e.g., `startNativeClicking`, `stopNativeClicking`, `setClickInterval`, `setTargetPosition`).
    *   Modify `useAutoClickEngine` to call these new native module methods instead of its internal JavaScript timer for actual clicks.
    *   Introduce placeholder native module implementations (e.g., empty Kotlin files that expose the defined methods but do nothing) to allow the React Native side to be updated without breaking the app. *This step can be skipped initially if `expo prebuild` is performed early in Phase 3.* 

**Phase 3: Expo Prebuild & Initial Native Module Setup**
*   **Goal:** Generate the native Android project and set up the basic structure for custom native modules.
*   **Tasks:**
    *   Run `npx expo prebuild` to generate the `android/` directory.
    *   Configure the Android project to allow for custom native modules. This may involve editing `settings.gradle` and `app/build.gradle`.
    *   Create the `native-modules/` directory and an initial `AutoClickerModule.ts` defining the interface for the native auto-clicker functions.
    *   Implement a basic Android Native Module (e.g., `AutoClickerModule.kt`) that corresponds to `AutoClickerModule.ts`. Initially, these native methods will be empty or log calls.

**Phase 4: Android Accessibility Service Integration**
*   **Goal:** Implement the core Accessibility Service functionality within the native Android project.
*   **Tasks:**
    *   Add necessary permissions and declarations to `AndroidManifest.xml` for `AccessibilityService`.
    *   Create an `AutoClickerAccessibilityService.kt` that extends `AccessibilityService`.
    *   Implement `onAccessibilityEvent` and `onInterrupt` methods.
    *   Develop the `dispatchGesture` logic within the `AutoClickerAccessibilityService`.
    *   Connect `AutoClickerModule.kt` to send commands (start/stop, coordinates, interval) to `AutoClickerAccessibilityService`.

**Phase 5: Floating Overlay Implementation**
*   **Goal:** Implement the draggable target and controls as a floating overlay that can appear over other applications.
*   **Tasks:**
    *   Add `SYSTEM_ALERT_WINDOW` permission to `AndroidManifest.xml`.
    *   Create a native Android service (e.g., `OverlayService.kt`) responsible for managing the floating window.
    *   Implement the UI for the floating window in native Android (this might involve recreating a simplified version of `DraggableTarget` and `AutoClickPanel` in Android Views or Jetpack Compose, or finding a way to embed React Native components as a headles JS in the overlay, although the latter is more complex and might not be feasible).
    *   Establish communication between the `OverlayService` and the React Native UI to update target position and receive commands.

**Phase 6: Full Android Auto Clicker**
*   **Goal:** Integrate all components to achieve a functional, real Android Auto Clicker.
*   **Tasks:**
    *   Refine communication between React Native UI, Native Modules, Accessibility Service, and Floating Overlay.
    *   Implement robust error handling and permission request flows.
    *   Thoroughly test all functionalities across different Android versions and devices.
    *   Optimize performance and resource usage.
