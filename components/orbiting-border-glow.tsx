import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';

const DOT_SIZE = 10;
const ORBIT_DURATION_MS = 1600;

type OrbitingBorderGlowProps = {
  active: boolean;
};

export function OrbitingBorderGlow({ active }: OrbitingBorderGlowProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    animation.current?.stop();
    progress.setValue(0);

    if (!active) {
      return;
    }

    animation.current = Animated.loop(
      Animated.timing(progress, {
        toValue: 4,
        duration: ORBIT_DURATION_MS,
        useNativeDriver: false,
      }),
    );
    animation.current.start();

    return () => animation.current?.stop();
  }, [active, progress]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  if (!active) {
    return null;
  }

  const maxX = Math.max(0, size.width - DOT_SIZE);
  const maxY = Math.max(0, size.height - DOT_SIZE);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={handleLayout}>
      {size.width > 0 && size.height > 0 ? (
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1, 2, 3, 4],
                    outputRange: [0, maxX, maxX, 0, 0],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1, 2, 3, 4],
                    outputRange: [0, 0, maxY, maxY, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 12,
  },
});
