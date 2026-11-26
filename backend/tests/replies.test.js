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

test('generateContextAwareReplies parses structured OpenAI output and maps rate limits', async () => {
  const fakeClient = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
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
              },
            },
          ],
        }),
      },
    },
  };

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

  const rateLimitedClient = {
    chat: {
      completions: {
        create: async () => {
          const err = new Error('Rate limit');
          err.status = 429;
          throw err;
        },
      },
    },
  };

  await assert.rejects(
    () =>
      generateContextAwareReplies(
        {
          conversation: 'Ali: Hi',
          latestMessage: 'Hi',
          style: ['natural'],
          language: 'english',
        },
        rateLimitedClient
      ),
    (err) => err.statusCode === 429 && err.code === 'AI_RATE_LIMITED'
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
