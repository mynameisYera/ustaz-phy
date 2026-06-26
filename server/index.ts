import { createApiApp, isAiConfigured } from "./app";

const port = Number(process.env.PORT) || 3001;

createApiApp().listen(port, () => {
  console.log(`Game AI server → http://localhost:${port}`);
  if (!isAiConfigured()) {
    console.warn("⚠ AI ключ не задан — см. .env");
  }
});
