import cors from 'cors';
import express from 'express';

import { config } from './config/env.js';
import { createRepliesRouter } from './routes/repliesRoutes.js';
import { AppError } from './utils/AppError.js';

function createSimpleRateLimiter({ windowMs = 60_000, maxRequests = 30 } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const record = hits.get(key);

    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a minute before trying again.',
        code: 'RATE_LIMITED',
      });
    }

    record.count += 1;
    return next();
  };
}

/**
 * Builds the Express application instance without binding a port.
 * Keeping this separate from server.js makes automated testing clean.
 */
export function createApp({ replyGenerator } = {}) {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    cors({
      origin: (origin, callback) => {
        // Native mobile apps & curl requests have no Origin header.
        if (!origin || config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new AppError('Origin not allowed by CORS.', 403, 'CORS_FORBIDDEN'));
      },
    })
  );

  // Sensible body limit prevents oversized payloads from hitting the AI endpoint.
  app.use(express.json({ limit: '64kb' }));

  // Privacy-safe request logger: logs method, path, status, and duration ONLY (never body/messages).
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (config.nodeEnv !== 'test') {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'replymate-backend',
      openaiConfigured: Boolean(config.openaiApiKey),
    });
  });

  app.use('/api/replies', createSimpleRateLimiter(), createRepliesRouter({ replyGenerator }));

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found.',
      code: 'NOT_FOUND',
    });
  });

  // Centralized error handler (never leaks stack traces or conversation contents).
  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON request body.',
        code: 'INVALID_JSON',
      });
    }

    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        error: 'Request payload is too large (limit: 64kb).',
        code: 'PAYLOAD_TOO_LARGE',
      });
    }

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
      });
    }

    if (config.nodeEnv !== 'test') {
      console.error('Unhandled server error:', err?.message ?? 'Unknown error');
    }

    return res.status(500).json({
      success: false,
      error: 'Unexpected server error. Please try again.',
      code: 'INTERNAL_ERROR',
    });
  });

  return app;
}
