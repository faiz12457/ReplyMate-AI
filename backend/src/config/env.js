import 'dotenv/config';

const parsedPort = Number.parseInt(process.env.PORT ?? '3001', 10);

export const config = {
  port: Number.isNaN(parsedPort) ? 3001 : parsedPort,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  openaiApiKey: (process.env.OPENAI_API_KEY ?? '').trim(),
  openaiModel: (process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim() || 'gpt-4o-mini',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
