/**
 * Core domain types for ReplyMate AI.
 * Keeping these centralized ensures consistent typing across screens and future phases.
 */

export type ReplyStyle = 'natural' | 'funny' | 'friendly';

export type ReplyLanguage = 'urdu' | 'roman_urdu' | 'english' | 'mixed';

export type InputMode = 'paste' | 'import';

export interface ReplyOption {
  style: ReplyStyle;
  text: string;
  reason: string;
}

export interface ParsedMessage {
  id: string;
  sender?: string;
  timestamp?: string;
  text: string;
  isSystem?: boolean;
  isMediaOmitted?: boolean;
}

export type DetectedChatFormat = 'whatsapp_export' | 'labeled_chat' | 'plain_text';

export interface ParsedConversation {
  messages: ParsedMessage[];
  participants: string[];
  formattedHistory: string;
  latestIncomingMessage: string;
  latestIncomingSender?: string;
  formatDetected: DetectedChatFormat;
  warnings: string[];
}

export interface ConversationDraft {
  id: string;
  rawText: string;
  latestMessage: string;
  latestSender?: string;
  contactLabel: string;
  sourceMode: InputMode;
  importedFileName?: string;
  updatedAt: string;
}

export interface ConversationHistoryItem {
  id: string;
  contactLabel: string;
  latestMessagePreview: string;
  createdAt: string;
  language: ReplyLanguage;
  rawText?: string;
  latestMessage?: string;
}

export interface UserPreferences {
  preferredStyles: ReplyStyle[];
  language: ReplyLanguage;
  conciseMode: boolean;
  avoidEmojis: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  preferredStyles: ['natural', 'funny', 'friendly'],
  language: 'mixed',
  conciseMode: true,
  avoidEmojis: false,
};
