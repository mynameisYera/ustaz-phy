import { getEnv } from "./env.js";
import {
  generateGameWithGrok,
  getGrokConfigError,
  getGrokDisplayName,
  getGrokModelName,
  isGrokConfigured,
} from "./grok";
import { generateGameWithGemini, getGeminiApiKey, getGeminiModelName } from "./gemini";
import { generateGameWithOpenAi, getOpenAiApiKey, getOpenAiModelName } from "./openai";
import type { FixRequestInput } from "./prompts";

export type AiProvider = "grok" | "openai" | "gemini";

export function getAiProvider(): AiProvider {
  const provider = getEnv("AI_PROVIDER")?.toLowerCase();
  if (provider === "gemini") return "gemini";
  if (provider === "openai") return "openai";
  return "grok";
}

export function getActiveModelName(): string {
  const provider = getAiProvider();
  if (provider === "gemini") return getGeminiModelName();
  if (provider === "openai") return getOpenAiModelName();
  return `${getGrokDisplayName()} · ${getGrokModelName()}`;
}

export function isAiConfigured(): boolean {
  const provider = getAiProvider();
  if (provider === "gemini") return Boolean(getGeminiApiKey());
  if (provider === "openai") return Boolean(getOpenAiApiKey());
  return isGrokConfigured();
}

export function getAiConfigError(userApiKey?: string): string | null {
  const provider = getAiProvider();

  if (provider === "gemini") {
    if (getGeminiApiKey()) return null;
    return "GEMINI_API_KEY не задан → https://aistudio.google.com/app/apikey";
  }

  if (provider === "openai") {
    if (getOpenAiApiKey()) return null;
    const raw = getEnv("OPENAI_API_KEY");
    if (raw?.startsWith("key_")) {
      return "Вы вставили ID ключа (key_...). Нужен секрет sk-proj-... → https://platform.openai.com/api-keys";
    }
    return "OPENAI_API_KEY не задан → проверьте .env в корне проекта и перезапустите npm run dev";
  }

  return getGrokConfigError(userApiKey);
}

export async function generateGame(
  description: string,
  fixHistory: FixRequestInput[],
  userApiKey?: string
): Promise<string> {
  const provider = getAiProvider();
  if (provider === "gemini") return generateGameWithGemini(description, fixHistory);
  if (provider === "openai") return generateGameWithOpenAi(description, fixHistory);
  return generateGameWithGrok(description, fixHistory, userApiKey);
}
