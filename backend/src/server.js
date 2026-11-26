import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`ReplyMate AI backend listening on http://localhost:${config.port}`);
  if (!config.openaiApiKey) {
    console.warn('Warning: OPENAI_API_KEY is not set. Add it to backend/.env to generate replies.');
  }
});
