# Architecture Document

## Overview
The current project is an Expo prototype of an Android Auto Clicker. This document outlines the proposed final architecture after migrating to a standalone Android native application. The goal is to build a real Android Auto Clicker leveraging Android Accessibility Service, a floating overlay, native Android services, `SYSTEM_ALERT_WINDOW`, accessibility gestures, and background operation.

## Final Architecture Diagram

```mermaid
graph TD
    RN_UI[React Native UI (app/(tabs)/index.tsx, components/*)]
    NM_Interface[Native Module Interface (native-modules/AutoClickerModule.ts)]
    NATIVE_MODULE[AutoClickerModule.kt (native-modules/android/)]
    NATIVE_SERVICE[AutoClickerService.kt (services/android/)]
    ACCESSIBILITY_SERVICE[AutoClickerAccessibilityService.kt]
    OVERLAY_SERVICE[OverlayService.kt (services/android/)]
    ANDROID_OS[Android OS]

    RN_UI -- Calls --> NM_Interface
    NM_Interface -- Implemented by --> NATIVE_MODULE
    NATIVE_MODULE -- Communicates with --> NATIVE_SERVICE
    NATIVE_SERVICE -- Utilizes --> ACCESSIBILITY_SERVICE
    NATIVE_SERVICE -- Manages --> OVERLAY_SERVICE
    OVERLAY_SERVICE -- Displays UI over --> ANDROID_OS
    ACCESSIBILITY_SERVICE -- Dispatches Gestures to --> ANDROID_OS
    ANDROID_OS -- Provides Events to --> ACCESSIBILITY_SERVICE
    NATIVE_MODULE -- Receives State Updates from --> NATIVE_SERVICE

    subgraph Android Native Layer
        NATIVE_MODULE
        NATIVE_SERVICE
        ACCESSIBILITY_SERVICE
        OVERLAY_SERVICE
    end

    subgraph React Native Layer
        RN_UI
        NM_Interface
    end

```

## Component Breakdown

### React Native UI Layer
*   **Purpose:** Provides the user interface for configuring and controlling the auto-clicker. This layer is responsible for displaying the draggable target, auto-click controls (start/stop, interval), and visual click feedback.
*   **Key Components:**
    *   `app/(tabs)/index.tsx`: The main home screen.
    *   `components/draggable-target.tsx`: Handles the visual representation and basic dragging logic of the target *within the app*.
    *   `components/auto-click-panel.tsx`: Contains the controls for initiating/stopping auto-clicking and adjusting the click interval.
    *   `components/click-ripple.tsx`: Provides visual feedback for simulated clicks.
    *   `hooks/use-auto-click-engine.ts`: Manages the state of the auto-clicker within the React Native UI (e.g., `isRunning`, `clickCount`, `interval`). It will communicate with the native layer to trigger actual clicks.

### Native Module Interface (TypeScript)
*   **Purpose:** Defines the contract for communication between the React Native JavaScript layer and the underlying Android native modules. This ensures type safety and a clear API for native functionality.
*   **Example:** `native-modules/AutoClickerModule.ts` will declare functions like `startNativeClicking`, `stopNativeClicking`, `setClickInterval`, `setTargetPosition`.

### AutoClickerModule.kt (Android Native Module)
*   **Purpose:** The bridge between React Native and the Android native services. It receives calls from the React Native UI and forwards them to the appropriate native Android services.
*   **Responsibilities:**
    *   Receive commands from React Native (e.g., start/stop auto-clicking, update interval, target coordinates).
    *   Communicate with `AutoClickerService.kt` to control the auto-clicking logic.
    *   Potentially provide state updates back to React Native.

### AutoClickerService.kt (Android Native Service)
*   **Purpose:** Manages the core auto-clicking logic, including the timer and coordination with the Accessibility Service. This service will run in the background.
*   **Responsibilities:**
    *   Control the auto-click timer based on the configured interval.
    *   Receive target position and interval updates from `AutoClickerModule.kt`.
    *   Instruct `AutoClickerAccessibilityService.kt` to dispatch gestures.
    *   Handle background execution and persistence of the auto-clicking process.

### AutoClickerAccessibilityService.kt (Android Accessibility Service)
*   **Purpose:** Interacts directly with the Android system to perform accessibility gestures (simulated clicks) over other applications.
*   **Responsibilities:**
    *   Request and manage Accessibility Service permissions.
    *   Receive commands from `AutoClickerService.kt` (e.g., dispatch a click at specific coordinates).
    *   Execute `dispatchGesture()` to perform the simulated clicks.
    *   Monitor accessibility events if needed (though the primary function is to dispatch gestures).

### OverlayService.kt (Android Native Service for Floating Overlay)
*   **Purpose:** Manages the floating overlay window that displays the draggable target and controls over other applications.
*   **Responsibilities:**
    *   Request `SYSTEM_ALERT_WINDOW` permission.
    *   Create and manage the floating window.
    *   Render the UI for the draggable target and controls within the overlay. This UI might be built using native Android Views or Jetpack Compose, potentially mirroring the React Native UI.
    *   Communicate target position changes and control interactions (start/stop, interval) back to `AutoClickerService.kt` and/or `AutoClickerModule.kt`.
