import { getEnv } from "./env.js";
import { generateGameWithGemini, getGeminiApiKey, getGeminiModelName } from "./gemini";
import { generateGameWithOpenAi, getOpenAiApiKey, getOpenAiModelName } from "./openai";
import type { FixRequestInput } from "./prompts";

export type AiProvider = "openai" | "gemini";

export function getAiProvider(): AiProvider {
  const provider = getEnv("AI_PROVIDER")?.toLowerCase();
  if (provider === "gemini") return "gemini";
  return "openai";
}

export function getActiveModelName(): string {
  const provider = getAiProvider();
  if (provider === "gemini") return getGeminiModelName();
  return getOpenAiModelName();
}

export function isAiConfigured(): boolean {
  const provider = getAiProvider();
  if (provider === "gemini") return Boolean(getGeminiApiKey());
  return Boolean(getOpenAiApiKey());
}

export function getAiConfigError(): string | null {
  const provider = getAiProvider();

  if (provider === "gemini") {
    if (getGeminiApiKey()) return null;
    return "GEMINI_API_KEY не задан → https://aistudio.google.com/app/apikey";
  }

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
  const provider = getAiProvider();
  if (provider === "gemini") return generateGameWithGemini(description, fixHistory);
  return generateGameWithOpenAi(description, fixHistory);
}
