# Architecture Document

## Overview
The current project is an Expo prototype of an Android Auto Clicker. This document outlines the proposed final architecture after migrating to a standalone Android native application. The goal is to build a real Android Auto Clicker leveraging Android Accessibility Service, a floating overlay, native Android services, `SYSTEM_ALERT_WINDOW`, accessibility gestures, and background operation.

## Final Architecture Diagram

```mermaid
graph TD
    RN_UI[React Native UI]
    NM_Interface[Native Module Interface]
    ACCESSIBILITY_SERVICE[AccessibilityService]
    
    subgraph AccessibilityService
        OVERLAY[Overlay]
        TIMER[Timer]
        DISPATCH_GESTURE[dispatchGesture()]
        PERMISSION_MANAGEMENT[Permission Management]
    end

    RN_UI -- Calls --> NM_Interface
    NM_Interface -- Implemented by --> ACCESSIBILITY_SERVICE
    ACCESSIBILITY_SERVICE -- Controls --> OVERLAY
    ACCESSIBILITY_SERVICE -- Manages --> TIMER
    ACCESSIBILITY_SERVICE -- Executes --> DISPATCH_GESTURE
    ACCESSIBILITY_SERVICE -- Handles --> PERMISSION_MANAGEMENT

    style ACCESSIBILITY_SERVICE fill:#f9f,stroke:#333,stroke-width:2px
    style OVERLAY fill:#ccf,stroke:#333,stroke-width:2px
    style TIMER fill:#ccf,stroke:#333,stroke-width:2px
    style DISPATCH_GESTURE fill:#ccf,stroke:#333,stroke-width:2px
    style PERMISSION_MANAGEMENT fill:#ccf,stroke:#333,stroke-width:2px

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
    *   **Responsibilities:** Start/Stop buttons, Interval controls, Target position, Status display, Coordinate display.

### Native Module Interface (TypeScript)
*   **Purpose:** Defines the contract for communication between the React Native JavaScript layer and the underlying Android native modules. This ensures type safety and a clear API for native functionality.
*   **Example:** `native-modules/AutoClickerModule.ts` will declare functions like `startAutoClicker`, `stopAutoClicker`, `setClickInterval`, `setTargetPosition`.

### AccessibilityService (Core Native Component)
*   **Purpose:** The central native component responsible for all core auto-clicking functionality, including gesture dispatching, overlay management, timer execution, and permission handling.
*   **Key Responsibilities:**
    *   **Gesture Dispatching:** Executes `dispatchGesture()` to perform simulated clicks at specified coordinates.
    *   **Overlay Management:** Creates, manages, and updates the floating overlay window that displays the draggable target and controls over other applications. This includes handling `SYSTEM_ALERT_WINDOW` permission.
    *   **Timer Execution:** Manages the auto-click timer to trigger clicks at the defined interval. This replaces the JavaScript-based timer.
    *   **Permission Management:** Handles checking for and requesting necessary permissions, particularly Accessibility Service and `SYSTEM_ALERT_WINDOW`.
    *   Receives commands from React Native (e.g., start/stop auto-clicking, update interval, target coordinates) via the Native Module.
    *   Provides state updates back to React Native.
