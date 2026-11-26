import assert from 'node:assert/strict';
import test from 'node:test';

import { parseWhatsAppConversation } from '../src/utils/whatsappParser.ts';

test('parses iOS bracketed WhatsApp export with system notice, media placeholder, and multiline message', () => {
  const input = `\u200E[26/11/2026, 9:00:01 AM] Messages and calls are end-to-end encrypted.
[26/11/2026, 9:05:12 AM] Hamza: Assalam o Alaikum!
Kal university aa rahe ho?
[26/11/2026, 9:06:00 AM] Me: Walaikum Assalam, haan inshallah
[26/11/2026, 9:07:30 AM] Hamza: <Media omitted>
[26/11/2026, 9:08:10 AM] Hamza: Notes bhi le aana please`;

  const result = parseWhatsAppConversation(input);

  assert.equal(result.formatDetected, 'whatsapp_export');
  assert.deepEqual(result.participants, ['Hamza', 'Me']);
  assert.equal(result.latestIncomingSender, 'Hamza');
  assert.equal(result.latestIncomingMessage, 'Notes bhi le aana please');
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /Skipped 1 media placeholder/);
  assert.ok(result.formattedHistory.includes('Hamza: Assalam o Alaikum!\nKal university aa rahe ho?'));
});

test('parses Android dash WhatsApp export and skips own trailing message when selecting incoming', () => {
  const input = `26/11/2026, 10:15 pm - Sara: Hey, are we still meeting at 5?
26/11/2026, 10:16 pm - Me: Yes, let me check traffic first`;

  const result = parseWhatsAppConversation(input);

  assert.equal(result.formatDetected, 'whatsapp_export');
  assert.equal(result.latestIncomingSender, 'Sara');
  assert.equal(result.latestIncomingMessage, 'Hey, are we still meeting at 5?');
});

test('parses labeled pasted conversation without timestamps', () => {
  const input = `Ali: Bhai lunch ka kya plan hai?
Me: Jo tum bolo
Ali: Biryani order kar lein?`;

  const result = parseWhatsAppConversation(input);

  assert.equal(result.formatDetected, 'labeled_chat');
  assert.equal(result.messages.length, 3);
  assert.equal(result.latestIncomingSender, 'Ali');
  assert.equal(result.latestIncomingMessage, 'Biryani order kar lein?');
});

test('parses plain pasted single message', () => {
  const result = parseWhatsAppConversation('Bhai kahan pohanche ho?');

  assert.equal(result.formatDetected, 'plain_text');
  assert.equal(result.messages.length, 1);
  assert.equal(result.latestIncomingMessage, 'Bhai kahan pohanche ho?');
});

test('handles empty and binary malformed input gracefully', () => {
  const emptyResult = parseWhatsAppConversation('   \n  ');
  assert.equal(emptyResult.messages.length, 0);
  assert.equal(emptyResult.latestIncomingMessage, '');

  const binaryResult = parseWhatsAppConversation('abc\u0000def');
  assert.equal(binaryResult.messages.length, 0);
  assert.equal(binaryResult.warnings.length, 1);
  assert.match(binaryResult.warnings[0], /plain UTF-8 text/i);
});
