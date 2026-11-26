import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Palette, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { usePressScale } from '@/hooks/use-press-scale';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type AppIconName } from './AppIcon';

export type AppButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'onDark';
export type AppButtonSize = 'md' | 'lg';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  leftIcon?: AppIconName;
  rightIcon?: AppIconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Reusable animated button with consistent ReplyMate AI styling across iOS, Android, and Web.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97, isDisabled);

  const variantMap: Record<
    AppButtonVariant,
    { bg: string; text: string; borderColor?: string; shadow?: boolean }
  > = {
    primary: { bg: theme.primary, text: Palette.white, shadow: true },
    accent: { bg: theme.accent, text: Palette.white, shadow: true },
    secondary: {
      bg: theme.surfaceTinted,
      text: theme.primary,
      borderColor: theme.borderTinted,
    },
    outline: {
      bg: theme.surfaceElevated,
      text: theme.text,
      borderColor: theme.border,
    },
    ghost: {
      bg: 'transparent',
      text: theme.accent,
    },
    onDark: {
      bg: Palette.white,
      text: Palette.navy900,
    },
  };

  const palette = variantMap[variant];
  const minHeight = size === 'lg' ? 54 : 46;
  const horizontalPadding = size === 'lg' ? Spacing.lg : Spacing.md;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.base,
        {
          minHeight,
          paddingHorizontal: horizontalPadding,
          backgroundColor: palette.bg,
          borderColor: palette.borderColor ?? 'transparent',
          borderWidth: palette.borderColor ? 1 : 0,
          opacity: isDisabled ? 0.55 : 1,
        },
        fullWidth && styles.fullWidth,
        palette.shadow ? Shadows.card : undefined,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <AppIcon name={leftIcon} size={18} color={palette.text} /> : null}
          <Text style={[Typography.button, { color: palette.text }]} numberOfLines={1}>
            {label}
          </Text>
          {rightIcon ? <AppIcon name={rightIcon} size={18} color={palette.text} /> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
});
