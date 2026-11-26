# Privacy Policy — ReplyMate AI

_Last updated: 26 November 2026_

ReplyMate AI is a WhatsApp reply assistant. This policy explains what data the app handles and where it goes.

## What stays on your device

- The conversation text you paste or import
- Your active draft and recent conversation history (last 12 entries)
- Your preferences (reply styles, language, concise mode, emoji preference)

These are stored locally using AsyncStorage. You can delete them at any time from **Preferences → Local Storage & History**.

## What leaves your device

ReplyMate AI **does not** monitor WhatsApp, read chats in the background, or access your WhatsApp account. Data is sent only when you tap **Analyze Conversation**.

At that point, the conversation text and your latest incoming message are sent over HTTPS to the ReplyMate AI backend, which forwards them to the **Google Gemini API** to generate reply suggestions.

- Requests are sent with `store: false`, so the Gemini Interactions API does not retain the request or response on Google's servers.
- The ReplyMate AI backend does not write conversation content to a database, and its request logs contain only method, path, status, and duration.
- Google's handling of API data is described in the [Google Privacy Policy](https://policies.google.com/privacy) and the [Gemini API terms](https://ai.google.dev/gemini-api/terms).

## What we do not collect

- No account, name, email, or phone number
- No contacts or address book access
- No analytics or advertising identifiers
- No background chat monitoring

## Security

- The Gemini API key is stored only on the backend (Render environment variables), never in the mobile app bundle.
- All production traffic uses HTTPS.
- The public generation endpoint is rate-limited per IP address.

## Children

ReplyMate AI is not directed at children under 13.

## Changes

Material changes to this policy will be reflected in this file and in the app's repository history.

## Contact

Open an issue at the project's GitHub repository for privacy questions.
