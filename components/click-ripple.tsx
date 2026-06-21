import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const RIPPLE_DURATION_MS = 200;
const RIPPLE_SIZE = 96;

type ClickRippleProps = {
  pulse: number;
  x: number;
  y: number;
};

export function ClickRipple({ pulse, x, y }: ClickRippleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (pulse === 0) {
      return;
    }

    scale.value = 1;
    opacity.value = 0.35;
    scale.value = withTiming(1.3, {
      duration: RIPPLE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(0, {
      duration: RIPPLE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [opacity, pulse, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          left: x - RIPPLE_SIZE / 2,
          top: y - RIPPLE_SIZE / 2,
          width: RIPPLE_SIZE,
          height: RIPPLE_SIZE,
          borderRadius: RIPPLE_SIZE / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'transparent',
  },
});
