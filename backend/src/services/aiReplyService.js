import { GoogleGenAI } from '@google/genai';

import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const MAX_OUTPUT_TOKENS = 550;

const LANGUAGE_GUIDANCE = {
  urdu: 'Write replies in natural everyday Urdu script (اردو) suitable for WhatsApp texting. Avoid overly formal literary Urdu.',
  roman_urdu:
    'Write replies in natural everyday Roman Urdu (e.g. "Haan bhai", "Scene on hai", "Theek hai") as people text on WhatsApp in Pakistan/India.',
  english: 'Write replies in natural, conversational English suitable for texting on WhatsApp.',
  mixed:
    'Write replies in natural mixed Urdu + Roman Urdu + English code-switching (mostly Roman Urdu + English, matching the vibe of the conversation).',
};

const STYLE_GUIDANCE = {
  natural: 'natural: Realistic, effortless everyday response that fits seamlessly into the chat.',
  funny:
    'funny: Lighthearted, witty, playful humor that fits the topic without forcing jokes or offending.',
  friendly:
    'friendly: Warm, approachable, attentive reply that shows genuine interest and keeps the chat moving.',
};

const SYSTEM_PROMPT = `You are ReplyMate AI, an assistant that helps real people write concise, human-sounding WhatsApp replies.

Before generating replies, silently analyze:
1. The conversation history and topic.
2. The tone (casual, serious, playful, urgent, polite, etc.).
3. The relationship context when reasonably clear from the messages (e.g., close friend, colleague, family, acquaintance) without guessing or inventing unstated facts.
4. What the latest incoming message is specifically asking or expressing.

Strict texting rules:
- Sound like a real person texting on WhatsApp, NEVER like a formal customer-support bot or AI assistant.
- Keep replies concise (typically 1 to 2 short sentences).
- Do NOT repeat or echo the incoming message back verbatim.
- Do NOT use generic filler ("I understand your concern", "That sounds great! Let me know if you need anything else").
- Use emojis sparingly (at most 1 emoji only if it truly fits the tone; zero emojis is often better).
- Avoid excessive flirting or overly dramatic language.
- Never invent plans, times, locations, or facts that are not in the conversation.
- For each requested style, write a genuinely distinct reply and a brief 1-sentence reason explaining why it fits the conversation context.`;

/**
 * Builds the Gemini response schema. Gemini supports a subset of JSON Schema,
 * so this intentionally avoids OpenAI-specific fields such as `strict` and
 * `additionalProperties`.
 */
function buildResponseSchema(requestedStyles) {
  return {
    type: 'object',
    properties: {
      replies: {
        type: 'array',
        minItems: requestedStyles.length,
        maxItems: requestedStyles.length,
        items: {
          type: 'object',
          properties: {
            style: {
              type: 'string',
              enum: requestedStyles,
            },
            text: {
              type: 'string',
            },
            reason: {
              type: 'string',
            },
          },
          required: ['style', 'text', 'reason'],
        },
      },
    },
    required: ['replies'],
  };
}

function buildUserPrompt({
  conversation,
  latestMessage,
  style,
  language,
  previousReply,
  conciseMode = true,
  avoidEmojis = false,
}) {
  const styleInstructions = style.map((item) => `- ${STYLE_GUIDANCE[item]}`).join('\n');

  const lines = [
    `Language preference: ${LANGUAGE_GUIDANCE[language] ?? LANGUAGE_GUIDANCE.mixed}`,
    conciseMode
      ? 'Length preference: Keep replies very short and punchy (ideally 1 short sentence).'
      : 'Length preference: Natural conversational length (1-2 sentences).',
    avoidEmojis
      ? 'Emoji preference: Do NOT include any emojis.'
      : 'Emoji preference: Use at most 1 emoji only if it naturally fits.',
    '',
    'Requested reply styles (generate exactly one reply per style in this order):',
    styleInstructions,
    '',
    'Conversation history:',
    '"""',
    conversation,
    '"""',
    '',
    'Latest incoming message to reply to:',
    '"""',
    latestMessage,
    '"""',
  ];

  if (previousReply) {
    lines.push(
      '',
      `Provide a fresh alternative that is noticeably different from this previous suggestion: "${previousReply}"`
    );
  }

  return lines.join('\n');
}

function getErrorStatus(error) {
  const status = error?.status ?? error?.statusCode;
  return typeof status === 'number' ? status : undefined;
}

