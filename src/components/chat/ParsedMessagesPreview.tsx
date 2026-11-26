import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, AppIcon, PillBadge } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DetectedChatFormat, ParsedMessage } from '@/types/replymate';

export interface ParsedMessagesPreviewProps {
  messages: ParsedMessage[];
  formatDetected: DetectedChatFormat;
  selectedLatestText: string;
  onSelectMessage: (message: ParsedMessage) => void;
}

const FORMAT_LABELS: Record<DetectedChatFormat, string> = {
  whatsapp_export: 'WhatsApp Export',
  labeled_chat: 'Labeled Chat',
  plain_text: 'Plain Text',
};

const MAX_PREVIEW_MESSAGES = 10;

/**
 * Displays recently parsed chat messages and lets the user tap any message to mark it
 * as the latest incoming message.
 */
export function ParsedMessagesPreview({
  messages,
  formatDetected,
  selectedLatestText,
  onSelectMessage,
}: ParsedMessagesPreviewProps) {
  const theme = useTheme();

  const usableMessages = messages.filter(
    (msg) => !msg.isSystem && !msg.isMediaOmitted && msg.text.trim().length > 0
  );

  if (usableMessages.length === 0) {
    return null;
  }

  const visibleMessages = usableMessages.slice(-MAX_PREVIEW_MESSAGES);
  const hiddenCount = usableMessages.length - visibleMessages.length;

  return (
    <AppCard variant="outlined" padding="md">
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={[Typography.cardTitle, { color: theme.text }]}>Parsed Chat Preview</Text>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            Tap any message below to set it as the latest incoming message
          </Text>
        </View>
        <PillBadge label={FORMAT_LABELS[formatDetected]} variant="softBlue" />
      </View>

      {hiddenCount > 0 ? (
        <Text style={[Typography.caption, styles.trimmedHint, { color: theme.textMuted }]}>
          Showing the last {MAX_PREVIEW_MESSAGES} of {usableMessages.length} parsed messages
        </Text>
      ) : null}

      <View style={styles.messageList}>
        {visibleMessages.map((msg) => {
          const isSelected = msg.text.trim() === selectedLatestText.trim();
          return (
            <Pressable
              key={msg.id}
              accessibilityRole="button"
              accessibilityLabel={`Select message from ${msg.sender ?? 'chat'}`}
              onPress={() => onSelectMessage(msg)}
              style={({ pressed }) => [
                styles.messageItem,
                {
                  backgroundColor: isSelected ? theme.surfaceTinted : theme.surfaceElevated,
                  borderColor: isSelected ? theme.accent : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View style={styles.messageMeta}>
                <View style={styles.senderRow}>
                  <AppIcon
                    name="person"
                    size={13}
                    color={isSelected ? theme.accent : theme.textMuted}
                  />
                  <Text
                    style={[
                      Typography.caption,
                      { color: isSelected ? theme.accent : theme.text, fontWeight: '700' },
                    ]}>
                    {msg.sender ?? 'Message'}
                  </Text>
                </View>

                <View style={styles.rightMeta}>
                  {msg.timestamp ? (
                    <Text style={[Typography.caption, { color: theme.textMuted }]}>
                      {msg.timestamp}
                    </Text>
                  ) : null}
                  {isSelected ? (
                    <AppIcon name="check" size={15} color={theme.accent} />
                  ) : null}
                </View>
              </View>

              <Text style={[Typography.bodySmall, { color: theme.text }]} numberOfLines={4}>
                {msg.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  trimmedHint: {
    marginTop: Spacing.xs,
  },
  messageList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  messageItem: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xxs,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
