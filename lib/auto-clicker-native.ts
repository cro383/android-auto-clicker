import { NativeModules, Platform } from 'react-native';

type AutoClickerNativeModule = {
  start(): void;
  stop(): void;
  setInterval(intervalMs: number): void;
  setTargetPosition(x: number, y: number): void;
  checkAccessibilityPermission(): Promise<boolean>;
  requestAccessibilityPermission(): void;
  checkOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): void;
};

const nativeModule = NativeModules.AutoClicker as AutoClickerNativeModule | undefined;

function requireAndroidModule(): AutoClickerNativeModule {
  if (Platform.OS !== 'android' || !nativeModule) {
    throw new Error('AutoClicker native module is only available in an Android native build.');
  }

  return nativeModule;
}

export const AutoClickerNative = {
  isAvailable: Platform.OS === 'android' && nativeModule != null,
  start: () => requireAndroidModule().start(),
  stop: () => requireAndroidModule().stop(),
  setInterval: (intervalMs: number) => requireAndroidModule().setInterval(intervalMs),
  setTargetPosition: (x: number, y: number) =>
    requireAndroidModule().setTargetPosition(x, y),
  checkAccessibilityPermission: () =>
    requireAndroidModule().checkAccessibilityPermission(),
  requestAccessibilityPermission: () =>
    requireAndroidModule().requestAccessibilityPermission(),
  checkOverlayPermission: () => requireAndroidModule().checkOverlayPermission(),
  requestOverlayPermission: () => requireAndroidModule().requestOverlayPermission(),
};
