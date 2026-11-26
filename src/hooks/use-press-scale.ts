import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 18, stiffness: 320 };

/**
 * Shared Reanimated press-scale hook compatible with React Compiler immutability checks.
 */
export function usePressScale(pressedScale = 0.97, disabled = false) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.set(withSpring(pressedScale, SPRING_CONFIG));
    }
  };

  const handlePressOut = () => {
    scale.set(withSpring(1, SPRING_CONFIG));
  };

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}
