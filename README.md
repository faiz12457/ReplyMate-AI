# ReplyMate AI

**Never get stuck on what to reply.**  
ReplyMate AI is a privacy-first WhatsApp reply assistant built with **Expo (React Native)** and a **Node.js / Express + OpenAI** backend. Paste a WhatsApp conversation or import an exported `.txt` chat file to receive three context-aware reply options (**Natural**, **Funny**, and **Friendly**) tailored to the tone, language, and latest incoming message.

> **Privacy & Transparency:** ReplyMate AI **never** monitors WhatsApp automatically or reads live chats in the background. It only processes conversation text that you manually paste or import when you tap **Analyze Conversation**.

---

## Project Structure

```text
ReplyMateAI/
├── src/                        # Expo Router mobile app (TypeScript)
│   ├── app/                    # File-based screens (_layout, index, home, input, suggestions, settings)
│   ├── components/             # Reusable UI primitives (ui/) and chat components (chat/)
│   ├── constants/              # Design system tokens, colors, typography, spacing (theme.ts)
│   ├── hooks/                  # Theme, color-scheme, and Reanimated press-scale hooks
│   ├── services/               # Backend API client (replyApi.ts)
│   ├── types/                  # Shared domain TypeScript interfaces (replymate.ts)
│   └── utils/                  # WhatsApp chat parser, .txt file picker, AsyncStorage helpers
├── backend/                    # Node.js + Express + OpenAI API server (ES Modules)
│   ├── src/
│   │   ├── config/             # Environment variable loader (env.js)
│   │   ├── routes/             # POST /api/replies/generate route
│   │   ├── services/           # Context-aware OpenAI structured JSON service
│   │   ├── validators/         # Request payload validation
│   │   ├── app.js              # Express app, rate limiter, CORS, error handler
│   │   └── server.js           # HTTP server entrypoint
│   ├── tests/                  # Node unit & integration tests
│   └── .env.example            # Backend environment template
├── scripts/
│   └── test-whatsapp-parser.mjs
├── app.json                    # Expo SDK 58 configuration
└── package.json                # Mobile dependencies & scripts
```

---

## Getting Started (Windows + Android Emulator)

> **PowerShell note:** If Windows blocks `npx.ps1` with an execution policy error, use `npx.cmd` and `npm.cmd` in PowerShell.

### 1. Install Dependencies

Root (mobile app):
```powershell
npm.cmd install
```

Backend:
```powershell
npm.cmd install --prefix backend
```

### 2. Configure Backend Environment

1. Copy the example env file:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
2. Open `backend/.env` and add your OpenAI API key:
   ```env
   PORT=3001
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```
   *(Your API key stays strictly on the backend and is never bundled into the mobile app.)*

### 3. Run the Backend Server (Terminal 1)

```powershell
npm.cmd run dev --prefix backend
```

Verify it is running by visiting `http://localhost:3001/api/health` in your browser.

### 4. Run on Android Emulator (Terminal 2)

1. Open **Android Studio → Device Manager** and start your Android Emulator.
2. Start Expo:
   ```powershell
   npx.cmd expo start --android
   ```
   The mobile app automatically routes Android Emulator API calls to `http://10.0.2.2:3001` so it reaches your Windows backend out of the box.

*(To override the backend URL manually, create a `.env` file at the repo root with `EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:3001`.)*

---

## Testing on iPhone XS (from Windows)

You cannot run the local iOS Simulator on Windows (it requires macOS + Xcode), but you can test on your physical **iPhone XS**:

1. **Expo Go (fastest for development):**
   - Sign in to the same Expo account on both Windows (`npx.cmd expo login`) and the Expo Go app on your iPhone XS.
   - Connect both devices to the same Wi-Fi network and run `npx.cmd expo start` (or `npx.cmd expo start --tunnel` if your router blocks local traffic).
   - Scan the QR code with your iPhone Camera.
2. **Standalone Development Build (cloud build via Expo Build):**
   - Requires an active Apple Developer Program membership.
   - Run `npx.cmd eas-cli@latest build --platform ios --profile development` from Windows to build and install a dev client on your iPhone XS without a Mac.

---

## Future iOS Share Extension Architecture Plan

ReplyMate AI is structured so an **iOS Share Extension** can be added cleanly in a future native release without rewriting the core app:

1. **Shared Parsing & API Layer:** `src/utils/whatsappParser.ts` and `src/services/replyApi.ts` are pure, UI-independent modules.
2. **Deep-Link Entry Point:** Expo Router already registers the `replymateai://` URL scheme (`app.json`) and accepts prefill parameters on `/input` (`prefillText`, `mode`).
3. **Native iOS Requirements (Future Step):**
   - Requires an Apple Developer Program account and an iOS **Share Extension** target configured via an Expo Config Plugin (generated via `npx expo prebuild` / EAS Build).
   - Configure an **App Group** entitlement so the Share Extension can write exported WhatsApp `.txt` text into a shared container and open `replymateai://input?mode=import` via URL scheme.
   - Because Share Extensions only receive data when the user explicitly taps **Share → ReplyMate AI** inside WhatsApp, this preserves the app's privacy model and complies with Apple App Store guidelines.

---

## Backend API Reference

### `GET /api/health`
Returns server status and whether `OPENAI_API_KEY` is configured.

### `POST /api/replies/generate`
Generates context-aware reply options using structured JSON output.

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

**Response:**
```json
{
  "success": true,
  "replies": [
    {
      "style": "natural",
      "text": "...",
      "reason": "..."
    }
  ]
}
```

---

## Verification & Tests

```powershell
# Backend unit & Express integration tests
npm.cmd test --prefix backend

# WhatsApp chat parser tests
node --test scripts/test-whatsapp-parser.mjs

# TypeScript check, ESLint, and Expo health diagnostics
npx.cmd tsc --noEmit
npx.cmd expo lint
npx.cmd expo-doctor
```
