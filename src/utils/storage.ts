import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_USER_PREFERENCES,
  type ConversationDraft,
  type ConversationHistoryItem,
  type ReplyLanguage,
  type ReplyStyle,
  type UserPreferences,
} from '@/types/replymate';

const DRAFT_STORAGE_KEY = 'replymate_conversation_draft_v1';
const HISTORY_STORAGE_KEY = 'replymate_recent_conversations_v1';
const PREFERENCES_STORAGE_KEY = 'replymate_user_preferences_v1';
const MAX_HISTORY_ITEMS = 12;

const VALID_STYLES: ReplyStyle[] = ['natural', 'funny', 'friendly'];
const VALID_LANGUAGES: ReplyLanguage[] = ['urdu', 'roman_urdu', 'english', 'mixed'];

/**
 * Loads the locally saved conversation draft, if any.
 */
export async function loadConversationDraft(): Promise<ConversationDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConversationDraft;
  } catch {
    return null;
  }
}

/**
 * Saves the current conversation draft locally on the device.
 */
export async function saveConversationDraft(draft: ConversationDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Non-fatal: draft persistence should never block user typing.
  }
}

/**
 * Clears the active conversation draft from local storage.
 */
export async function clearConversationDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
}

/**
 * Loads recent conversation items stored locally on this device.
 */
export async function loadRecentConversations(): Promise<ConversationHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConversationHistoryItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates a recent conversation entry locally (keeps the most recent 12).
 */
export async function saveRecentConversation(
  item: ConversationHistoryItem
): Promise<ConversationHistoryItem[]> {
  const existing = await loadRecentConversations();
  const filtered = existing.filter((entry) => entry.id !== item.id);
  const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);

  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Non-fatal if local history fails to persist.
  }

  return updated;
}

/**
 * Clears all locally stored recent conversations.
 */
export async function clearRecentConversations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
}

/**
 * Loads user reply preferences, falling back safely to defaults.
 */
export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    const preferredStyles = Array.isArray(parsed.preferredStyles)
      ? parsed.preferredStyles.filter((s): s is ReplyStyle => VALID_STYLES.includes(s))
      : DEFAULT_USER_PREFERENCES.preferredStyles;

    const language =
      parsed.language && VALID_LANGUAGES.includes(parsed.language)
        ? parsed.language
        : DEFAULT_USER_PREFERENCES.language;

    return {
      preferredStyles:
        preferredStyles.length > 0 ? preferredStyles : DEFAULT_USER_PREFERENCES.preferredStyles,
      language,
      conciseMode:
        typeof parsed.conciseMode === 'boolean'
          ? parsed.conciseMode
          : DEFAULT_USER_PREFERENCES.conciseMode,
      avoidEmojis:
        typeof parsed.avoidEmojis === 'boolean'
          ? parsed.avoidEmojis
          : DEFAULT_USER_PREFERENCES.avoidEmojis,
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

/**
 * Saves user preferences locally on the device.
 */
export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Non-fatal if local persistence fails.
  }
}

/**
 * Clears both recent conversation history and any active conversation draft.
 */
export async function clearAllLocalConversations(): Promise<void> {
  await Promise.all([clearRecentConversations(), clearConversationDraft()]);
}
