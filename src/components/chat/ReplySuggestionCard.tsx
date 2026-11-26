import { StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppCard,
  IconBadge,
  PillBadge,
  type AppIconName,
  type PillBadgeVariant,
} from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReplyOption, ReplyStyle } from '@/types/replymate';

export interface ReplySuggestionCardProps {
  reply: ReplyOption;
  selected?: boolean;
  copied?: boolean;
  regenerating?: boolean;
  onSelect?: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
}

const STYLE_META: Record<
  ReplyStyle,
  { label: string; icon: AppIconName; badgeVariant: PillBadgeVariant }
> = {
  natural: {
    label: 'Natural',
    icon: 'natural',
    badgeVariant: 'softBlue',
  },
  funny: {
    label: 'Funny',
    icon: 'funny',
    badgeVariant: 'warning',
  },
  friendly: {
    label: 'Friendly',
    icon: 'friendly',
    badgeVariant: 'success',
  },
};

/**
 * Displays an AI-generated reply suggestion with its context explanation,
 * one-tap Copy button, and per-card Regenerate button.
 */
export function ReplySuggestionCard({
  reply,
  selected = false,
  copied = false,
  regenerating = false,
  onSelect,
  onCopy,
  onRegenerate,
}: ReplySuggestionCardProps) {
  const theme = useTheme();
  const meta = STYLE_META[reply.style] ?? STYLE_META.natural;

  const badgeColors: Record<ReplyStyle, { bg: string; icon: string }> = {
    natural: { bg: theme.surfaceTinted, icon: theme.accent },
    funny: { bg: theme.warningSoft, icon: theme.warning },
    friendly: { bg: theme.successSoft, icon: theme.success },
  };
  const colors = badgeColors[reply.style] ?? badgeColors.natural;

  return (
    <AppCard
      variant="elevated"
      padding="md"
      onPress={onSelect}
      accessibilityLabel={`${meta.label} reply suggestion: ${reply.text}`}
      style={selected ? { borderColor: theme.accent, borderWidth: 1.5 } : undefined}>
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <View style={styles.styleGroup}>
            <IconBadge
              icon={meta.icon}
              backgroundColor={colors.bg}
              iconColor={colors.icon}
              size="sm"
            />
            <PillBadge label={meta.label} variant={meta.badgeVariant} />
          </View>

          {copied ? (
            <PillBadge label="Copied!" variant="success" icon="check" />
          ) : selected ? (
            <PillBadge label="Selected" variant="navy" icon="check" />
          ) : null}
        </View>

        <View
          style={[
            styles.replyBubble,
            {
              backgroundColor: selected ? theme.surfaceTinted : theme.surface,
              borderColor: selected ? theme.borderTinted : theme.border,
              opacity: regenerating ? 0.6 : 1,
            },
          ]}>
          <Text selectable style={[Typography.cardTitle, { color: theme.text }]}>
            {reply.text}
          </Text>
        </View>

        <View style={styles.reasonRow}>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            <Text style={{ fontWeight: '700', color: theme.text }}>Why this fits: </Text>
            {reply.reason}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            label={copied ? 'Copied' : 'Copy'}
            variant={copied ? 'accent' : 'primary'}
            leftIcon={copied ? 'check' : 'copy'}
            disabled={regenerating}
            onPress={onCopy}
            style={styles.actionButton}
          />
          <AppButton
            label="Regenerate"
            variant="secondary"
            leftIcon="refresh"
            loading={regenerating}
            disabled={regenerating}
            onPress={onRegenerate}
            style={styles.actionButton}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  styleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  replyBubble: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  reasonRow: {
    paddingHorizontal: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  actionButton: {
    flex: 1,
  },
});
