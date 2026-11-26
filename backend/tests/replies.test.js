import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/app.js';
import { generateContextAwareReplies } from '../src/services/aiReplyService.js';
import { validateGenerateRepliesRequest } from '../src/validators/replyRequestValidator.js';

async function withServer(app, fn) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function buildFakeGeminiClient({ outputText, error } = {}) {
  return {
    interactions: {
      create: async () => {
        if (error) {
          throw error;
        }
        return { output_text: outputText };
      },
    },
  };
}

test('validateGenerateRepliesRequest accepts valid payload and applies defaults', () => {
  const result = validateGenerateRepliesRequest({
    conversation: 'Ali: Chai pe chalain?\nMe: Haan kab?',
    latestMessage: '8 baje chalte hain',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.value.style, ['natural', 'funny', 'friendly']);
  assert.equal(result.value.language, 'mixed');
  assert.equal(result.value.conciseMode, true);
  assert.equal(result.value.avoidEmojis, false);
});

test('validateGenerateRepliesRequest rejects missing latestMessage and invalid language', () => {
  const missingLatest = validateGenerateRepliesRequest({
    conversation: 'Hello',
    latestMessage: '   ',
  });
  assert.equal(missingLatest.valid, false);

  const badLanguage = validateGenerateRepliesRequest({
    conversation: 'Hello',
    latestMessage: 'Hi',
    language: 'french',
  });
  assert.equal(badLanguage.valid, false);
});

test('generateContextAwareReplies parses structured Gemini output and maps rate limits', async () => {
  const fakeClient = buildFakeGeminiClient({
    outputText: JSON.stringify({
      replies: [
        {
          style: 'natural',
          text: 'Done scene hai, 8 baje milte hain.',
          reason: 'Confirms the plan casually in Roman Urdu.',
        },
        {
          style: 'funny',
          text: '8 baje ya Pakistani 8 baje? 😅',
          reason: 'Adds light humor around timing.',
        },
        {
          style: 'friendly',
          text: 'Perfect! Looking forward to catching up at 8.',
          reason: 'Warmly confirms and keeps the mood upbeat.',
        },
      ],
    }),
  });

  const replies = await generateContextAwareReplies(
    {
      conversation: 'Ali: 8 baje chalte hain',
      latestMessage: '8 baje chalte hain',
      style: ['natural', 'funny', 'friendly'],
      language: 'mixed',
    },
    fakeClient
  );

  assert.equal(replies.length, 3);
  assert.equal(replies[0].style, 'natural');
  assert.equal(replies[1].style, 'funny');
  assert.equal(replies[2].style, 'friendly');

  const rateLimitError = new Error('Resource exhausted');
  rateLimitError.status = 429;

  await assert.rejects(
    () =>
      generateContextAwareReplies(
        {
          conversation: 'Ali: Hi',
          latestMessage: 'Hi',
          style: ['natural'],
          language: 'english',
        },
        buildFakeGeminiClient({ error: rateLimitError })
      ),
    (err) => err.statusCode === 429 && err.code === 'AI_RATE_LIMITED'
  );
});

test('generateContextAwareReplies sends a stateless, schema-constrained Gemini request', async () => {
  let capturedParams;
  const client = {
    interactions: {
      create: async (params) => {
        capturedParams = params;
        return {
          output_text: JSON.stringify({
            replies: [{ style: 'natural', text: 'Theek hai yaar.', reason: 'Casual confirmation.' }],
          }),
        };
      },
    },
  };

  await generateContextAwareReplies(
    {
      conversation: 'Ali: Kal milte hain?',
      latestMessage: 'Kal milte hain?',
      style: ['natural'],
      language: 'roman_urdu',
    },
    client
  );

  assert.equal(capturedParams.store, false);
  assert.ok(capturedParams.system_instruction.includes('ReplyMate AI'));
  assert.equal(capturedParams.response_format.type, 'text');
  assert.equal(capturedParams.response_format.mime_type, 'application/json');
  assert.deepEqual(capturedParams.response_format.schema.properties.replies.items.properties.style.enum, [
    'natural',
  ]);
  assert.equal(capturedParams.generation_config.max_output_tokens, 550);
});

test('generateContextAwareReplies maps invalid API key to auth error', async () => {
  const authError = new Error('400 API error occurred');
  authError.status = 400;
  authError.body = JSON.stringify({
    error: {
      status: 'INVALID_ARGUMENT',
      message: 'API key not valid. Please pass a valid API key.',
      details: [{ reason: 'API_KEY_INVALID' }],
    },
  });

  await assert.rejects(
    () =>
      generateContextAwareReplies(
        {
          conversation: 'Ali: Hi',
          latestMessage: 'Hi',
          style: ['natural'],
          language: 'english',
        },
        buildFakeGeminiClient({ error: authError })
      ),
    (err) => err.statusCode === 502 && err.code === 'AI_AUTH_ERROR'
  );
});

test('generateContextAwareReplies maps malformed output to a safe error', async () => {
  await assert.rejects(
    () =>
      generateContextAwareReplies(
        {
          conversation: 'Ali: Hi',
          latestMessage: 'Hi',
          style: ['natural'],
          language: 'english',
        },
        buildFakeGeminiClient({ outputText: 'not json' })
      ),
    (err) => err.statusCode === 502 && err.code === 'AI_INVALID_JSON'
  );
});

test('GET /api/health and POST /api/replies/generate work end-to-end', async () => {
  const app = createApp({
    replyGenerator: async ({ style }) =>
      style.map((item) => ({
        style: item,
        text: `Sample ${item} reply`,
        reason: `Reason for ${item}`,
      })),
  });

  await withServer(app, async (baseUrl) => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.ok, true);
    assert.equal(typeof healthJson.aiConfigured, 'boolean');

    const invalidRes = await fetch(`${baseUrl}/api/replies/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: '' }),
    });
    assert.equal(invalidRes.status, 400);

    const validRes = await fetch(`${baseUrl}/api/replies/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: 'Hamza: Kal free ho?',
        latestMessage: 'Kal free ho?',
        style: ['natural', 'funny', 'friendly'],
        language: 'mixed',
      }),
    });
    assert.equal(validRes.status, 200);
    const validJson = await validRes.json();
    assert.equal(validJson.success, true);
    assert.equal(validJson.replies.length, 3);
  });
});