function getErrorText(error) {
  const parts = [error?.message, error?.body];
  try {
    parts.push(JSON.stringify(error?.error));
  } catch {
    // Ignore non-serializable error payloads.
  }
  return parts.filter((part) => typeof part === 'string').join(' ');
}

function mapGeminiError(error) {
  if (error instanceof AppError) {
    return error;
  }

  const status = getErrorStatus(error);
  const message = getErrorText(error);

  if (
    status === 401 ||
    status === 403 ||
    (status === 400 && /api[_ ]?key|api_key_invalid/i.test(message))
  ) {
    return new AppError(
      'AI service authentication failed. Please try again later.',
      502,
      'AI_AUTH_ERROR'
    );
  }
  if (status === 429) {
    return new AppError(
      'AI service is temporarily rate-limited. Please wait a moment and try again.',
      429,
      'AI_RATE_LIMITED'
    );
  }
  if (
    status === 408 ||
    status === 504 ||
    error?.name === 'AbortError' ||
    /timed out|timeout/i.test(message)
  ) {
    return new AppError('AI reply generation timed out. Please try again.', 504, 'AI_TIMEOUT');
  }

  return new AppError(
    'Unable to generate AI replies right now. Please try again shortly.',
    502,
    'AI_UPSTREAM_ERROR'
  );
}

function parseJsonResponse(rawContent) {
  const trimmed = rawContent.trim();
  // Gemini structured output is normally pure JSON, but tolerate markdown fences
  // in case a model wraps the payload anyway.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

/**
 * Generates context-aware WhatsApp reply suggestions using Google Gemini
 * structured JSON output. Requests are stateless (`store: false`) so chat text
 * is not retained by the Interactions API.
 *
 * Accepts an optional client override for clean unit testing without network calls.
 *
 * @param {object} params
 * @param {string} params.conversation
 * @param {string} params.latestMessage
 * @param {string[]} params.style
 * @param {string} params.language
 * @param {string} [params.previousReply]
 * @param {boolean} [params.conciseMode]
 * @param {boolean} [params.avoidEmojis]
 * @param {{ interactions: { create: Function } }} [clientOverride]
 */
export async function generateContextAwareReplies(
  {
    conversation,
    latestMessage,
    style,
    language,
    previousReply,
    conciseMode = true,
    avoidEmojis = false,
  },
  clientOverride
) {
  if (!clientOverride && !config.geminiApiKey) {
    throw new AppError('AI service is not configured on the server.', 503, 'AI_NOT_CONFIGURED');
  }

  const client =
    clientOverride ??
    new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: { timeout: config.aiTimeoutMs },
    });

  try {
    const interaction = await client.interactions.create({
      model: config.geminiModel,
      input: buildUserPrompt({
        conversation,
        latestMessage,
        style,
        language,
        previousReply,
        conciseMode,
        avoidEmojis,
      }),
      system_instruction: SYSTEM_PROMPT,
      // Privacy-first: do not retain the conversation on Google's servers.
      store: false,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: buildResponseSchema(style),
      },
      generation_config: {
        max_output_tokens: MAX_OUTPUT_TOKENS,
      },
    });

    const rawContent = interaction?.output_text;
    if (!rawContent) {
      throw new AppError('AI returned an empty response. Please try again.', 502, 'AI_EMPTY');
    }

    let parsed;
    try {
      parsed = parseJsonResponse(rawContent);
    } catch {
      throw new AppError('AI returned malformed JSON output.', 502, 'AI_INVALID_JSON');
    }

    if (!parsed || !Array.isArray(parsed.replies)) {
      throw new AppError('AI response did not include replies array.', 502, 'AI_INVALID_SHAPE');
    }

    // Order replies according to the requested styles array and sanitize text.
    const byStyle = new Map();
    for (const item of parsed.replies) {
      if (item && typeof item.style === 'string' && typeof item.text === 'string') {
        const key = item.style.toLowerCase();
        if (!byStyle.has(key) && item.text.trim()) {
          byStyle.set(key, {
            style: key,
            text: item.text.trim(),
            reason:
              typeof item.reason === 'string' && item.reason.trim()
                ? item.reason.trim()
                : 'Matches the conversation tone and context.',
          });
        }
      }
    }

    const orderedReplies = style.map((requestedStyle) => byStyle.get(requestedStyle)).filter(Boolean);
    if (orderedReplies.length === 0) {
      throw new AppError('AI did not produce usable reply options.', 502, 'AI_NO_REPLIES');
    }

    return orderedReplies;
  } catch (error) {
    throw mapGeminiError(error);
  }
}
