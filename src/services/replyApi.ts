import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ReplyLanguage, ReplyOption, ReplyStyle } from '@/types/replymate';

const DEFAULT_BACKEND_PORT = 3001;
const REQUEST_TIMEOUT_MS = 25000;

export interface GenerateRepliesRequest {
  conversation: string;
  latestMessage: string;
  style?: ReplyStyle[];
  language?: ReplyLanguage;
  previousReply?: string;
  conciseMode?: boolean;
  avoidEmojis?: boolean;
}

interface GenerateRepliesResponse {
  success: boolean;
  replies?: ReplyOption[];
  error?: string;
  code?: string;
}

export class ReplyApiError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ReplyApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Resolves the backend base URL for Windows + Android Emulator, physical devices (iPhone XS),
 * and Web. Override anytime by setting EXPO_PUBLIC_API_URL in a root .env file.
 */
export function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${DEFAULT_BACKEND_PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    // 10.0.2.2 routes from the Android Emulator to localhost on the host Windows PC.
    return `http://10.0.2.2:${DEFAULT_BACKEND_PORT}`;
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
}

/**
 * Calls POST /api/replies/generate on the Express backend to fetch context-aware replies.
 */
export async function generateReplies(
  payload: GenerateRepliesRequest
): Promise<ReplyOption[]> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/replies/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: payload.conversation,
        latestMessage: payload.latestMessage,
        style: payload.style ?? ['natural', 'funny', 'friendly'],
        language: payload.language ?? 'mixed',
        ...(payload.previousReply ? { previousReply: payload.previousReply } : {}),
        ...(typeof payload.conciseMode === 'boolean' ? { conciseMode: payload.conciseMode } : {}),
        ...(typeof payload.avoidEmojis === 'boolean' ? { avoidEmojis: payload.avoidEmojis } : {}),
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as GenerateRepliesResponse | null;

    if (!response.ok || !data?.success) {
      throw new ReplyApiError(
        data?.error || `Server responded with status ${response.status}.`,
        response.status,
        data?.code
      );
    }

    if (!Array.isArray(data.replies) || data.replies.length === 0) {
      throw new ReplyApiError('No reply suggestions were returned by the server.', 502, 'EMPTY');
    }

    return data.replies;
  } catch (error) {
    if (error instanceof ReplyApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ReplyApiError(
        'Request timed out while waiting for AI suggestions. Please try again.',
        408,
        'TIMEOUT'
      );
    }

    throw new ReplyApiError(
      `Could not reach ReplyMate backend at ${baseUrl}. Make sure the backend server is running.`,
      undefined,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
