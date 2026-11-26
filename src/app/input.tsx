import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParsedMessagesPreview } from '@/components/chat/ParsedMessagesPreview';
import { WhatsAppExportGuideCard } from '@/components/chat/WhatsAppExportGuideCard';
import { AppButton, AppCard, AppIcon, IconBadge, PillBadge } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InputMode, ParsedMessage } from '@/types/replymate';
import { pickWhatsAppTextFile } from '@/utils/chatFilePicker';
import {
  clearConversationDraft,
  loadConversationDraft,
  loadUserPreferences,
  saveConversationDraft,
  saveRecentConversation,
} from '@/utils/storage';
import { parseWhatsAppConversation } from '@/utils/whatsappParser';

const SAMPLE_WHATSAPP_CHAT = `[26/11/2026, 10:14 AM] Hamza: Bro kal ka kya scene hai?
[26/11/2026, 10:16 AM] Me: Abhi confirm nahi, sham ko bataunga
[26/11/2026, 10:42 AM] Hamza: Jaldi bata dena yaar, warna sab plan cancel kar denge 😅`;

export default function ConversationInputScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    mode?: string;
    prefillText?: string;
    prefillLatest?: string;
    resumeDraft?: string;
  }>();

  const initialMode: InputMode = params.mode === 'import' ? 'import' : 'paste';

  const [mode, setMode] = useState<InputMode>(initialMode);
  const [rawText, setRawText] = useState(params.prefillText ?? '');
  const [latestOverride, setLatestOverride] = useState<string | null>(
    params.prefillLatest ?? null
  );
  const [selectedSenderOverride, setSelectedSenderOverride] = useState<string | undefined>(
    undefined
  );
  const [importedFileName, setImportedFileName] = useState<string | undefined>(undefined);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(Boolean(params.prefillText));

  // Restore saved draft when opening directly or via "Resume Draft".
  useEffect(() => {
    if (hasLoadedDraft) return;
    let isMounted = true;

    loadConversationDraft().then((draft) => {
      if (!isMounted) return;
      if (draft && (params.resumeDraft === '1' || draft.rawText.trim().length > 0)) {
        setRawText(draft.rawText);
        if (draft.latestMessage && draft.latestMessage.trim().length > 0) {
          setLatestOverride(draft.latestMessage);
        }
        setSelectedSenderOverride(draft.latestSender);
        setImportedFileName(draft.importedFileName);
        setMode(draft.sourceMode);
      }
      setHasLoadedDraft(true);
    });

    return () => {
      isMounted = false;
    };
  }, [hasLoadedDraft, params.resumeDraft]);

  const parsed = useMemo(() => parseWhatsAppConversation(rawText), [rawText]);

  const effectiveLatestMessage =
    latestOverride !== null ? latestOverride : parsed.latestIncomingMessage;

  const effectiveLatestSender =
    latestOverride !== null ? selectedSenderOverride : parsed.latestIncomingSender;

  // Persist draft locally whenever text or latest message changes.
  useEffect(() => {
    if (!hasLoadedDraft) return;
    const trimmed = rawText.trim();
    if (!trimmed) {
      clearConversationDraft();
      return;
    }

    const firstOtherParticipant = parsed.participants.find(
      (name) => !['me', 'you', 'myself', 'i'].includes(name.toLowerCase())
    );

    const timer = setTimeout(() => {
      saveConversationDraft({
        id: 'active-draft',
        rawText,
        latestMessage: effectiveLatestMessage,
        latestSender: effectiveLatestSender,
        contactLabel: effectiveLatestSender ?? firstOtherParticipant ?? 'WhatsApp Chat',
        sourceMode: mode,
        importedFileName,
        updatedAt: new Date().toISOString(),
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    effectiveLatestMessage,
    effectiveLatestSender,
    hasLoadedDraft,
    importedFileName,
    mode,
    parsed.participants,
    rawText,
  ]);

  const handleConversationChange = (nextText: string) => {
    setRawText(nextText);
    setErrorBanner(null);
    // Reset manual override when the user pastes/replaces the whole chat.
    if (Math.abs(nextText.length - rawText.length) > 20 || nextText.trim() === '') {
      setLatestOverride(null);
      setSelectedSenderOverride(undefined);
    }
  };

  const handleImportFile = async () => {
    setIsPickingFile(true);
    setErrorBanner(null);
    try {
      const result = await pickWhatsAppTextFile();
      if (result.status === 'canceled') {
        return;
      }
      if (result.status === 'error') {
        setErrorBanner(result.message);
        return;
      }

      setMode('import');
      setImportedFileName(result.fileName);
      setRawText(result.content);
      setLatestOverride(null);
      setSelectedSenderOverride(undefined);
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleSelectParsedMessage = (message: ParsedMessage) => {
    setLatestOverride(message.text);
    setSelectedSenderOverride(message.sender);
    setErrorBanner(null);
  };

  const handleClearAll = async () => {
    setRawText('');
    setLatestOverride(null);
    setSelectedSenderOverride(undefined);
    setImportedFileName(undefined);
    setErrorBanner(null);
    await clearConversationDraft();
  };

  const handleLoadSample = () => {
    setMode('paste');
    setImportedFileName(undefined);
    setRawText(SAMPLE_WHATSAPP_CHAT);
    setLatestOverride(null);
    setSelectedSenderOverride(undefined);
    setErrorBanner(null);
  };

  const handleAnalyze = async () => {
    const trimmedConversation = rawText.trim();
    const trimmedLatest = effectiveLatestMessage.trim();

    if (!trimmedConversation) {
      setErrorBanner('Please paste a conversation or import a WhatsApp .txt file first.');
      return;
    }

    if (!trimmedLatest) {
      setErrorBanner('Please enter or select the latest incoming message you want to reply to.');
      return;
    }

    const contactLabel =
      effectiveLatestSender ??
      parsed.participants.find((p) => !['me', 'you'].includes(p.toLowerCase())) ??
      'WhatsApp Chat';

    const prefs = await loadUserPreferences();

    await saveRecentConversation({
      id: `${Date.now()}`,
      contactLabel,
      latestMessagePreview: trimmedLatest,
      createdAt: new Date().toISOString(),
      language: prefs.language,
      rawText: trimmedConversation,
      latestMessage: trimmedLatest,
    });
    await clearConversationDraft();

    const contextToSend = parsed.formattedHistory || trimmedConversation;

    router.push({
      pathname: '/suggestions',
      params: {
        conversation: contextToSend,
        latestMessage: trimmedLatest,
        sender: effectiveLatestSender ?? '',
        messageCount: String(parsed.messages.length || 1),
        formatDetected: parsed.formatDetected,
      },
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Mode Switcher */}
            <View
              style={[
                styles.segmentedControl,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Paste Conversation mode"
                onPress={() => setMode('paste')}
                style={[
                  styles.segmentButton,
                  mode === 'paste' && {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}>
                <AppIcon
                  name="paste"
                  size={16}
                  color={mode === 'paste' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    Typography.bodySmall,
                    {
                      color: mode === 'paste' ? theme.primary : theme.textSecondary,
                      fontWeight: mode === 'paste' ? '700' : '500',
                    },
                  ]}>
                  Paste Messages
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Import WhatsApp .txt mode"
                onPress={() => setMode('import')}
                style={[
                  styles.segmentButton,
                  mode === 'import' && {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}>
                <AppIcon
                  name="importFile"
                  size={16}
                  color={mode === 'import' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    Typography.bodySmall,
                    {
                      color: mode === 'import' ? theme.primary : theme.textSecondary,
                      fontWeight: mode === 'import' ? '700' : '500',
                    },
                  ]}>
                  Import .txt File
                </Text>
              </Pressable>
            </View>

            {/* File Import Card */}
            {mode === 'import' ? (
              <AppCard variant="elevated" padding="md">
                <View style={styles.importCardContent}>
                  <View style={styles.importHeader}>
                    <IconBadge
                      icon="importFile"
                      backgroundColor={theme.infoSoft}
                      iconColor={theme.info}
                      size="md"
                    />
                    <View style={styles.importHeaderText}>
                      <Text style={[Typography.cardTitle, { color: theme.text }]}>
                        Import WhatsApp Export
                      </Text>
                      <Text style={[Typography.bodySmall, { color: theme.textSecondary }]}>
                        Select a `.txt` chat file exported without media.
                      </Text>
                    </View>
                  </View>

                  {importedFileName ? (
                    <PillBadge
                      label={`Loaded: ${importedFileName}`}
                      variant="success"
                      icon="check"
                    />
                  ) : null}

                  <AppButton
                    label={importedFileName ? 'Choose Another .txt File' : 'Select WhatsApp .txt File'}
                    variant="secondary"
                    leftIcon="importFile"
                    loading={isPickingFile}
                    fullWidth
                    onPress={handleImportFile}
                  />
                </View>
              </AppCard>
            ) : null}

            {/* WhatsApp Export Instructions */}
            <WhatsAppExportGuideCard defaultExpanded={initialMode === 'import'} />

            {/* Error Banner */}
            {errorBanner ? (
              <AppCard
                variant="outlined"
                padding="sm"
                style={{ backgroundColor: theme.dangerSoft, borderColor: theme.danger }}>
                <View style={styles.bannerRow}>
                  <AppIcon name="warning" size={18} color={theme.danger} />
                  <Text style={[Typography.bodySmall, styles.bannerText, { color: theme.danger }]}>
                    {errorBanner}
                  </Text>
                </View>
              </AppCard>
            ) : null}

            {/* Conversation Text Area */}
            <AppCard variant="elevated" padding="md">
              <View style={styles.inputHeader}>
                <View style={styles.inputTitleGroup}>
                  <Text style={[Typography.cardTitle, { color: theme.text }]}>
                    Conversation History
                  </Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                    Paste chat messages or edit imported text below
                  </Text>
                </View>

                <View style={styles.inputHeaderActions}>
                  {!rawText.trim() ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleLoadSample}
                      style={[styles.miniAction, { backgroundColor: theme.surfaceTinted }]}>
                      <Text style={[Typography.caption, { color: theme.accent, fontWeight: '600' }]}>
                        Try Sample
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear conversation"
                      onPress={handleClearAll}
                      style={[styles.miniAction, { backgroundColor: theme.backgroundElement }]}>
                      <AppIcon name="trash" size={13} color={theme.textSecondary} />
                      <Text style={[Typography.caption, { color: theme.textSecondary }]}>Clear</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <TextInput
                multiline
                textAlignVertical="top"
                value={rawText}
                onChangeText={handleConversationChange}
                placeholder={
                  'Paste WhatsApp messages here...\n\nExample:\nAli: Bhai free ho aaj?\nMe: Haan shaam 6 baje ke baad\nAli: Perfect, chai pe milte hain?'
                }
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.textArea,
                  Typography.body,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />

              <View style={styles.inputFooter}>
                <Text style={[Typography.caption, { color: theme.textMuted }]}>
                  {parsed.messages.length > 0
                    ? `${parsed.messages.length} message${parsed.messages.length === 1 ? '' : 's'} detected`
                    : 'Waiting for messages'}
                </Text>
                <Text style={[Typography.caption, { color: theme.textMuted }]}>
                  {rawText.length} chars
                </Text>
              </View>
            </AppCard>

            {/* Parser Warnings (e.g., skipped media placeholders) */}
            {parsed.warnings.map((warning) => (
              <AppCard
                key={warning}
                variant="outlined"
                padding="sm"
                style={{ backgroundColor: theme.warningSoft, borderColor: theme.warning }}>
                <View style={styles.bannerRow}>
                  <AppIcon name="info" size={16} color={theme.warning} />
                  <Text style={[Typography.caption, styles.bannerText, { color: theme.warning }]}>
                    {warning}
                  </Text>
                </View>
              </AppCard>
            ))}

            {/* Latest Incoming Message (Auto-detected + Editable) */}
            <AppCard variant="elevated" padding="md">
              <View style={styles.latestHeader}>
                <View style={styles.latestTitleRow}>
                  <Text style={[Typography.cardTitle, { color: theme.text }]}>
                    Latest Incoming Message
                  </Text>
                  {effectiveLatestSender ? (
                    <PillBadge
                      label={`From: ${effectiveLatestSender}`}
                      variant="softBlue"
                      icon="person"
                    />
                  ) : null}
                </View>
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  Auto-detected from the chat. Edit below if you want to reply to a different line.
                </Text>
              </View>

              <TextInput
                multiline
                value={effectiveLatestMessage}
                onChangeText={(text) => {
                  setLatestOverride(text);
                  setErrorBanner(null);
                }}
                placeholder="Type or select the latest message you received..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.latestInput,
                  Typography.bodyMedium,
                  {
                    backgroundColor: theme.surfaceTinted,
                    borderColor: theme.borderTinted,
                    color: theme.text,
                  },
                ]}
              />

              {latestOverride !== null &&
              parsed.latestIncomingMessage &&
              latestOverride.trim() !== parsed.latestIncomingMessage.trim() ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setLatestOverride(null);
                    setSelectedSenderOverride(undefined);
                  }}
                  style={styles.resetLatestBtn}>
                  <Text style={[Typography.caption, { color: theme.accent, fontWeight: '600' }]}>
                    Reset to auto-detected message
                  </Text>
                </Pressable>
              ) : null}
            </AppCard>

            {/* Interactive Parsed Chat Preview */}
            {parsed.messages.length > 1 ? (
              <ParsedMessagesPreview
                messages={parsed.messages}
                formatDetected={parsed.formatDetected}
                selectedLatestText={effectiveLatestMessage}
                onSelectMessage={handleSelectParsedMessage}
              />
            ) : null}

            {/* Explicit Pre-Send Privacy Notice */}
            <AppCard variant="tinted" padding="sm">
              <View style={styles.bannerRow}>
                <AppIcon name="shield" size={18} color={theme.accent} />
                <Text style={[Typography.caption, styles.bannerText, { color: theme.textSecondary }]}>
                  Your conversation is stored locally as a draft and is only sent to the AI
                  service when you tap Analyze Conversation.
                </Text>
              </View>
            </AppCard>

            {/* Primary CTA */}
            <AppButton
              label="Analyze Conversation"
              variant="primary"
              size="lg"
              leftIcon="sparkles"
              rightIcon="arrowForward"
              fullWidth
              onPress={handleAnalyze}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  importCardContent: {
    gap: Spacing.sm,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  importHeaderText: {
    flex: 1,
    gap: 2,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bannerText: {
    flex: 1,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  inputTitleGroup: {
    flex: 1,
    gap: 2,
  },
  inputHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  textArea: {
    minHeight: 170,
    maxHeight: 280,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  latestHeader: {
    gap: Spacing.xxs,
    marginBottom: Spacing.sm,
  },
  latestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  latestInput: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  resetLatestBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
});
