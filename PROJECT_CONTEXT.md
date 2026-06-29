# PROJECT_CONTEXT.md

# Android Auto Clicker Project Context

## Project Overview

This project is an Android-only Auto Clicker built with:

* React Native
* Expo SDK 54
* Expo Router
* TypeScript
* React Native Reanimated
* React Native Gesture Handler

Current development IDE:

* VS Code
* Cline AI
* Google Gemini (gemini-2.5-flash)

Target platform:

* Android only
* iOS support is NOT required

The current project is an in-app prototype.

The final goal is to build a real Android Auto Clicker using Android Accessibility Service.

---

# Development Environment

## A Computer (Primary)

Project Path

E:\Projects\my-first-app

IDE

VS Code

---

## B Computer (Secondary)

Project Path

D:\Projects\android-auto-clicker

IDE

VS Code

Purpose

Backup and secondary development.

---

Environment

* Windows
* Node.js v24.x
* npm / npx installed
* Git installed
* Expo Go on a real Android device

---

# Repository

GitHub Repository

https://github.com/cro383/android-auto-clicker

Git is the single source of truth.

When switching computers:

1. git pull
2. npm install (if needed)
3. npx expo start --clear
4. Test using Expo Go

Commit after every completed feature.

---

# Main Goal

Create a real Android Auto Clicker with:

1. Draggable target
2. Auto click engine
3. Adjustable click interval
4. Floating overlay
5. Clicking inside other Android apps
6. Background operation

Current work focuses only on the in-app prototype.

---

# Current Architecture

Home Screen

app/(tabs)/index.tsx

Main Components

* DraggableTarget
* AutoClickPanel
* ClickRipple

Main Hook

* useAutoClickEngine

Storage

* AsyncStorage

Architecture

Home Screen

↓

Draggable Target

↓

Auto Click Engine

↓

Visual Click Feedback

↓

AsyncStorage

---

# Completed Features

## 1. Draggable Target

Status

Complete

Features

* Red circular target
* Size: 80 × 80
* Smooth dragging
* Uses Gesture Handler
* Uses Reanimated
* Constrained to screen bounds

---

## 2. Coordinate Display

Status

Complete

Features

* Real-time X coordinate
* Real-time Y coordinate

Coordinates represent

Top-left corner of the target.

Target center

Center X = X + 40

Center Y = Y + 40

---

## 3. Target Position Persistence

Status

Complete

Storage

AsyncStorage

Behavior

* Automatically saves position
* Restores after restart
* Persists across app launches
* Safely clamps inside screen bounds

Storage Key

auto-clicker/target-position

---

## 4. Auto Click Engine

Status

Complete

Features

* Start
* Stop
* Running state
* Click Count

Behavior

* Click Count increases automatically
* Dragging remains smooth while running
* JavaScript timer only
* No real Android click yet

---

## 5. Interval Controls

Status

Complete

Default

1000 ms

Controls

* Minus
* Plus

Rules

* Minus = -100 ms
* Plus = +100 ms

Limits

* Minimum = 100 ms
* Maximum = 5000 ms

Behavior

Selected interval is applied when Start is pressed.

---

## 6. Visual Click Feedback

Status

Complete

Purpose

Show exactly where the simulated click occurred.

Implementation

* White ripple animation
* Appears at the click position
* Expands outward
* Quickly fades away

Important Design Decision

The ripple is NOT attached to the red target.

Instead:

* Click position is captured
* Ripple is created at that location
* Ripple stays there
* Dragging immediately afterward does not move the ripple

This accurately represents the click location.

---

# Verified Working Features

Successfully tested on a real Android device.

✓ Drag target

✓ Coordinate updates

✓ Screen boundary limits

✓ Start button

✓ Stop button

✓ Click Count

✓ Interval controls

✓ Position persistence

✓ Ripple animation

✓ Dragging while auto-clicking

---

# Current Project Status

Current phase

UI Prototype

Everything currently implemented is stable.

No known bugs.

---

# Important Design Decisions

## Android Only

This project targets Android only.

Do not spend development effort on iOS unless explicitly requested.

---

## Expo Go Limitations

Current project still runs in Expo Go.

Therefore:

* No Accessibility Service
* No Overlay Window
* No Native Module
* No Real Android Clicking

These will be implemented after moving beyond Expo Go.

---

## Future Native Architecture

React Native

↓

Native Module

↓

Accessibility Service

↓

dispatchGesture()

↓

Real Android Click

---

# Future Roadmap

## Phase 1

UI Prototype

Status

Completed

Includes

* Draggable target
* Coordinates
* Position persistence
* Start / Stop
* Interval controls
* Click feedback

---

## Phase 2

Accessibility Service Architecture

Next milestone.

Prepare project structure.

Do NOT implement native clicking yet.

---

## Phase 3

Expo Prebuild

Generate Android native project.

---

## Phase 4

React Native ↔ Kotlin Native Module

Bridge communication.

---

## Phase 5

Android Accessibility Service

Implement dispatchGesture().

---

## Phase 6

Floating Overlay

Display draggable target over other Android apps.

---

## Phase 7

Real Android Auto Clicker

Complete Android implementation.

---

# Development Principles

* Build incrementally.
* Preserve existing functionality.
* Prefer editing existing files.
* Avoid unnecessary refactoring.
* Keep implementations simple.
* Test after every feature.
* Android only.

---

# Notes For Future AI Sessions

Before making any code changes:

1. Read PROJECT_CONTEXT.md completely.
2. Read AGENTS.md.
3. Understand the current architecture.
4. Inspect the existing project.
5. Explain the implementation plan.
6. Wait for user approval before modifying files.
7. Preserve all completed functionality.
8. Keep Android as the only supported platform.

After completing changes:

* Summarize modified files.
* Explain why changes were made.
* Describe what should be tested.
* Mention any potential risks.

Current project state is considered stable and functional.
