import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OrbitingBorderGlow } from '@/components/orbiting-border-glow';

import { type AutoClickEngine } from '@/hooks/use-auto-click-engine';

export function AutoClickPanel({
  isRunning,
  clickCount,
  intervalMs,
  start,
  stop,
}: AutoClickEngine) {
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
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
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
