import { createApiApp, isAiConfigured } from "./app";

const port = Number(process.env.PORT) || 3001;

createApiApp().listen(port, () => {
  console.log(`Game AI server → http://localhost:${port}`);
  if (!isAiConfigured()) {
    console.log("ℹ Задайте OPENAI_API_KEY в .env и перезапустите сервер");
  }
});
