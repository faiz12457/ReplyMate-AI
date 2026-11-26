import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export type AppIconName =
  | 'sparkles'
  | 'chat'
  | 'paste'
  | 'importFile'
  | 'settings'
  | 'shield'
  | 'arrowForward'
  | 'chevronRight'
  | 'chevronDown'
  | 'chevronUp'
  | 'translate'
  | 'history'
  | 'funny'
  | 'friendly'
  | 'natural'
  | 'info'
  | 'check'
  | 'tune'
  | 'warning'
  | 'close'
  | 'help'
  | 'person'
  | 'send'
  | 'edit'
  | 'trash'
  | 'copy'
  | 'refresh'
  | 'language'
  | 'deleteSweep';

const ICON_MAP: Record<AppIconName, SymbolViewProps['name']> = {
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  chat: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum', web: 'forum' },
  paste: { ios: 'doc.on.clipboard', android: 'content_paste', web: 'content_paste' },
  importFile: { ios: 'doc.text.fill', android: 'upload_file', web: 'upload_file' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  shield: { ios: 'lock.shield.fill', android: 'verified_user', web: 'verified_user' },
  arrowForward: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' },
  translate: { ios: 'globe', android: 'translate', web: 'translate' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  funny: { ios: 'face.smiling', android: 'sentiment_very_satisfied', web: 'sentiment_very_satisfied' },
  friendly: { ios: 'hand.wave.fill', android: 'waving_hand', web: 'waving_hand' },
  natural: { ios: 'text.bubble.fill', android: 'chat_bubble', web: 'chat_bubble' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  tune: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  send: { ios: 'paperplane.fill', android: 'send', web: 'send' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  language: { ios: 'character.bubble', android: 'language', web: 'language' },
  deleteSweep: { ios: 'trash.slash', android: 'delete_sweep', web: 'delete_sweep' },
};

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-platform icon wrapper backed by SF Symbols on iOS and Material Symbols on Android/Web.
 */
export function AppIcon({ name, size = 20, color, style }: AppIconProps) {
  return (
    <SymbolView
      name={ICON_MAP[name]}
      size={size}
      tintColor={color}
      style={style}
      resizeMode="scaleAspectFit"
    />
  );
}
