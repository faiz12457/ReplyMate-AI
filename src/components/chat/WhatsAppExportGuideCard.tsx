import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, AppIcon, IconBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface WhatsAppExportGuideCardProps {
  defaultExpanded?: boolean;
}

const EXPORT_STEPS = [
  'Open the chat in WhatsApp.',
  'Tap the contact/group name (iPhone) or ⋮ More (Android).',
  'Tap Export Chat and choose "Without Media".',
  'Save the .txt file (or extract it if zipped), then select it above.',
];

/**
 * Collapsible instructions showing how to export a WhatsApp chat without media attachments.
 */
export function WhatsAppExportGuideCard({
  defaultExpanded = false,
}: WhatsAppExportGuideCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <AppCard variant="tinted" padding="md">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="How to export a WhatsApp chat"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.headerRow}>
        <IconBadge
          icon="help"
          backgroundColor={theme.background}
          iconColor={theme.accent}
          size="sm"
        />
        <View style={styles.headerText}>
          <Text style={[Typography.bodyMedium, { color: theme.text }]}>
            How to export a WhatsApp chat (.txt)
          </Text>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            {expanded ? 'Tap to hide steps' : 'Tap to view quick steps (Android & iPhone)'}
          </Text>
        </View>
        <AppIcon
          name={expanded ? 'chevronUp' : 'chevronDown'}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={[styles.stepsList, { borderTopColor: theme.borderTinted }]}>
          {EXPORT_STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accentSoft }]}>
                <Text style={[Typography.caption, { color: theme.accent, fontWeight: '700' }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[Typography.bodySmall, styles.stepText, { color: theme.textSecondary }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  stepsList: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepText: {
    flex: 1,
  },
});
