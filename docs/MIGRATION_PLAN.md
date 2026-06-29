# Migration Plan

## Overview
The refined migration plan focuses on transitioning the Expo prototype to a robust Android native architecture, explicitly abandoning Expo Go for a standalone native build. The ultimate goal is a real Android Auto Clicker leveraging Android Accessibility Service, a floating overlay, native Android services, `SYSTEM_ALERT_WINDOW`, accessibility gestures, and background operation.

## Code Reusability and Native Module Requirements

### Parts that can remain unchanged (React Native):
*   **UI Components:** `DraggableTarget`, `AutoClickPanel`, `ClickRipple`, `ThemedText`, `ThemedView`, etc., will continue to form the user interface for setting up and controlling the auto-clicker. These will primarily be concerned with displaying the target, controls, and visual feedback.
*   **Hooks (Partial):** `useAutoClickEngine` can still manage the *state* of the auto-clicker within the React Native UI (e.g., `isRunning`, `clickCount`, `interval`). However, the actual *triggering* of clicks will be offloaded to the native layer.
*   **Utilities:** Generic utility functions or components that are purely presentational or perform calculations not tied to native modules can remain in React Native.

### Parts that should become Android native modules:
*   **AccessibilityService (Core Native Component):** As the core component, it will manage gesture dispatching, overlay management, timer execution, and permission-related behavior. This consolidates the native auto-click engine logic, floating overlay logic, and accessibility service interaction into a single, central native component.

## Key Migration Decisions

### 1. When to leave Expo Go:
We should transition away from Expo Go at the **end of Phase 2: Accessibility Service Architecture Preparation**. This phase focuses on preparing the project structure for native integration without implementing native clicking yet. By the end of this phase, the project should be ready for `npx expo prebuild` to generate the native Android project, effectively moving out of the Expo Go managed workflow.

### 2. Expo Prebuild vs. React Native CLI for long-term choice:
**Expo Prebuild is the recommended long-term choice.** While the goal is a fully native Android application, Expo Prebuild offers a smoother transition from the existing Expo project. It allows us to retain the benefits of Expo tooling (e.g., development server, asset management) while gaining access to the native project for custom native module development. Migrating directly to React Native CLI would involve recreating much of the project setup that Expo already provides, leading to a more complex and time-consuming migration. Expo Prebuild allows incremental native development while still leveraging the Expo ecosystem for parts that remain in React Native.

### 3. Which Android native components should own the auto-click engine:
The auto-click engine should be entirely owned by the **AccessibilityService**. This service will manage gesture dispatching, overlay management, timer execution, and permission-related behavior.

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

**Phase 2: Expo Prebuild**
*   **Goal:** Generate the native Android project.
*   **Tasks:**
    *   Run `npx expo prebuild` to generate the `android/` directory.
    *   Configure the Android project for native module development.

**Phase 3: Native Android Project Setup & Native Module Interface**
*   **Goal:** Establish the basic structure for custom native modules and define the communication bridge.
*   **Tasks:**
    *   Create the `native-modules/` directory.
    *   Create `AutoClickerModule.ts` defining the TypeScript interface for native auto-clicker functions (e.g., `startAutoClicker`, `stopAutoClicker`, `setClickInterval`, `setTargetPosition`).
    *   Implement a basic Android Native Module (e.g., `AutoClickerModule.kt`) that corresponds to `AutoClickerModule.ts`. Initially, these native methods will act as a proxy to the `AccessibilityService`.
    *   Modify `useAutoClickEngine` to call these new native module methods instead of its internal JavaScript timer for actual clicks.

**Phase 4: AccessibilityService Implementation**
*   **Goal:** Implement the core Accessibility Service functionality, including timer execution and initial permission handling.
*   **Tasks:**
    *   Add necessary permissions and declarations to `AndroidManifest.xml` for `AccessibilityService`.
    *   Create `AutoClickerAccessibilityService.kt` that extends `AccessibilityService`.
    *   Implement `onServiceConnected()`, `onAccessibilityEvent()`, `onInterrupt()`.
    *   Implement the auto-click timer logic within `AutoClickerAccessibilityService.kt`.
    *   Develop the `dispatchGesture` logic within the `AutoClickerAccessibilityService`.
    *   Implement permission checking and requesting for Accessibility Service within `AutoClickerAccessibilityService.kt`.
    *   Connect `AutoClickerModule.kt` to send commands (start/stop, coordinates, interval) to `AutoClickerAccessibilityService`.

**Phase 5: Floating Overlay Implementation**
*   **Goal:** Implement the draggable target and controls as a floating overlay managed by the `AccessibilityService`.
*   **Tasks:**
    *   Add `SYSTEM_ALERT_WINDOW` permission to `AndroidManifest.xml`.
    *   Implement the floating window management within `AutoClickerAccessibilityService.kt`.
    *   Create the UI for the floating window using native Android Views or Jetpack Compose.
    *   Implement drag functionality for the overlay, communicating position changes within the `AccessibilityService`.

**Phase 6: Real Auto-Click Implementation & Refinement**
*   **Goal:** Integrate all components to achieve a functional, real Android Auto Clicker with robust error handling and performance.
*   **Tasks:**
    *   Refine communication between React Native UI, Native Module, and `AccessibilityService`.
    *   Implement robust error handling and permission request flows.
    *   Thoroughly test all functionalities across different Android versions and devices.
    *   Optimize performance and resource usage.
