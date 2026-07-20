import { useCallback, useEffect, useRef, useState } from 'react';

import { AutoClickerNative } from '@/lib/auto-clicker-native';

export const DEFAULT_INTERVAL_MS = 1000;
export const MIN_INTERVAL_MS = 100;
export const MAX_INTERVAL_MS = 5000;
export const INTERVAL_STEP_MS = 100;

export function useAutoClickEngine() {
  const [isRunning, setIsRunning] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (AutoClickerNative.isAvailable) {
      AutoClickerNative.start();
    }
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    if (AutoClickerNative.isAvailable) {
      AutoClickerNative.stop();
    }
    setIsRunning(false);
  }, []);

  const decreaseInterval = useCallback(() => {
    setIntervalMs((ms) => Math.max(MIN_INTERVAL_MS, ms - INTERVAL_STEP_MS));
  }, []);

  const increaseInterval = useCallback(() => {
    setIntervalMs((ms) => Math.min(MAX_INTERVAL_MS, ms + INTERVAL_STEP_MS));
  }, []);

  useEffect(() => {
    if (AutoClickerNative.isAvailable) {
      AutoClickerNative.setInterval(intervalMs);
    }
  }, [intervalMs]);

  useEffect(() => {
    return () => {
      if (AutoClickerNative.isAvailable) {
        AutoClickerNative.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setClickCount((count) => count + 1);
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, intervalMs]);

  return {
    isRunning,
    clickCount,
    intervalMs,
    start,
    stop,
    decreaseInterval,
    increaseInterval,
  };
}

export type AutoClickEngine = ReturnType<typeof useAutoClickEngine>;
