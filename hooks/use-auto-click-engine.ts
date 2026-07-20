import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AutoClickerNative } from '@/lib/auto-clicker-native';

export const DEFAULT_INTERVAL_MS = 1000;
export const MIN_INTERVAL_MS = 100;
export const MAX_INTERVAL_MS = 5000;
export const INTERVAL_STEP_MS = 100;
const INTERVAL_STORAGE_KEY = 'auto-clicker/interval-ms';

export function useAutoClickEngine() {
  const [isRunning, setIsRunning] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalLoadedRef = useRef(false);

  const start = useCallback(() => {
    if (AutoClickerNative.isAvailable) {
      void AutoClickerNative.start().then((started) => {
        if (started) {
          setIsRunning(true);
        }
      }).catch(() => {
        setIsRunning(false);
      });
      return;
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
    void AsyncStorage.getItem(INTERVAL_STORAGE_KEY)
      .then((stored) => {
        const parsed = Number(stored);
        if (Number.isFinite(parsed)) {
          setIntervalMs(Math.max(MIN_INTERVAL_MS, Math.min(MAX_INTERVAL_MS, parsed)));
        }
      })
      .catch(() => {
        // Keep the default interval when storage is unavailable.
      })
      .finally(() => {
        intervalLoadedRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (intervalLoadedRef.current) {
      void AsyncStorage.setItem(INTERVAL_STORAGE_KEY, String(intervalMs));
    }
  }, [intervalMs]);

  useEffect(() => {
    if (AutoClickerNative.isAvailable) {
      AutoClickerNative.setInterval(intervalMs);
    }
  }, [intervalMs]);

  useEffect(() => {
    if (!AutoClickerNative.isAvailable) {
      return;
    }

    const subscription = AutoClickerNative.subscribeToState((state) => {
      setIsRunning(state.isRunning);
      setClickCount(state.clickCount);
    });
    void AutoClickerNative.getState()
      .then((state) => {
        setIsRunning(state.isRunning);
        setClickCount(state.clickCount);
      })
      .catch(() => {
        // Keep the local UI state if the native service is reconnecting.
      });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (AutoClickerNative.isAvailable) {
        AutoClickerNative.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (AutoClickerNative.isAvailable) {
      return;
    }

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
