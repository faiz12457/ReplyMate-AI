import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { AppIcon, type AppIconName } from './AppIcon';

export type IconBadgeSize = 'sm' | 'md' | 'lg';

export interface IconBadgeProps {
  icon: AppIconName;
  backgroundColor: string;
  iconColor: string;
  size?: IconBadgeSize;
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG: Record<IconBadgeSize, { container: number; icon: number; radius: number }> = {
  sm: { container: 36, icon: 18, radius: Radius.sm },
  md: { container: 44, icon: 22, radius: Radius.md },
  lg: { container: 56, icon: 28, radius: Radius.lg },
};

/**
 * Rounded icon container used across onboarding highlights, action cards, and headers.
 */
export function IconBadge({
  icon,
  backgroundColor,
  iconColor,
  size = 'md',
  style,
}: IconBadgeProps) {
  const dimensions = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.base,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.radius,
          backgroundColor,
        },
        style,
      ]}>
      <AppIcon name={icon} size={dimensions.icon} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
