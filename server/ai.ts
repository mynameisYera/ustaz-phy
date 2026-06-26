import { getEnv } from "./env.js";
import { generateGameWithOpenAi, getOpenAiApiKey, getOpenAiModelName } from "./openai.js";
import type { FixRequestInput } from "./prompts.js";

export type AiProvider = "openai";

export function getAiProvider(): AiProvider {
  return "openai";
}

export function getActiveModelName(): string {
  return getOpenAiModelName();
}

export function isAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

export function getAiConfigError(): string | null {
  if (getOpenAiApiKey()) return null;

  const raw = getEnv("OPENAI_API_KEY");
  if (raw?.startsWith("key_")) {
    return "Вы вставили ID ключа (key_...). Нужен секрет sk-proj-... → https://platform.openai.com/api-keys";
  }
  return "OPENAI_API_KEY не задан → проверьте .env в корне проекта и перезапустите npm run dev";
}

export async function generateGame(
  description: string,
  fixHistory: FixRequestInput[]
): Promise<string> {
  return generateGameWithOpenAi(description, fixHistory);
}
