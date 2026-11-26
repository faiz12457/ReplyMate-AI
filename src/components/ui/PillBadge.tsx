import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type AppIconName } from './AppIcon';

export type PillBadgeVariant =
  | 'softBlue'
  | 'navy'
  | 'onDark'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral';

export interface PillBadgeProps {
  label: string;
  variant?: PillBadgeVariant;
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact pill tag for reply tones, status indicators, and feature badges.
 */
export function PillBadge({ label, variant = 'softBlue', icon, style }: PillBadgeProps) {
  const theme = useTheme();

  const variantColors: Record<PillBadgeVariant, { bg: string; text: string; border?: string }> = {
    softBlue: { bg: theme.surfaceTinted, text: theme.accent, border: theme.borderTinted },
    navy: { bg: theme.primary, text: theme.textOnDark },
    onDark: { bg: 'rgba(255, 255, 255, 0.14)', text: theme.textOnDark, border: 'rgba(255, 255, 255, 0.22)' },
    success: { bg: theme.successSoft, text: theme.success },
    warning: { bg: theme.warningSoft, text: theme.warning },
    info: { bg: theme.infoSoft, text: theme.info },
    neutral: { bg: theme.backgroundElement, text: theme.textSecondary },
  };

  const palette = variantColors[variant];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1 : 0,
        },
        style,
      ]}>
      {icon ? <AppIcon name={icon} size={13} color={palette.text} /> : null}
      <Text style={[Typography.caption, styles.label, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xxs + 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 2,
    borderRadius: Radius.full,
  },
  label: {
    fontWeight: '600',
  },
});
