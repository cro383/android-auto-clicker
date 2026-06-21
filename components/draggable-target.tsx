import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { ClickRipple } from '@/components/click-ripple';
import {
  clampTargetPosition,
  loadTargetPosition,
  saveTargetPosition,
} from '@/lib/target-position-storage';

const TARGET_SIZE = 80;

type Coords = { x: number; y: number };
type Point = { x: number; y: number };

type DraggableTargetProps = {
  clickPulse?: number;
};

function getClickPoint(coords: Coords): Point {
  return {
    x: coords.x + TARGET_SIZE / 2,
    y: coords.y + TARGET_SIZE / 2,
  };
}

export function DraggableTarget({ clickPulse = 0 }: DraggableTargetProps) {
  const [coords, setCoords] = useState<Coords>({ x: 0, y: 0 });
  const [clickPoint, setClickPoint] = useState<Point>({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const applyPosition = useCallback(
    (x: number, y: number) => {
      translateX.value = x;
      translateY.value = y;
      setCoords({ x: Math.round(x), y: Math.round(y) });
    },
    [translateX, translateY],
  );

  const updateCoords = useCallback((x: number, y: number) => {
    const rounded = { x: Math.round(x), y: Math.round(y) };
    setCoords(rounded);
    void saveTargetPosition(rounded);
  }, []);

  useEffect(() => {
    if (clickPulse === 0) {
      return;
    }

    setClickPoint(getClickPoint(coordsRef.current));
  }, [clickPulse]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      containerWidth.value = width;
      containerHeight.value = height;

      const centerX = (width - TARGET_SIZE) / 2;
      const centerY = (height - TARGET_SIZE) / 2;

      void (async () => {
        const saved = await loadTargetPosition();
        const position = clampTargetPosition(
          saved ?? { x: centerX, y: centerY },
          width,
          height,
          TARGET_SIZE,
        );
        applyPosition(position.x, position.y);
        setReady(true);
      })();
    },
    [applyPosition, containerHeight, containerWidth],
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      const maxX = containerWidth.value - TARGET_SIZE;
      const maxY = containerHeight.value - TARGET_SIZE;
      const newX = Math.max(0, Math.min(offsetX.value + event.translationX, maxX));
      const newY = Math.max(0, Math.min(offsetY.value + event.translationY, maxY));
      translateX.value = newX;
      translateY.value = newY;
      runOnJS(updateCoords)(newX, newY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.coordsBar}>
        <Text style={styles.coordsText}>
          X: {coords.x}  Y: {coords.y}
        </Text>
      </View>
      {ready && (
        <>
          <View style={styles.rippleOverlay} pointerEvents="none">
            <ClickRipple pulse={clickPulse} x={clickPoint.x} y={clickPoint.y} />
          </View>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.target, animatedStyle]} />
          </GestureDetector>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  coordsBar: {
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  rippleOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  target: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: 'red',
  },
});
