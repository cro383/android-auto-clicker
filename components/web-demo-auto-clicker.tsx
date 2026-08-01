import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ClickRipple } from '@/components/click-ripple';
import { OrbitingBorderGlow } from '@/components/orbiting-border-glow';
import {
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  type AutoClickEngine,
} from '@/hooks/use-auto-click-engine';

const TARGET_SIZE = 80;
const INITIAL_TARGET = { x: 320, y: 170 };

type Point = {
  x: number;
  y: number;
};

type StageSize = {
  width: number;
  height: number;
};

type WebDemoAutoClickerProps = AutoClickEngine;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function getClickPoint(position: Point) {
  return {
    x: position.x + TARGET_SIZE / 2,
    y: position.y + TARGET_SIZE / 2,
  };
}

export function WebDemoAutoClicker({
  isRunning,
  clickCount,
  intervalMs,
  start,
  stop,
  decreaseInterval,
  increaseInterval,
}: WebDemoAutoClickerProps) {
  const [stageSize, setStageSize] = useState<StageSize>({ width: 720, height: 420 });
  const [targetPosition, setTargetPosition] = useState<Point>(INITIAL_TARGET);
  const [clickPoint, setClickPoint] = useState<Point>(() => getClickPoint(INITIAL_TARGET));
  const dragStartRef = useRef<Point>(INITIAL_TARGET);
  const stageSizeRef = useRef<StageSize>(stageSize);
  const targetRef = useRef(targetPosition);
  stageSizeRef.current = stageSize;
  targetRef.current = targetPosition;

  const atMinInterval = intervalMs <= MIN_INTERVAL_MS;
  const atMaxInterval = intervalMs >= MAX_INTERVAL_MS;

  const onStageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) {
      return;
    }

    setStageSize({ width, height });
    setTargetPosition((position) => ({
      x: clamp(position.x, 0, Math.max(0, width - TARGET_SIZE)),
      y: clamp(position.y, 0, Math.max(0, height - TARGET_SIZE)),
    }));
  }, []);

  useEffect(() => {
    if (clickCount === 0) {
      return;
    }

    setClickPoint(getClickPoint(targetRef.current));
  }, [clickCount]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRef.current = targetRef.current;
      },
      onPanResponderMove: (_event, gestureState) => {
        const currentStageSize = stageSizeRef.current;
        setTargetPosition(
          {
            x: clamp(
              dragStartRef.current.x + gestureState.dx,
              0,
              Math.max(0, currentStageSize.width - TARGET_SIZE),
            ),
            y: clamp(
              dragStartRef.current.y + gestureState.dy,
              0,
              Math.max(0, currentStageSize.height - TARGET_SIZE),
            ),
          },
        );
      },
    }),
  ).current;

  return (
    <View style={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Android Auto Clicker</Text>
            <Text style={styles.subtitle}>Web demonstration mode</Text>
          </View>
          <View style={[styles.statusPill, isRunning ? styles.statusRunning : styles.statusStopped]}>
            <Text style={styles.statusPillText}>{isRunning ? 'Running' : 'Stopped'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.stagePanel}>
            <View style={styles.stageTopBar}>
              <Text style={styles.stageLabel}>Preview Surface</Text>
              <Text style={styles.coordText}>
                X {Math.round(targetPosition.x)} / Y {Math.round(targetPosition.y)}
              </Text>
            </View>
            <View style={styles.stage} onLayout={onStageLayout}>
              <View style={styles.gridLineHorizontal} />
              <View style={styles.gridLineVertical} />
              <View style={styles.rippleLayer}>
                <ClickRipple pulse={clickCount} x={clickPoint.x} y={clickPoint.y} />
              </View>
              <View
                {...panResponder.panHandlers}
                style={[
                  styles.target,
                  {
                    transform: [
                      { translateX: targetPosition.x },
                      { translateY: targetPosition.y },
                    ],
                  },
                ]}>
                <View style={styles.targetCore} />
              </View>
            </View>
          </View>

          <View style={styles.controlPanel}>
            <Text style={styles.panelTitle}>Controls</Text>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Click Count</Text>
                <Text style={styles.metricValue}>{clickCount}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Interval</Text>
                <Text style={styles.metricValue}>{intervalMs} ms</Text>
              </View>
            </View>

            <View style={styles.intervalRow}>
              <Pressable
                style={[
                  styles.iconButton,
                  (isRunning || atMinInterval) && styles.buttonDisabled,
                ]}
                onPress={decreaseInterval}
                disabled={isRunning || atMinInterval}>
                <Text style={styles.iconButtonText}>-</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.iconButton,
                  (isRunning || atMaxInterval) && styles.buttonDisabled,
                ]}
                onPress={increaseInterval}
                disabled={isRunning || atMaxInterval}>
                <Text style={styles.iconButtonText}>+</Text>
              </Pressable>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionButton, styles.startButton, isRunning && styles.buttonDisabled]}
                onPress={start}
                disabled={isRunning}>
                <Text style={styles.actionButtonText}>정지</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.stopButton,
                  isRunning && styles.runningButtonEffect,
                  !isRunning && styles.buttonDisabled,
                ]}
                onPress={stop}
                disabled={!isRunning}>
                <OrbitingBorderGlow active={isRunning} />
                <Text style={styles.actionButtonText}>작동중</Text>
              </Pressable>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                This browser preview simulates the auto clicker UI. Real Android tapping will use
                Accessibility Service and dispatchGesture().
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f1115',
    padding: 24,
  },
  shell: {
    flex: 1,
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 15,
    marginTop: 4,
  },
  statusPill: {
    minWidth: 106,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRunning: {
    backgroundColor: '#15803d',
  },
  statusStopped: {
    backgroundColor: '#991b1b',
  },
  statusPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: 18,
    minHeight: 0,
  },
  stagePanel: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#2f3a4a',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#151923',
  },
  stageTopBar: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2f3a4a',
  },
  stageLabel: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '700',
  },
  coordText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  stage: {
    flex: 1,
    minHeight: 420,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  rippleLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  target: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fecaca',
  },
  targetCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fee2e2',
  },
  controlPanel: {
    width: 340,
    borderWidth: 1,
    borderColor: '#2f3a4a',
    borderRadius: 8,
    backgroundColor: '#151923',
    padding: 18,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    minHeight: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  iconButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  noteBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#202637',
  },
  noteText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
});
