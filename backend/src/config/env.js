import 'dotenv/config';

const parsedPort = Number.parseInt(process.env.PORT ?? '3001', 10);
const parsedTimeout = Number.parseInt(process.env.AI_TIMEOUT_MS ?? '20000', 10);

export const config = {
  port: Number.isNaN(parsedPort) ? 3001 : parsedPort,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  geminiApiKey: (process.env.GEMINI_API_KEY ?? '').trim(),
  geminiModel:
    (process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite').trim() || 'gemini-3.5-flash-lite',
  aiTimeoutMs: Number.isNaN(parsedTimeout) || parsedTimeout <= 0 ? 20000 : parsedTimeout,
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
