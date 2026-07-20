# Android Auto Clicker

This project is an Android-only auto clicker built with Expo SDK 54, React Native, Expo Router, TypeScript, and Kotlin native Android code.

The goal is not to keep this as an Expo demo. The long-term goal is a real Android auto clicker that can tap outside the app by using:

- Android Accessibility Service
- `dispatchGesture()`
- Floating overlay window
- Native Android code

## Current Status

The app now has a working native Android auto clicker implementation:

- Draggable red target
- Accessibility Service and real taps through `dispatchGesture()`
- Floating overlay target over other Android apps
- Separate `MOVE` handle while auto clicking
- Saved target position
- Start and Stop controls
- Adjustable click interval
- Native click count and state synchronization
- Permission status and shortcuts to Android settings
- Standalone release APK build verified without Metro

For the full implementation status, usage instructions, testing notes, troubleshooting, and remaining work, see [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md).

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- React Native Gesture Handler
- React Native Reanimated
- AsyncStorage
- Kotlin Android native module and Accessibility Service

## Project Structure

- `app/(tabs)/index.tsx` - Main auto clicker screen
- `components/draggable-target.tsx` - In-app draggable target and coordinate display
- `components/auto-click-panel.tsx` - Start, stop, count, and interval controls
- `components/click-ripple.tsx` - Simulated click feedback
- `hooks/use-auto-click-engine.ts` - In-app auto click state and timer
- `lib/target-position-storage.ts` - Target position persistence and clamping
- `android/app/src/main/java/com/cro383/autoclicker/` - Android native entry points
- `docs/` - Architecture, migration, accessibility, and overlay design notes

## Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start --clear
```

Run the browser demonstration:

```bash
npm run web
```

Run Android development build:

```bash
npm run android
```

Lint:

```bash
npm run lint
```

## Important Notes

- Android is the only target platform.
- The web version is a demonstration mode only. It does not perform real Android taps.
- Do not add iOS-specific work unless explicitly requested.
- Read `PROJECT_CONTEXT.md` and `AGENTS.md` before code changes.
- Read the exact Expo SDK 54 docs before writing code: https://docs.expo.dev/versions/v54.0.0/
- Preserve the current working in-app prototype while moving toward native Android functionality.
