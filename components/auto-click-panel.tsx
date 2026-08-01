import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OrbitingBorderGlow } from '@/components/orbiting-border-glow';

import {
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  type AutoClickEngine,
} from '@/hooks/use-auto-click-engine';

export function AutoClickPanel({
  isRunning,
  clickCount,
  intervalMs,
  start,
  stop,
  decreaseInterval,
  increaseInterval,
}: AutoClickEngine) {

  const atMinInterval = intervalMs <= MIN_INTERVAL_MS;
  const atMaxInterval = intervalMs >= MAX_INTERVAL_MS;

  return (
    <View style={styles.panel}>
      <Text style={styles.statusText}>
        Status:{' '}
        <Text style={isRunning ? styles.running : styles.stopped}>
          {isRunning ? 'Running' : 'Stopped'}
        </Text>
      </Text>
      <Text style={styles.countText}>Click Count: {clickCount}</Text>
      <Text style={styles.intervalLabel}>Interval: {intervalMs} ms</Text>
      <View style={styles.intervalRow}>
        <Pressable
          style={[
            styles.intervalButton,
            (isRunning || atMinInterval) && styles.buttonDisabled,
          ]}
          onPress={decreaseInterval}
          disabled={isRunning || atMinInterval}>
          <Text style={styles.intervalButtonText}>-</Text>
        </Pressable>
        <Pressable
          style={[
            styles.intervalButton,
            (isRunning || atMaxInterval) && styles.buttonDisabled,
          ]}
          onPress={increaseInterval}
          disabled={isRunning || atMaxInterval}>
          <Text style={styles.intervalButtonText}>+</Text>
        </Pressable>
      </View>
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.startButton, isRunning && styles.buttonDisabled]}
          onPress={start}
          disabled={isRunning}>
          <Text style={styles.buttonText}>정지</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            styles.stopButton,
            isRunning && styles.runningButtonEffect,
            !isRunning && styles.buttonDisabled,
          ]}
          onPress={stop}
          disabled={!isRunning}>
          <OrbitingBorderGlow active={isRunning} />
          <Text style={styles.buttonText}>작동중</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#111',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  running: {
    color: '#4ade80',
  },
  stopped: {
    color: '#f87171',
  },
  countText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  intervalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  intervalButton: {
    width: 56,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#dc2626',
  },
  stopButton: {
    backgroundColor: '#16a34a',
  },
  runningButtonEffect: {
    borderWidth: 2,
    borderColor: '#86efac',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
