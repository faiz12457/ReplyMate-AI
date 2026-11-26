import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReplySuggestionCard } from '@/components/chat/ReplySuggestionCard';
import { AppButton, AppCard, AppIcon, IconBadge, PillBadge } from '@/components/ui';
import { MaxContentWidth, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { generateReplies, getApiBaseUrl } from '@/services/replyApi';
import {
  DEFAULT_USER_PREFERENCES,
  type ReplyLanguage,
  type ReplyOption,
  type ReplyStyle,
  type UserPreferences,
} from '@/types/replymate';
import { loadUserPreferences } from '@/utils/storage';

const LANGUAGE_LABELS: Record<ReplyLanguage, string> = {
  mixed: 'Mixed',
  roman_urdu: 'Roman Urdu',
  english: 'English',
  urdu: 'Urdu',
};

export default function SuggestionsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    conversation?: string;
    latestMessage?: string;
    sender?: string;
    messageCount?: string;
  }>();

  const conversation = params.conversation ?? '';
  const latestMessage = params.latestMessage ?? '';
  const sender = params.sender || 'Contact';
  const messageCount = params.messageCount ?? '1';

  const hasRequiredContext = Boolean(conversation.trim() && latestMessage.trim());

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ReplyStyle | null>(null);
  const [copiedStyle, setCopiedStyle] = useState<ReplyStyle | null>(null);
  const [regeneratingStyle, setRegeneratingStyle] = useState<ReplyStyle | null>(null);
  const [loading, setLoading] = useState(hasRequiredContext);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasRequiredContext
      ? null
      : 'Conversation context is missing. Please go back and paste a chat first.'
  );
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasRequiredContext) {
      return;
    }

    let isCancelled = false;

    loadUserPreferences()
      .then((prefs) => {
        if (!isCancelled) {
          setPreferences(prefs);
        }
        return generateReplies({
          conversation,
          latestMessage,
          style: prefs.preferredStyles,
          language: prefs.language,
          conciseMode: prefs.conciseMode,
          avoidEmojis: prefs.avoidEmojis,
        });
      })
      .then((result) => {
        if (!isCancelled) {
          setReplies(result);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : 'Unable to generate replies right now.';
          setErrorMessage(message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [conversation, hasRequiredContext, latestMessage, requestKey]);

  const handleRefreshAll = () => {
    if (!hasRequiredContext) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setInlineError(null);
    setSelectedStyle(null);
    setCopiedStyle(null);
    setRequestKey((prev) => prev + 1);
  };

  const handleCopyReply = async (reply: ReplyOption) => {
    try {
      await Clipboard.setStringAsync(reply.text);
      setSelectedStyle(reply.style);
      setCopiedStyle(reply.style);
      setInlineError(null);

      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current);
      }
      copyResetTimer.current = setTimeout(() => {
        setCopiedStyle(null);
      }, 2400);
    } catch {
      setInlineError('Could not copy text to clipboard. You can select and copy it manually.');
    }
  };

  const handleRegenerateSingle = async (targetReply: ReplyOption) => {
    if (!hasRequiredContext || regeneratingStyle) {
      return;
    }

    setRegeneratingStyle(targetReply.style);
    setInlineError(null);

    try {
      const freshPrefs = await loadUserPreferences();
      setPreferences(freshPrefs);

      const refreshed = await generateReplies({
        conversation,
        latestMessage,
        style: [targetReply.style],
        language: freshPrefs.language,
        previousReply: targetReply.text,
        conciseMode: freshPrefs.conciseMode,
        avoidEmojis: freshPrefs.avoidEmojis,
      });

      const replacement = refreshed[0];
      if (replacement) {
        setReplies((prev) =>
          prev.map((item) => (item.style === targetReply.style ? replacement : item))
        );
        if (copiedStyle === targetReply.style) {
          setCopiedStyle(null);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Could not regenerate the ${targetReply.style} reply.`;
      setInlineError(message);
    } finally {
      setRegeneratingStyle(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Context Header Card */}
          <AppCard variant="navy" padding="md">
            <View style={styles.contextBody}>
              <View style={styles.contextTopRow}>
                <PillBadge label={`Replying to ${sender}`} variant="onDark" icon="person" />
                <PillBadge
                  label={`${messageCount} msg${messageCount === '1' ? '' : 's'}`}
                  variant="onDark"
                />
                <PillBadge
                  label={LANGUAGE_LABELS[preferences.language]}
                  variant="onDark"
                  icon="language"
                />
              </View>
              <Text style={[Typography.caption, { color: theme.textOnDarkMuted }]}>
                Latest incoming message
              </Text>
              <View style={[styles.quoteBox, { backgroundColor: theme.heroSurface }]}>
                <Text style={[Typography.bodyMedium, { color: Palette.white }]} numberOfLines={3}>
                  “{latestMessage}”
                </Text>
              </View>
            </View>
          </AppCard>

          {/* Copied Confirmation Banner */}
          {copiedStyle ? (
            <Animated.View entering={FadeInDown.duration(220)}>
              <AppCard
                variant="outlined"
                padding="sm"
                style={{ backgroundColor: theme.successSoft, borderColor: theme.success }}>
                <View style={styles.bannerRow}>
                  <AppIcon name="check" size={18} color={theme.success} />
                  <Text style={[Typography.bodySmall, styles.bannerText, { color: theme.success }]}>
                    Copied {copiedStyle} reply to clipboard — ready to paste in WhatsApp.
                  </Text>
                </View>
              </AppCard>
            </Animated.View>
          ) : null}

          {/* Non-destructive Inline Error Banner (e.g. single-card regenerate failure) */}
          {inlineError ? (
            <AppCard
              variant="outlined"
              padding="sm"
              style={{ backgroundColor: theme.dangerSoft, borderColor: theme.danger }}>
              <View style={styles.bannerRow}>
                <AppIcon name="warning" size={18} color={theme.danger} />
                <Text style={[Typography.bodySmall, styles.bannerText, { color: theme.danger }]}>
                  {inlineError}
                </Text>
              </View>
            </AppCard>
          ) : null}

          {/* Initial Loading State */}
          {loading ? (
            <AppCard variant="elevated" padding="lg">
              <View style={styles.statusBox}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[Typography.cardTitle, styles.centeredText, { color: theme.text }]}>
                  Crafting context-aware replies...
                </Text>
                <Text
                  style={[
                    Typography.bodySmall,
                    styles.centeredText,
                    { color: theme.textSecondary },
                  ]}>
                  Reading tone, topic, and your latest message in {LANGUAGE_LABELS[preferences.language]}.
                </Text>
              </View>
            </AppCard>
          ) : null}

          {/* Initial Fetch Error State */}
          {!loading && errorMessage ? (
            <AppCard
              variant="outlined"
              padding="lg"
              style={{ backgroundColor: theme.dangerSoft, borderColor: theme.danger }}>
              <View style={styles.statusBox}>
                <IconBadge
                  icon="warning"
                  backgroundColor={theme.background}
                  iconColor={theme.danger}
                  size="md"
                />
                <Text style={[Typography.cardTitle, styles.centeredText, { color: theme.danger }]}>
                  Could not generate replies
                </Text>
                <Text
                  style={[
                    Typography.bodySmall,
                    styles.centeredText,
                    { color: theme.textSecondary },
                  ]}>
                  {errorMessage}
                </Text>
                <Text style={[Typography.caption, styles.centeredText, { color: theme.textMuted }]}>
                  Backend URL: {getApiBaseUrl()}
                </Text>
                <AppButton
                  label="Try Again"
                  variant="primary"
                  leftIcon="refresh"
                  onPress={handleRefreshAll}
                  style={styles.retryButton}
                />
              </View>
            </AppCard>
          ) : null}

          {/* Reply Cards */}
          {!loading && !errorMessage && replies.length > 0 ? (
            <View style={styles.repliesList}>
              <View style={styles.repliesHeader}>
                <Text style={[Typography.cardTitle, { color: theme.text }]}>
                  Suggested Replies ({replies.length})
                </Text>
                <Text style={[Typography.caption, { color: theme.textMuted }]}>
                  Tap Copy or Regenerate
                </Text>
              </View>

              {replies.map((reply, index) => (
                <Animated.View
                  key={`${reply.style}-${index}`}
                  entering={FadeInDown.delay(index * 70).duration(300)}>
                  <ReplySuggestionCard
                    reply={reply}
                    selected={selectedStyle === reply.style}
                    copied={copiedStyle === reply.style}
                    regenerating={regeneratingStyle === reply.style}
                    onSelect={() => setSelectedStyle(reply.style)}
                    onCopy={() => handleCopyReply(reply)}
                    onRegenerate={() => handleRegenerateSingle(reply)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : null}

          {/* Bottom Actions */}
          <View style={styles.actions}>
            {!loading && replies.length > 0 ? (
              <AppButton
                label="Regenerate All Replies"
                variant="secondary"
                leftIcon="sparkles"
                disabled={Boolean(regeneratingStyle)}
                fullWidth
                onPress={handleRefreshAll}
              />
            ) : null}
            <View style={styles.secondaryActionsRow}>
              <AppButton
                label="Edit Chat"
                variant="outline"
                leftIcon="edit"
                onPress={() => router.back()}
                style={styles.halfButton}
              />
              <AppButton
                label="Preferences"
                variant="outline"
                leftIcon="tune"
                onPress={() => router.push('/settings')}
                style={styles.halfButton}
              />
            </View>
          </View>
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.md,
  },
  contextBody: {
    gap: Spacing.xs,
  },
  contextTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  quoteBox: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bannerText: {
    flex: 1,
    fontWeight: '500',
  },
  statusBox: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  centeredText: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xs,
    minWidth: 160,
  },
  repliesList: {
    gap: Spacing.sm,
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  halfButton: {
    flex: 1,
  },
});
