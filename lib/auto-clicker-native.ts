import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type AutoClickerNativeState = {
  isRunning: boolean;
  clickCount: number;
};

type AutoClickerNativeModule = {
  start(): Promise<boolean>;
  stop(): void;
  setInterval(intervalMs: number): void;
  setTargetPosition(x: number, y: number): void;
  showOverlay(): void;
  hideOverlay(): void;
  checkOverlayVisible(): Promise<boolean>;
  getState(): Promise<AutoClickerNativeState>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  checkAccessibilityPermission(): Promise<boolean>;
  requestAccessibilityPermission(): void;
  checkOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): void;
};

const nativeModule = NativeModules.AutoClicker as AutoClickerNativeModule | undefined;
const nativeEvents = nativeModule ? new NativeEventEmitter(NativeModules.AutoClicker) : null;

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
  showOverlay: () => requireAndroidModule().showOverlay(),
  hideOverlay: () => requireAndroidModule().hideOverlay(),
  checkOverlayVisible: () => requireAndroidModule().checkOverlayVisible(),
  getState: () => requireAndroidModule().getState(),
  checkAccessibilityPermission: () =>
    requireAndroidModule().checkAccessibilityPermission(),
  requestAccessibilityPermission: () =>
    requireAndroidModule().requestAccessibilityPermission(),
  checkOverlayPermission: () => requireAndroidModule().checkOverlayPermission(),
  requestOverlayPermission: () => requireAndroidModule().requestOverlayPermission(),
  subscribeToState: (listener: (state: AutoClickerNativeState) => void) => {
    if (!nativeEvents) {
      return { remove() {} };
    }
    return nativeEvents.addListener('AutoClickerStateChanged', listener);
  },
};
