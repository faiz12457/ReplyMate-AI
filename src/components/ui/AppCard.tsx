import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { usePressScale } from '@/hooks/use-press-scale';
import { useTheme } from '@/hooks/use-theme';

export type AppCardVariant = 'elevated' | 'tinted' | 'navy' | 'outlined';
export type AppCardPadding = 'sm' | 'md' | 'lg';

export interface AppCardProps {
  children: ReactNode;
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const PADDING_MAP: Record<AppCardPadding, number> = {
  sm: Spacing.sm,
  md: Spacing.md,
  lg: Spacing.lg,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Rounded surface card supporting static display and animated press interactions.
 */
export function AppCard({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  accessibilityLabel,
  style,
}: AppCardProps) {
  const theme = useTheme();
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.985, !onPress);

  const variantStyleMap: Record<AppCardVariant, ViewStyle> = {
    elevated: {
      backgroundColor: theme.surfaceElevated,
      borderColor: theme.border,
      borderWidth: 1,
      ...Shadows.card,
    },
    tinted: {
      backgroundColor: theme.surfaceTinted,
      borderColor: theme.borderTinted,
      borderWidth: 1,
    },
    navy: {
      backgroundColor: theme.heroBackground,
      borderColor: theme.heroBorder,
      borderWidth: 1,
      ...Shadows.elevated,
    },
    outlined: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
    },
  };

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    { padding: PADDING_MAP[padding] },
    variantStyleMap[variant],
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, cardStyle]}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
});
