import { Platform } from 'react-native';

/**
 * ReplyMate AI Design System
 * Clean white surfaces paired with deep navy and royal blue accents.
 */

export const Palette = {
  navy950: '#07132E',
  navy900: '#0A1D42',
  navy800: '#0F295C',
  navy700: '#173A7D',
  blue600: '#1D5CE0',
  blue500: '#2563EB',
  blue400: '#3B82F6',
  blue100: '#DBEAFE',
  blue50: '#EFF6FF',
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  emerald600: '#059669',
  emerald50: '#ECFDF5',
  amber600: '#D97706',
  amber50: '#FFFBEB',
  indigo600: '#4F46E5',
  indigo50: '#EEF2FF',
  red600: '#DC2626',
  red50: '#FEF2F2',
} as const;

export const Colors = {
  light: {
    background: Palette.white,
    surface: '#F7F9FC',
    surfaceElevated: Palette.white,
    surfaceTinted: Palette.blue50,
    backgroundElement: '#F0F4FA',
    backgroundSelected: Palette.blue100,
    text: Palette.navy950,
    textSecondary: Palette.slate600,
    textMuted: Palette.slate500,
    textOnDark: Palette.white,
    textOnDarkMuted: '#CBD5E1',
    primary: Palette.navy900,
    primaryPressed: Palette.navy800,
    accent: Palette.blue500,
    accentPressed: Palette.blue600,
    accentSoft: Palette.blue100,
    border: Palette.slate200,
    borderTinted: '#BFDBFE',
    heroBackground: Palette.navy900,
    heroBorder: '#1E3A73',
    heroSurface: '#132D61',
    success: Palette.emerald600,
    successSoft: Palette.emerald50,
    warning: Palette.amber600,
    warningSoft: Palette.amber50,
    info: Palette.indigo600,
    infoSoft: Palette.indigo50,
    danger: Palette.red600,
    dangerSoft: Palette.red50,
  },
  dark: {
    background: '#060F21',
    surface: '#0B1730',
    surfaceElevated: '#102040',
    surfaceTinted: '#132852',
    backgroundElement: '#132445',
    backgroundSelected: '#1D396B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textOnDark: Palette.white,
    textOnDarkMuted: '#CBD5E1',
    primary: Palette.blue500,
    primaryPressed: Palette.blue600,
    accent: '#60A5FA',
    accentPressed: '#3B82F6',
    accentSoft: '#193463',
    border: '#1D3157',
    borderTinted: '#294A82',
    heroBackground: '#0C1F45',
    heroBorder: '#244582',
    heroSurface: '#153166',
    success: '#34D399',
    successSoft: '#064E3B',
    warning: '#FBBF24',
    warningSoft: '#451A03',
    info: '#818CF8',
    infoSoft: '#1E1B4B',
    danger: '#F87171',
    dangerSoft: '#450A0A',
  },
} as const;

export type ThemeColors = (typeof Colors)[keyof typeof Colors];
export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    rounded: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const Typography = {
  hero: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0A1D42',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: {
      elevation: 3,
    },
    default: {
      boxShadow: '0px 6px 18px rgba(10, 29, 66, 0.06)',
    },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#0A1D42',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
    },
    android: {
      elevation: 6,
    },
    default: {
      boxShadow: '0px 12px 28px rgba(10, 29, 66, 0.14)',
    },
  }),
} as const;

export const MaxContentWidth = 640;
