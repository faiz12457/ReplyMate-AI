import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppButton,
  AppCard,
  AppIcon,
  IconBadge,
  PillBadge,
  type AppIconName,
} from '@/components/ui';
import { MaxContentWidth, Palette, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HighlightItem {
  id: string;
  icon: AppIconName;
  title: string;
  description: string;
}

const HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'context',
    icon: 'sparkles',
    title: 'Reads tone & conversation history',
    description: 'Understands previous messages, relationship vibe, and what was just asked.',
  },
  {
    id: 'styles',
    icon: 'chat',
    title: 'Natural, Funny & Friendly options',
    description: 'Pick from 3 tailored replies with a short reason explaining why each fits.',
  },
  {
    id: 'languages',
    icon: 'translate',
    title: 'Urdu, Roman Urdu & English',
    description: 'Sounds like a real person texting — concise, warm, and never robotic.',
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Subtle decorative background accents */}
      <View
        pointerEvents="none"
        style={[styles.topGlow, { backgroundColor: theme.surfaceTinted }]}
      />
      <View
        pointerEvents="none"
        style={[styles.sideGlow, { backgroundColor: theme.accentSoft }]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Brand Header */}
          <Animated.View entering={FadeInUp.duration(450)} style={styles.brandSection}>
            <View
              style={[
                styles.logoEmblem,
                {
                  backgroundColor: theme.heroBackground,
                  borderColor: theme.heroBorder,
                },
                Shadows.elevated,
              ]}>
              <AppIcon name="chat" size={32} color={Palette.white} />
              <View style={[styles.logoSparkle, { backgroundColor: theme.accent }]}>
                <AppIcon name="sparkles" size={14} color={Palette.white} />
              </View>
            </View>

            <PillBadge label="AI WhatsApp Reply Assistant" variant="softBlue" icon="sparkles" />

            <Text style={[Typography.hero, styles.appName, { color: theme.text }]}>
              ReplyMate AI
            </Text>

            <Text style={[Typography.subtitle, styles.tagline, { color: theme.accent }]}>
              Never get stuck on what to reply.
            </Text>

            <Text style={[Typography.body, styles.description, { color: theme.textSecondary }]}>
              Paste a WhatsApp conversation or import an exported chat file to get smart,
              human-sounding replies in seconds.
            </Text>
          </Animated.View>

          {/* Feature Highlights */}
          <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.highlights}>
            {HIGHLIGHTS.map((item) => (
              <AppCard key={item.id} variant="elevated" padding="md">
                <View style={styles.highlightRow}>
                  <IconBadge
                    icon={item.icon}
                    backgroundColor={theme.surfaceTinted}
                    iconColor={theme.accent}
                    size="md"
                  />
                  <View style={styles.highlightText}>
                    <Text style={[Typography.cardTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[Typography.bodySmall, { color: theme.textSecondary }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </AppCard>
            ))}
          </Animated.View>

          {/* Privacy Assurance */}
          <Animated.View entering={FadeInDown.delay(220).duration(450)}>
            <AppCard variant="tinted" padding="sm">
              <View style={styles.privacyRow}>
                <AppIcon name="shield" size={18} color={theme.accent} />
                <Text style={[Typography.bodySmall, styles.privacyText, { color: theme.textSecondary }]}>
                  Manual paste or `.txt` chat import only. ReplyMate AI never monitors WhatsApp
                  automatically.
                </Text>
              </View>
            </AppCard>
          </Animated.View>

          {/* Primary Action */}
          <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.ctaContainer}>
            <AppButton
              label="Get Started"
              variant="primary"
              size="lg"
              rightIcon="arrowForward"
              fullWidth
              onPress={() => router.replace('/home')}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: -120,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: Radius.full,
    opacity: 0.7,
  },
  sideGlow: {
    position: 'absolute',
    top: 120,
    left: -90,
    width: 180,
    height: 180,
    borderRadius: Radius.full,
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoEmblem: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  logoSparkle: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.white,
  },
  appName: {
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },
  tagline: {
    textAlign: 'center',
    fontSize: 19,
    lineHeight: 25,
  },
  description: {
    textAlign: 'center',
    maxWidth: 420,
  },
  highlights: {
    gap: Spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  highlightText: {
    flex: 1,
    gap: Spacing.xxs,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  privacyText: {
    flex: 1,
  },
  ctaContainer: {
    paddingTop: Spacing.xxs,
  },
});
