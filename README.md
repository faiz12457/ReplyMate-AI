# ReplyMate AI

**Never get stuck on what to reply.**

ReplyMate AI is a privacy-first WhatsApp reply assistant built with **Expo (React Native)** and a **Node.js / Express + Google Gemini** backend. Paste a WhatsApp conversation or import an exported `.txt` chat file to receive three context-aware reply options (**Natural**, **Funny**, and **Friendly**) tailored to the tone, language, and latest incoming message.

> **Privacy & Transparency:** ReplyMate AI **never** monitors WhatsApp automatically or reads live chats in the background. It only processes conversation text that you manually paste or import when you tap **Analyze Conversation**. See [PRIVACY.md](PRIVACY.md).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 58, React Native 0.88, React 19, TypeScript (strict), Expo Router |
| State/storage | React hooks + AsyncStorage (local only) |
| Backend | Node.js 20+, Express 4, ES Modules |
| AI | Google Gemini via [`@google/genai`](https://www.npmjs.com/package/@google/genai) Interactions API |
| Default model | `gemini-3.5-flash-lite` (override with `GEMINI_MODEL`) |
| Hosting | Render (free tier) |

---

## Project Structure

```text
ReplyMateAI/
├── src/                        # Expo Router mobile app (TypeScript)
│   ├── app/                    # Screens: _layout, index, home, input, suggestions, settings
│   ├── components/             # ui/ primitives and chat/ components
│   ├── constants/              # Design tokens (theme.ts)
│   ├── hooks/                  # Theme, color-scheme, press-scale hooks
│   ├── services/               # Backend API client (replyApi.ts)
│   ├── types/                  # Shared domain TypeScript interfaces
│   └── utils/                  # WhatsApp parser, .txt picker, AsyncStorage helpers
├── backend/                    # Node.js + Express + Gemini API server
│   ├── src/
│   │   ├── config/             # Environment loader (env.js)
│   │   ├── routes/             # POST /api/replies/generate
│   │   ├── services/           # Gemini structured-output service
│   │   ├── validators/         # Request payload validation
│   │   ├── app.js              # Express app, rate limiter, CORS, error handler
│   │   └── server.js           # HTTP server entrypoint
│   ├── tests/                  # node:test unit & integration tests
│   ├── .env.example            # Backend environment template
│   └── .nvmrc                  # Node 22 for local/Render parity
├── .github/workflows/ci.yml    # Backend tests + typecheck + lint
├── render.yaml                 # Render Blueprint (backend)
├── eas.json                    # EAS build profiles
├── PRIVACY.md                  # Data-handling policy
├── app.json                    # Expo SDK 58 configuration
└── package.json                # Mobile dependencies & scripts
```

---

## Getting Started (Windows + Android Emulator)

> **PowerShell note:** If Windows blocks `npx.ps1` with an execution policy error, use `npx.cmd` and `npm.cmd`.

### 1. Install dependencies

```powershell
npm.cmd install
npm.cmd install --prefix backend
```

### 2. Configure the backend

1. Copy the template:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
2. Create a Gemini API key at <https://aistudio.google.com/apikey> and add it:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```
   The key stays strictly on the backend and is never bundled into the mobile app.

### 3. Run the backend (Terminal 1)

```powershell
npm.cmd run dev --prefix backend
```

Verify: <http://localhost:3001/api/health> → `{ "ok": true, "aiConfigured": true, ... }`

### 4. Run the app (Terminal 2)

```powershell
npx.cmd expo start --android
```

The app automatically routes Android Emulator calls to `http://10.0.2.2:3001`.

To override the backend URL, create a root `.env`:

```env
EXPO_PUBLIC_API_URL=https://your-service.onrender.com
```

> `EXPO_PUBLIC_*` values are inlined at bundle time. Restart Expo with `npx expo start --clear` after changing them, and rebuild standalone apps.

---

## Deploying the Backend to Render

The repo includes a [`render.yaml`](render.yaml) Blueprint.

### Option A — Blueprint (recommended)

1. Push the repository to GitHub.
2. In Render: **New → Blueprint**, select the repo, and apply.
3. When prompted, set `GEMINI_API_KEY` (it is marked `sync: false`, so it is never stored in git).
4. Wait for the deploy and confirm:
   ```text
   https://<your-service>.onrender.com/api/health
   ```

### Option B — Manual Web Service

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Environment | `NODE_ENV=production`, `GEMINI_API_KEY=...`, `GEMINI_MODEL=gemini-3.5-flash-lite` |

### Free-tier notes

- Services sleep after ~15 minutes of inactivity. The first request can take 30–60 seconds.
- The mobile client timeout is set to **45 seconds** to absorb cold starts.
- Render injects `PORT`; the backend reads it automatically.
- `app.set('trust proxy', 1)` is enabled so per-IP rate limiting sees the real client IP.
- Google Cloud budget alerts are recommended; the generation endpoint is public and rate-limited, not authenticated.

---

## Connecting the Mobile App

1. Create a root `.env`:
   ```env
   EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com
   ```
2. Restart Metro with a clean cache:
   ```powershell
   npx.cmd expo start --clear
   ```
3. For EAS builds, set the same variable in the EAS environment (or your `eas.json` profile env) before building:
   ```powershell
   npx.cmd eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://<your-service>.onrender.com --environment production
   ```

Use `https://` — iOS App Transport Security blocks plain HTTP outside localhost.

---

## Backend API Reference

### `GET /api/health`

```json
{
  "ok": true,
  "service": "replymate-backend",
  "aiConfigured": true
}
```

### `POST /api/replies/generate`

Generates context-aware reply options using Gemini structured JSON output.

**Request:**

```json
{
  "conversation": "Hamza: Kal ka kya scene hai?\nMe: Shaam ko batata hun",
  "latestMessage": "Jaldi bata dena yaar, warna sab plan cancel kar denge",
  "style": ["natural", "funny", "friendly"],
  "language": "mixed",
  "conciseMode": true,
  "avoidEmojis": false
}
```

| Field | Required | Notes |
|---|---|---|
| `conversation` | yes | ≤ 12,000 characters |
| `latestMessage` | yes | ≤ 2,000 characters |
| `style` | no | Subset of `natural`, `funny`, `friendly` (default: all three) |
| `language` | no | `urdu`, `roman_urdu`, `english`, `mixed` (default: `mixed`) |
| `previousReply` | no | ≤ 1,000 characters; asks for a fresh alternative |
| `conciseMode` | no | Boolean, default `true` |
| `avoidEmojis` | no | Boolean, default `false` |

**Response:**

```json
{
  "success": true,
  "replies": [
    { "style": "natural", "text": "...", "reason": "..." }
  ]
}
```

**Errors:** `{ "success": false, "error": "...", "code": "..." }` with codes such as `VALIDATION_ERROR`, `AI_NOT_CONFIGURED`, `AI_AUTH_ERROR`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_UPSTREAM_ERROR`.

The endpoint is rate-limited to 30 requests per minute per IP and accepts bodies up to 64 KB.

---

## Environment Variables

### Backend (`backend/.env` / Render)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port (Render sets this automatically) |
| `NODE_ENV` | `development` | Use `production` on Render |
| `GEMINI_API_KEY` | — | **Secret.** Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Gemini model ID |
| `AI_TIMEOUT_MS` | `20000` | Upstream request timeout |
| `ALLOWED_ORIGINS` | empty | Comma-separated CORS allowlist for web builds |

### Mobile (root `.env`)

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | auto-detected | Deployed backend base URL |

---

## Verification & Tests

```powershell
# Backend unit & integration tests (no network required)
npm.cmd test --prefix backend

# WhatsApp chat parser tests
node --test scripts/test-whatsapp-parser.mjs

# TypeScript check, ESLint, Expo diagnostics
npx.cmd tsc --noEmit
npx.cmd expo lint
npx.cmd expo-doctor
```

---

## Testing on iPhone (from Windows)

- **Expo Go:** sign in on Windows and in Expo Go, use the same Wi-Fi, then scan the QR code from `npx expo start` (use `--tunnel` if LAN traffic is blocked).
- **Development build:** requires an Apple Developer Program membership. Run `npx eas-cli@latest build --platform ios --profile development`.

---

## Future iOS Share Extension

The parsing and API layers (`src/utils/whatsappParser.ts`, `src/services/replyApi.ts`) are UI-independent, and Expo Router already registers the `replymateai://` scheme. A future Share Extension can write shared text into an App Group container and open `replymateai://input?mode=import`, preserving the manual-share privacy model.

---

## License

MIT — see [LICENSE](LICENSE).
