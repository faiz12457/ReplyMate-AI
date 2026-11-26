import type { DetectedChatFormat, ParsedConversation, ParsedMessage } from '@/types/replymate';

const MAX_MESSAGES_FOR_CONTEXT = 40;
const MAX_FORMATTED_CHARS = 6000;

// Invisible directional/BOM characters frequently inserted by WhatsApp iOS & Android exports.
const DIRECTIONAL_MARKS_REGEX = /[\u200E\u200F\u202A-\u202E\uFEFF]/g;

// Matches iOS bracketed exports: [26/11/2026, 10:45:12 AM] Sender: message
const IOS_EXPORT_LINE_REGEX =
  /^\[(\d{1,4}[./-]\d{1,2}[./-]\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+(.+)$/;

// Matches Android / desktop dash exports: 26/11/2026, 10:45 am - Sender: message
const ANDROID_EXPORT_LINE_REGEX =
  /^(\d{1,4}[./-]\d{1,2}[./-]\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s+[-–]\s+(.+)$/;

// Matches simple labeled chat lines: Ali: Hey, free tonight?
const LABELED_LINE_REGEX = /^([^:\n]{1,40}):\s+(.+)$/;

const MEDIA_PLACEHOLDER_PATTERNS = [
  /^<media omitted>$/i,
  /^image omitted$/i,
  /^video omitted$/i,
  /^audio omitted$/i,
  /^sticker omitted$/i,
  /^gif omitted$/i,
  /^document omitted$/i,
  /^contact card omitted$/i,
  /^<attached: .+>$/i,
  /^null$/i,
];

const SYSTEM_MESSAGE_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /created group/i,
  /added you$/i,
  /changed the subject/i,
  /changed this group's icon/i,
  /security code changed/i,
  /missed voice call/i,
  /missed video call/i,
  /waiting for this message/i,
  /this message was deleted/i,
  /you deleted this message/i,
];

const OWN_SENDER_LABELS = new Set(['me', 'you', 'myself', 'i']);

function sanitizeLine(line: string): string {
  return line.replace(DIRECTIONAL_MARKS_REGEX, '').replace(/\r$/, '');
}

function isMediaOmittedText(text: string): boolean {
  const trimmed = text.trim();
  return MEDIA_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isSystemMessageText(text: string): boolean {
  const trimmed = text.trim();
  return SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function splitSenderAndMessage(payload: string): { sender?: string; text: string } {
  const colonIndex = payload.indexOf(': ');
  if (colonIndex > 0 && colonIndex <= 45) {
    const potentialSender = payload.slice(0, colonIndex).trim();
    const messageText = payload.slice(colonIndex + 2);
    // Avoid treating sentences or URLs as sender names.
    if (potentialSender && !potentialSender.includes('http')) {
      return { sender: potentialSender, text: messageText };
    }
  }
  return { text: payload };
}

function parseWhatsAppExportLines(lines: string[]): ParsedMessage[] {
  const messages: ParsedMessage[] = [];

  for (const rawLine of lines) {
    const line = sanitizeLine(rawLine);
    const match = line.match(IOS_EXPORT_LINE_REGEX) ?? line.match(ANDROID_EXPORT_LINE_REGEX);

    if (match) {
      const [, timestamp, payload] = match;
      const { sender, text } = splitSenderAndMessage(payload);
      const isSystem = !sender || isSystemMessageText(text);
      const isMediaOmitted = !isSystem && isMediaOmittedText(text);

      messages.push({
        id: `msg-${messages.length + 1}`,
        timestamp: timestamp.trim(),
        sender,
        text: text.trim(),
        isSystem,
        isMediaOmitted,
      });
    } else if (messages.length > 0 && line.trim().length > 0) {
      // Continuation of the previous multi-line WhatsApp message.
      const prev = messages[messages.length - 1];
      prev.text = `${prev.text}\n${line.trimEnd()}`;
    }
  }

  return messages;
}

function parseLabeledOrPlainLines(lines: string[]): {
  messages: ParsedMessage[];
  format: DetectedChatFormat;
} {
  const cleanedLines = lines.map(sanitizeLine).filter((line) => line.trim().length > 0);
  const labeledCount = cleanedLines.filter((line) => {
    const match = line.match(LABELED_LINE_REGEX);
    return Boolean(match && !match[1].includes('http'));
  }).length;

  const isLabeledChat = labeledCount >= 2 || (cleanedLines.length === 1 && labeledCount === 1);

  if (isLabeledChat) {
    const messages: ParsedMessage[] = [];
    for (const line of cleanedLines) {
      const match = line.match(LABELED_LINE_REGEX);
      if (match && !match[1].includes('http')) {
        const sender = match[1].trim();
        const text = match[2].trim();
        messages.push({
          id: `msg-${messages.length + 1}`,
          sender,
          text,
          isSystem: isSystemMessageText(text),
          isMediaOmitted: isMediaOmittedText(text),
        });
      } else if (messages.length > 0) {
        const prev = messages[messages.length - 1];
        prev.text = `${prev.text}\n${line.trim()}`;
      } else {
        messages.push({
          id: `msg-${messages.length + 1}`,
          text: line.trim(),
        });
      }
    }
    return { messages, format: 'labeled_chat' };
  }

  const messages: ParsedMessage[] = cleanedLines.map((line, index) => ({
    id: `msg-${index + 1}`,
    text: line.trim(),
    isMediaOmitted: isMediaOmittedText(line),
  }));

  return { messages, format: 'plain_text' };
}

function selectLatestIncoming(messages: ParsedMessage[]): ParsedMessage | undefined {
  const candidates = messages.filter(
    (msg) => !msg.isSystem && !msg.isMediaOmitted && msg.text.trim().length > 0
  );
  if (candidates.length === 0) {
    return undefined;
  }

  // Prefer the most recent message not explicitly labeled "Me" / "You".
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const sender = candidates[i].sender?.trim().toLowerCase();
    if (!sender || !OWN_SENDER_LABELS.has(sender)) {
      return candidates[i];
    }
  }

  return candidates[candidates.length - 1];
}

function formatConversationHistory(messages: ParsedMessage[]): {
  formattedHistory: string;
  wasTrimmed: boolean;
} {
  const usable = messages.filter((msg) => !msg.isSystem && !msg.isMediaOmitted && msg.text.trim());
  const wasTrimmed = usable.length > MAX_MESSAGES_FOR_CONTEXT;
  const recent = usable.slice(-MAX_MESSAGES_FOR_CONTEXT);

  const lines = recent.map((msg) => (msg.sender ? `${msg.sender}: ${msg.text}` : msg.text));
  let formattedHistory = lines.join('\n');

  if (formattedHistory.length > MAX_FORMATTED_CHARS) {
    formattedHistory = formattedHistory.slice(-MAX_FORMATTED_CHARS);
    const firstNewline = formattedHistory.indexOf('\n');
    if (firstNewline > 0 && firstNewline < 200) {
      formattedHistory = formattedHistory.slice(firstNewline + 1);
    }
  }

  return { formattedHistory, wasTrimmed: wasTrimmed || formattedHistory.length >= MAX_FORMATTED_CHARS };
}

/**
 * Checks whether imported text appears to be binary or unsupported content.
 */
export function isProbablyBinaryText(content: string): boolean {
  if (!content) return false;
  return content.includes('\u0000');
}

/**
 * Parses either an exported WhatsApp `.txt` file or manually pasted conversation messages.
 * Extracts timestamps, sender names, conversation context, and the likely latest incoming message.
 */
export function parseWhatsAppConversation(rawInput: string): ParsedConversation {
  const warnings: string[] = [];
  const normalized = sanitizeLine(rawInput ?? '').trim();

  if (!normalized) {
    return {
      messages: [],
      participants: [],
      formattedHistory: '',
      latestIncomingMessage: '',
      formatDetected: 'plain_text',
      warnings: [],
    };
  }

  if (isProbablyBinaryText(normalized)) {
    return {
      messages: [],
      participants: [],
      formattedHistory: '',
      latestIncomingMessage: '',
      formatDetected: 'plain_text',
      warnings: ['This file does not appear to be plain UTF-8 text. Please choose a WhatsApp .txt export.'],
    };
  }

  const lines = normalized.split('\n');
  const exportMessages = parseWhatsAppExportLines(lines);

  let messages: ParsedMessage[];
  let formatDetected: DetectedChatFormat;

  if (exportMessages.length > 0) {
    messages = exportMessages;
    formatDetected = 'whatsapp_export';
  } else {
    const fallback = parseLabeledOrPlainLines(lines);
    messages = fallback.messages;
    formatDetected = fallback.format;
  }

  const mediaCount = messages.filter((msg) => msg.isMediaOmitted).length;
  if (mediaCount > 0) {
    warnings.push(
      `Skipped ${mediaCount} media placeholder${mediaCount === 1 ? '' : 's'} (attachments are not uploaded).`
    );
  }

  const participants = Array.from(
    new Set(
      messages
        .filter((msg) => !msg.isSystem && msg.sender)
        .map((msg) => msg.sender as string)
    )
  );

  const latest = selectLatestIncoming(messages);
  const { formattedHistory, wasTrimmed } = formatConversationHistory(messages);

  if (wasTrimmed) {
    warnings.push(`Showing the most recent ${MAX_MESSAGES_FOR_CONTEXT} text messages for focused AI context.`);
  }

  if (!latest && messages.length > 0) {
    warnings.push('No readable text message was found (only media or system notices). Please type the latest message manually.');
  }

  return {
    messages,
    participants,
    formattedHistory,
    latestIncomingMessage: latest?.text ?? '',
    latestIncomingSender: latest?.sender,
    formatDetected,
    warnings,
  };
}
