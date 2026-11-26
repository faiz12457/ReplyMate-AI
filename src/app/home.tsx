import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppCard, AppIcon, IconBadge, PillBadge } from '@/components/ui';
import { MaxContentWidth, Palette, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type {
  ConversationDraft,
  ConversationHistoryItem,
  InputMode,
  ReplyLanguage,
} from '@/types/replymate';
import {
  clearRecentConversations,
  loadConversationDraft,
  loadRecentConversations,
  loadUserPreferences,
} from '@/utils/storage';

const HOME_LANGUAGE_BADGE: Record<ReplyLanguage, string> = {
  mixed: 'Mixed • EN • Urdu',
  roman_urdu: 'Roman Urdu',
  english: 'English',
  urdu: 'Urdu (اردو)',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Recent';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function HomeScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompactWidth = width < 380;

  const [recentConversations, setRecentConversations] = useState<ConversationHistoryItem[]>([]);
  const [activeDraft, setActiveDraft] = useState<ConversationDraft | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<ReplyLanguage>('mixed');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      Promise.all([
        loadRecentConversations(),
        loadConversationDraft(),
        loadUserPreferences(),
      ]).then(([history, draft, prefs]) => {
        if (!isActive) return;
        setRecentConversations(history);
        setActiveDraft(draft && draft.rawText.trim().length > 0 ? draft : null);
        setActiveLanguage(prefs.language);
      });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const openInput = (mode: InputMode) => {
    router.push({ pathname: '/input', params: { mode } });
  };

  const openHistoryItem = (item: ConversationHistoryItem) => {
    router.push({
      pathname: '/input',
      params: {
        mode: 'paste',
        prefillText: item.rawText ?? item.latestMessage ?? item.latestMessagePreview,
        prefillLatest: item.latestMessage ?? item.latestMessagePreview,
      },
    });
  };

  const handleClearHistory = async () => {
    await clearRecentConversations();
    setRecentConversations([]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Top Greeting & Settings Bar */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[Typography.bodySmall, styles.greeting, { color: theme.accent }]}>
                {getGreeting()}
              </Text>
              <Text style={[Typography.title, { color: theme.text }]}>ReplyMate AI</Text>
              <Text style={[Typography.body, { color: theme.textSecondary }]}>
                Craft natural replies tailored to your chat.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.settingsButton,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  opacity: pressed ? 0.75 : 1,
                },
                Shadows.card,
              ]}>
              <AppIcon name="settings" size={22} color={theme.primary} />
            </Pressable>
          </View>

          {/* Main Hero Card: Generate a Reply */}
          <Animated.View entering={FadeInDown.duration(380)}>
            <AppCard variant="navy" padding="lg">
              <View style={styles.heroGlow} pointerEvents="none" />

              <View style={styles.heroContent}>
                <View style={styles.heroTopRow}>
                  <PillBadge label="AI Reply Engine" variant="onDark" icon="sparkles" />
                  <PillBadge label={HOME_LANGUAGE_BADGE[activeLanguage]} variant="onDark" />
                </View>

                <Text style={[Typography.title, { color: Palette.white }]}>
                  Generate a Reply
                </Text>

                <Text style={[Typography.body, { color: theme.textOnDarkMuted }]}>
                  Share a WhatsApp conversation and receive three thoughtful options you can copy
                  with one tap.
                </Text>

                <View style={styles.styleChipsRow}>
                  <PillBadge label="Natural" variant="onDark" icon="natural" />
                  <PillBadge label="Funny" variant="onDark" icon="funny" />
                  <PillBadge label="Friendly" variant="onDark" icon="friendly" />
                </View>

                <AppButton
                  label="Start New Reply"
                  variant="onDark"
                  size="lg"
                  rightIcon="arrowForward"
                  fullWidth
                  onPress={() => openInput('paste')}
                  style={styles.heroButton}
                />
              </View>
            </AppCard>
          </Animated.View>

          {/* Active Draft Banner (if any) */}
          {activeDraft ? (
            <Animated.View entering={FadeInDown.delay(60).duration(320)}>
              <AppCard
                variant="tinted"
                padding="md"
                onPress={() => router.push({ pathname: '/input', params: { resumeDraft: '1' } })}
                accessibilityLabel="Resume saved conversation draft">
                <View style={styles.draftRow}>
                  <IconBadge
                    icon="edit"
                    backgroundColor={theme.background}
                    iconColor={theme.accent}
                    size="sm"
                  />
                  <View style={styles.draftBody}>
                    <Text style={[Typography.bodyMedium, { color: theme.text }]}>
                      Resume draft • {activeDraft.contactLabel}
                    </Text>
                    <Text
                      style={[Typography.caption, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {activeDraft.latestMessage || activeDraft.rawText}
                    </Text>
                  </View>
                  <AppIcon name="chevronRight" size={18} color={theme.accent} />
                </View>
              </AppCard>
            </Animated.View>
          ) : null}

          {/* Quick Input Methods */}
          <Animated.View entering={FadeInDown.delay(100).duration(380)} style={styles.section}>
            <Text style={[Typography.cardTitle, { color: theme.text }]}>
              Choose an input method
            </Text>

            <View style={[styles.actionsRow, isCompactWidth && styles.actionsColumn]}>
              <AppCard
                variant="elevated"
                padding="md"
                onPress={() => openInput('paste')}
                accessibilityLabel="Paste Conversation"
                style={styles.actionCard}>
                <View style={styles.actionCardInner}>
                  <View style={styles.actionCardHeader}>
                    <IconBadge
                      icon="paste"
                      backgroundColor={theme.surfaceTinted}
                      iconColor={theme.accent}
                      size="md"
                    />
                    <AppIcon name="chevronRight" size={18} color={theme.textMuted} />
                  </View>
                  <Text style={[Typography.cardTitle, { color: theme.text }]}>
                    Paste Conversation
                  </Text>
                  <Text style={[Typography.bodySmall, { color: theme.textSecondary }]}>
                    Copy messages from WhatsApp and paste them directly.
                  </Text>
                </View>
              </AppCard>

              <AppCard
                variant="elevated"
                padding="md"
                onPress={() => openInput('import')}
                accessibilityLabel="Import WhatsApp Chat"
                style={styles.actionCard}>
                <View style={styles.actionCardInner}>
                  <View style={styles.actionCardHeader}>
                    <IconBadge
                      icon="importFile"
                      backgroundColor={theme.infoSoft}
                      iconColor={theme.info}
                      size="md"
                    />
                    <AppIcon name="chevronRight" size={18} color={theme.textMuted} />
                  </View>
                  <Text style={[Typography.cardTitle, { color: theme.text }]}>
                    Import WhatsApp Chat
                  </Text>
                  <Text style={[Typography.bodySmall, { color: theme.textSecondary }]}>
                    Upload an exported `.txt` chat file for full context.
                  </Text>
                </View>
              </AppCard>
            </View>
          </Animated.View>

          {/* Recent Conversation History */}
          <Animated.View entering={FadeInDown.delay(180).duration(380)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.cardTitle, { color: theme.text }]}>
                Recent Conversations
              </Text>
              {recentConversations.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent conversations"
                  onPress={handleClearHistory}>
                  <Text style={[Typography.caption, { color: theme.accent, fontWeight: '600' }]}>
                    Clear all
                  </Text>
                </Pressable>
              ) : (
                <PillBadge label="On this device" variant="neutral" icon="history" />
              )}
            </View>

            {recentConversations.length === 0 ? (
              <AppCard variant="outlined" padding="lg">
                <View style={styles.emptyHistory}>
                  <IconBadge
                    icon="history"
                    backgroundColor={theme.backgroundElement}
                    iconColor={theme.textSecondary}
                    size="lg"
                  />
                  <Text style={[Typography.cardTitle, styles.centeredText, { color: theme.text }]}>
                    No recent conversations yet
                  </Text>
                  <Text
                    style={[
                      Typography.bodySmall,
                      styles.centeredText,
                      { color: theme.textSecondary },
                    ]}>
                    Paste a chat or import a WhatsApp export to analyze a conversation. Your saved
                    chats will appear here.
                  </Text>
                  <AppButton
                    label="Paste Your First Chat"
                    variant="secondary"
                    size="md"
                    leftIcon="paste"
                    onPress={() => openInput('paste')}
                    style={styles.emptyHistoryButton}
                  />
                </View>
              </AppCard>
            ) : (
              <View style={styles.historyList}>
                {recentConversations.map((item) => (
                  <AppCard
                    key={item.id}
                    variant="elevated"
                    padding="md"
                    onPress={() => openHistoryItem(item)}
                    accessibilityLabel={`Open recent chat with ${item.contactLabel}`}>
                    <View style={styles.historyRow}>
                      <IconBadge
                        icon="chat"
                        backgroundColor={theme.surfaceTinted}
                        iconColor={theme.accent}
                        size="sm"
                      />
                      <View style={styles.historyBody}>
                        <View style={styles.historyTopRow}>
                          <Text
                            style={[Typography.bodyMedium, { color: theme.text }]}
                            numberOfLines={1}>
                            {item.contactLabel}
                          </Text>
                          <Text style={[Typography.caption, { color: theme.textMuted }]}>
                            {formatRelativeDate(item.createdAt)}
                          </Text>
                        </View>
                        <Text
                          style={[Typography.bodySmall, { color: theme.textSecondary }]}
                          numberOfLines={2}>
                          {item.latestMessagePreview}
                        </Text>
                      </View>
                      <AppIcon name="chevronRight" size={18} color={theme.textMuted} />
                    </View>
                  </AppCard>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Privacy Transparency Note */}
          <Animated.View entering={FadeInDown.delay(240).duration(380)}>
            <AppCard variant="tinted" padding="md">
              <View style={styles.privacyRow}>
                <IconBadge
                  icon="shield"
                  backgroundColor={theme.background}
                  iconColor={theme.accent}
                  size="sm"
                />
                <View style={styles.privacyBody}>
                  <Text style={[Typography.bodyMedium, { color: theme.text }]}>
                    Private by design
                  </Text>
                  <Text style={[Typography.bodySmall, { color: theme.textSecondary }]}>
                    ReplyMate AI only reads conversations you manually paste or import when you tap
                    Analyze.
                  </Text>
                </View>
              </View>
            </AppCard>
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: Spacing.xxs,
  },
  greeting: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxs,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
  },
  heroContent: {
    gap: Spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  styleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  heroButton: {
    marginTop: Spacing.xs,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  draftBody: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  actionCard: {
    flex: 1,
  },
  actionCardInner: {
    gap: Spacing.xs,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxs,
  },
  emptyHistory: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  centeredText: {
    textAlign: 'center',
  },
  emptyHistoryButton: {
    marginTop: Spacing.xs,
  },
  historyList: {
    gap: Spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  privacyBody: {
    flex: 1,
    gap: 2,
  },
});
