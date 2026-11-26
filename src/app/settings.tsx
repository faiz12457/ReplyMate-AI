import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppCard, AppIcon, IconBadge, PillBadge, type AppIconName } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  DEFAULT_USER_PREFERENCES,
  type ReplyLanguage,
  type ReplyStyle,
  type UserPreferences,
} from '@/types/replymate';
import {
  clearAllLocalConversations,
  loadRecentConversations,
  loadUserPreferences,
  saveUserPreferences,
} from '@/utils/storage';

const STYLE_OPTIONS: {
  id: ReplyStyle;
  label: string;
  description: string;
  icon: AppIconName;
}[] = [
  {
    id: 'natural',
    label: 'Natural',
    description: 'Effortless everyday texting tone',
    icon: 'natural',
  },
  {
    id: 'funny',
    label: 'Funny',
    description: 'Light, playful humor when appropriate',
    icon: 'funny',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, engaging, and approachable',
    icon: 'friendly',
  },
];

const LANGUAGE_OPTIONS: {
  id: ReplyLanguage;
  label: string;
  example: string;
}[] = [
  {
    id: 'mixed',
    label: 'Natural Mixed (Urdu + Roman Urdu + English)',
    example: 'e.g. "Haan scene on hai, let’s meet at 7!"',
  },
  {
    id: 'roman_urdu',
    label: 'Roman Urdu',
    example: 'e.g. "Acha theek hai, main thori dair mein batata hun"',
  },
  {
    id: 'english',
    label: 'English',
    example: 'e.g. "Sounds good, let me know when you leave!"',
  },
  {
    id: 'urdu',
    label: 'Urdu (اردو)',
    example: 'e.g. "ٹھیک ہے، میں تھوڑی دیر میں بتاتا ہوں"',
  },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [historyCount, setHistoryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      Promise.all([loadUserPreferences(), loadRecentConversations()]).then(([prefs, history]) => {
        if (!isActive) return;
        setPreferences(prefs);
        setHistoryCount(history.length);
      });

      return () => {
        isActive = false;
      };
    }, [])
  );

  const persistPreferences = async (next: UserPreferences, feedback: string) => {
    setPreferences(next);
    setStatusMessage(feedback);
    await saveUserPreferences(next);
  };

  const toggleStyle = (styleId: ReplyStyle) => {
    const isSelected = preferences.preferredStyles.includes(styleId);
    if (isSelected && preferences.preferredStyles.length === 1) {
      setStatusMessage('Keep at least one reply style selected.');
      return;
    }

    const updatedStyles = isSelected
      ? preferences.preferredStyles.filter((item) => item !== styleId)
      : [...preferences.preferredStyles, styleId];

    // Preserve canonical order: natural, funny, friendly.
    const orderedStyles = STYLE_OPTIONS.map((opt) => opt.id).filter((id) =>
      updatedStyles.includes(id)
    );

    persistPreferences(
      { ...preferences, preferredStyles: orderedStyles },
      'Reply styles updated.'
    );
  };

  const selectLanguage = (language: ReplyLanguage) => {
    persistPreferences({ ...preferences, language }, 'Language preference saved.');
  };

  const performClearHistory = async () => {
    await clearAllLocalConversations();
    setHistoryCount(0);
    setStatusMessage('Cleared all local conversation history and drafts.');
  };

  const handleClearHistoryPress = () => {
    if (Platform.OS === 'web') {
      performClearHistory();
      return;
    }

    Alert.alert(
      'Clear Local History?',
      'This removes all saved recent conversations and drafts stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: performClearHistory },
      ]
    );
  };

  const handleResetDefaults = () => {
    persistPreferences(DEFAULT_USER_PREFERENCES, 'Preferences reset to defaults.');
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Status Toast */}
          {statusMessage ? (
            <AppCard variant="tinted" padding="sm">
              <View style={styles.statusRow}>
                <AppIcon name="check" size={16} color={theme.accent} />
                <Text style={[Typography.caption, { color: theme.accent, fontWeight: '600' }]}>
                  {statusMessage}
                </Text>
              </View>
            </AppCard>
          ) : null}

          {/* Preferred Reply Styles */}
          <AppCard variant="elevated" padding="md">
            <View style={styles.sectionHeader}>
              <IconBadge
                icon="sparkles"
                backgroundColor={theme.surfaceTinted}
                iconColor={theme.accent}
                size="sm"
              />
              <View style={styles.sectionHeaderText}>
                <Text style={[Typography.cardTitle, { color: theme.text }]}>
                  Preferred Reply Styles
                </Text>
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  Choose which reply styles to generate (at least 1)
                </Text>
              </View>
            </View>

            <View style={styles.optionsList}>
              {STYLE_OPTIONS.map((option) => {
                const active = preferences.preferredStyles.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    onPress={() => toggleStyle(option.id)}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: active ? theme.surfaceTinted : theme.surface,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}>
                    <AppIcon
                      name={option.icon}
                      size={18}
                      color={active ? theme.accent : theme.textMuted}
                    />
                    <View style={styles.optionText}>
                      <Text style={[Typography.bodyMedium, { color: theme.text }]}>
                        {option.label}
                      </Text>
                      <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                        {option.description}
                      </Text>
                    </View>
                    <PillBadge
                      label={active ? 'Active' : 'Off'}
                      variant={active ? 'navy' : 'neutral'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* Language Preference */}
          <AppCard variant="elevated" padding="md">
            <View style={styles.sectionHeader}>
              <IconBadge
                icon="language"
                backgroundColor={theme.infoSoft}
                iconColor={theme.info}
                size="sm"
              />
              <View style={styles.sectionHeaderText}>
                <Text style={[Typography.cardTitle, { color: theme.text }]}>
                  Language Preference
                </Text>
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  Select how ReplyMate AI should write your replies
                </Text>
              </View>
            </View>

            <View style={styles.optionsList}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = preferences.language === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => selectLanguage(option.id)}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: selected ? theme.surfaceTinted : theme.surface,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}>
                    <View style={styles.optionText}>
                      <Text style={[Typography.bodyMedium, { color: theme.text }]}>
                        {option.label}
                      </Text>
                      <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                        {option.example}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: selected ? theme.accent : theme.textMuted },
                      ]}>
                      {selected ? (
                        <View style={[styles.radioInner, { backgroundColor: theme.accent }]} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* AI Response Preferences */}
          <AppCard variant="elevated" padding="md">
            <View style={styles.sectionHeader}>
              <IconBadge
                icon="tune"
                backgroundColor={theme.surfaceTinted}
                iconColor={theme.primary}
                size="sm"
              />
              <View style={styles.sectionHeaderText}>
                <Text style={[Typography.cardTitle, { color: theme.text }]}>
                  AI Response Preferences
                </Text>
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  Fine-tune texting length and emoji usage
                </Text>
              </View>
            </View>

            <View style={styles.switchesList}>
              <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                <View style={styles.optionText}>
                  <Text style={[Typography.bodyMedium, { color: theme.text }]}>
                    Extra Concise Replies
                  </Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                    Prefer 1 short punchy sentence instead of longer replies
                  </Text>
                </View>
                <Switch
                  value={preferences.conciseMode}
                  onValueChange={(value) =>
                    persistPreferences(
                      { ...preferences, conciseMode: value },
                      'Response length preference updated.'
                    )
                  }
                  trackColor={{ false: theme.border, true: theme.accent }}
                />
              </View>

              <View style={styles.switchRowNoBorder}>
                <View style={styles.optionText}>
                  <Text style={[Typography.bodyMedium, { color: theme.text }]}>
                    Avoid Emojis
                  </Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                    Keep all suggested replies completely emoji-free
                  </Text>
                </View>
                <Switch
                  value={preferences.avoidEmojis}
                  onValueChange={(value) =>
                    persistPreferences(
                      { ...preferences, avoidEmojis: value },
                      'Emoji preference updated.'
                    )
                  }
                  trackColor={{ false: theme.border, true: theme.accent }}
                />
              </View>
            </View>
          </AppCard>

          {/* Local Data & Privacy */}
          <AppCard variant="outlined" padding="md">
            <View style={styles.sectionHeader}>
              <IconBadge
                icon="shield"
                backgroundColor={theme.backgroundElement}
                iconColor={theme.textSecondary}
                size="sm"
              />
              <View style={styles.sectionHeaderText}>
                <Text style={[Typography.cardTitle, { color: theme.text }]}>
                  Local Storage & History
                </Text>
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  {historyCount === 0
                    ? 'No saved conversations stored on this device.'
                    : `${historyCount} recent conversation${historyCount === 1 ? '' : 's'} stored locally.`}
                </Text>
              </View>
            </View>

            <View style={styles.dataActions}>
              <AppButton
                label="Clear Local Conversation History"
                variant="outline"
                leftIcon="deleteSweep"
                fullWidth
                onPress={handleClearHistoryPress}
              />
              <AppButton
                label="Reset Preferences to Default"
                variant="ghost"
                fullWidth
                onPress={handleResetDefaults}
              />
            </View>
          </AppCard>

          <AppButton
            label="Done"
            variant="primary"
            fullWidth
            onPress={() => router.back()}
          />
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  optionsList: {
    gap: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  switchesList: {
    gap: Spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  switchRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xxs,
  },
  dataActions: {
    gap: Spacing.xs,
  },
});
