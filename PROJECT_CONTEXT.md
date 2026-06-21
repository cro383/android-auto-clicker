# PROJECT_CONTEXT.md

## Project Overview

This project is an Android-only Auto Clicker built with:

* React Native
* Expo SDK 54
* Expo Router
* TypeScript
* React Native Reanimated
* React Native Gesture Handler

The project is being developed in Cursor.

Target platform:

* Android only
* iOS support is NOT required

---

# Development Environment

User environment:

* Windows
* Node.js v24.x
* npm / npx installed
* Git installed
* Cursor installed
* Expo Go used on a real Android device

Project location:

E:\Projects\my-first-app

---

# Main Goal

Create an Android Auto Clicker with:

1. Draggable target area
2. Auto click simulation system
3. Adjustable click interval
4. Floating overlay support (future)
5. Clicking inside other Android apps (future)

Current work focuses only on the in-app prototype.

---

# Current Architecture

Home Screen:

app/(tabs)/index.tsx

Main components:

* DraggableTarget
* AutoClickPanel
* ClickRipple

Main hook:

* useAutoClickEngine

Storage:

* AsyncStorage

---

# Completed Features

## 1. Draggable Target

Status: Complete

Features:

* Red circular target
* Size: 80x80
* Can be dragged anywhere
* Smooth dragging
* Uses Gesture Handler
* Uses Reanimated
* Constrained to screen bounds

---

## 2. Coordinate Display

Status: Complete

Features:

* Displays current X coordinate
* Displays current Y coordinate
* Updates in real time while dragging

Coordinates represent:

* Top-left corner of the target

Target center can be calculated as:

Center X = X + 40
Center Y = Y + 40

---

## 3. Target Position Persistence

Status: Complete

Storage:

* AsyncStorage

Behavior:

* Saves target position automatically
* Restores target position on app launch
* Persists after app restart
* Handles screen bounds safely

Storage key:

auto-clicker/target-position

---

## 4. Auto Click Engine

Status: Complete

Features:

* Start button
* Stop button
* Running state
* Stopped state
* Click counter

Behavior:

* Click Count increases automatically while running
* Count continues across Start/Stop cycles

Implementation:

* JavaScript timer
* Non-blocking
* Dragging remains smooth while running

---

## 5. Interval Controls

Status: Complete

Default:

1000 ms

Controls:

* Minus button
* Plus button

Rules:

* Minus: -100 ms
* Plus: +100 ms

Limits:

* Minimum: 100 ms
* Maximum: 5000 ms

Behavior:

* Selected interval is used when Start is pressed

---

## 6. Visual Click Feedback

Status: Complete

Purpose:

Show where an auto-click occurs.

Current implementation:

* White ripple effect
* Appears at the click location
* Expands outward
* Fades out quickly

Important design decision:

The ripple is NOT attached to the red target itself.

Instead:

* Click position is captured
* Ripple appears at the click position
* Ripple remains at that position
* If the target is dragged immediately afterward, the ripple does not move

This accurately represents where the click occurred.

The visual effect was intentionally strengthened after testing because the original effect was too subtle.

---

# Verified Working Features

The following have been tested successfully on a real Android device:

✓ Drag target

✓ Coordinate updates

✓ Screen boundary limits

✓ Start button

✓ Stop button

✓ Click Count updates

✓ Interval controls

✓ Position persistence

✓ Click ripple effect

✓ Dragging while auto-clicking

---

# Important Design Decisions

## Android Only

The project is Android-focused.

Do not spend development effort on iOS compatibility unless explicitly requested.

---

## Future Overlay Support

The current draggable target exists only inside the application.

Future goal:

Display a floating overlay above other Android applications.

Likely technologies:

* Android Accessibility Service
* SYSTEM_ALERT_WINDOW
* Native Android modules

This will require moving beyond Expo Go and eventually creating a native Android build.

---

# Future Roadmap

## Phase 1 (Current)

In-app prototype

Completed:

* Draggable target
* Coordinates
* Start/Stop
* Interval control
* Persistence
* Click feedback

---

## Phase 2

Improve auto-click simulation

Potential additions:

* Click location indicator
* Multiple targets
* Long press support
* Randomized interval support

---

## Phase 3

Android Native Features

Potential additions:

* Floating overlay
* Accessibility Service
* Global clicking outside the app
* Background operation

---

# Notes For Future AI Sessions

Before making changes:

1. Read this entire document.
2. Preserve all completed functionality.
3. Do not remove working drag behavior.
4. Do not break persistence.
5. Do not break interval controls.
6. Do not break click feedback.
7. Keep Android as the primary platform.

Current project state is considered stable and functional.
