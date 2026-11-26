export const ALLOWED_STYLES = ['natural', 'funny', 'friendly'];
export const ALLOWED_LANGUAGES = ['urdu', 'roman_urdu', 'english', 'mixed'];

const MAX_CONVERSATION_CHARS = 12000;
const MAX_LATEST_MESSAGE_CHARS = 2000;
const MAX_PREVIOUS_REPLY_CHARS = 1000;

/**
 * Validates and normalizes the POST /api/replies/generate request body.
 * @param {unknown} body
 * @returns {{ valid: true, value: object } | { valid: false, error: string }}
 */
export function validateGenerateRepliesRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { conversation, latestMessage, style, language, previousReply, conciseMode, avoidEmojis } =
    body;

  if (typeof conversation !== 'string' || !conversation.trim()) {
    return { valid: false, error: 'Field "conversation" must be a non-empty string.' };
  }
  if (conversation.length > MAX_CONVERSATION_CHARS) {
    return {
      valid: false,
      error: `Field "conversation" exceeds maximum length of ${MAX_CONVERSATION_CHARS} characters.`,
    };
  }

  if (typeof latestMessage !== 'string' || !latestMessage.trim()) {
    return { valid: false, error: 'Field "latestMessage" must be a non-empty string.' };
  }
  if (latestMessage.length > MAX_LATEST_MESSAGE_CHARS) {
    return {
      valid: false,
      error: `Field "latestMessage" exceeds maximum length of ${MAX_LATEST_MESSAGE_CHARS} characters.`,
    };
  }

  let normalizedStyles = [...ALLOWED_STYLES];
  if (style !== undefined) {
    if (!Array.isArray(style) || style.length === 0) {
      return {
        valid: false,
        error: 'Field "style" must be a non-empty array containing natural, funny, or friendly.',
      };
    }

    const deduped = [];
    for (const item of style) {
      if (typeof item !== 'string') {
        return { valid: false, error: 'Each item in "style" must be a string.' };
      }
      const lower = item.trim().toLowerCase();
      if (!ALLOWED_STYLES.includes(lower)) {
        return {
          valid: false,
          error: `Unsupported style "${item}". Allowed styles: ${ALLOWED_STYLES.join(', ')}.`,
        };
      }
      if (!deduped.includes(lower)) {
        deduped.push(lower);
      }
    }
    normalizedStyles = deduped;
  }

  let normalizedLanguage = 'mixed';
  if (language !== undefined) {
    if (typeof language !== 'string' || !ALLOWED_LANGUAGES.includes(language.trim().toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported language "${String(language)}". Allowed languages: ${ALLOWED_LANGUAGES.join(', ')}.`,
      };
    }
    normalizedLanguage = language.trim().toLowerCase();
  }

  let normalizedPreviousReply;
  if (previousReply !== undefined) {
    if (typeof previousReply !== 'string') {
      return { valid: false, error: 'Field "previousReply" must be a string when provided.' };
    }
    if (previousReply.length > MAX_PREVIOUS_REPLY_CHARS) {
      return {
        valid: false,
        error: `Field "previousReply" exceeds maximum length of ${MAX_PREVIOUS_REPLY_CHARS} characters.`,
      };
    }
    const trimmedPrev = previousReply.trim();
    if (trimmedPrev) {
      normalizedPreviousReply = trimmedPrev;
    }
  }

  if (conciseMode !== undefined && typeof conciseMode !== 'boolean') {
    return { valid: false, error: 'Field "conciseMode" must be a boolean when provided.' };
  }

  if (avoidEmojis !== undefined && typeof avoidEmojis !== 'boolean') {
    return { valid: false, error: 'Field "avoidEmojis" must be a boolean when provided.' };
  }

  return {
    valid: true,
    value: {
      conversation: conversation.trim(),
      latestMessage: latestMessage.trim(),
      style: normalizedStyles,
      language: normalizedLanguage,
      previousReply: normalizedPreviousReply,
      conciseMode: conciseMode ?? true,
      avoidEmojis: avoidEmojis ?? false,
    },
  };
}
