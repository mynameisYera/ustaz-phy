import { getEnv } from "./env.js";
import { generateGameWithOpenAi, getOpenAiApiKey, getOpenAiModelName } from "./openai.js";
import type { FixRequestInput } from "./prompts.js";
import type { ServerAttachment } from "./handleGenerate.js";

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
    return "Сіз кілт идентификаторын (key_...) енгіздіңіз. sk-proj-... секреті керек → https://platform.openai.com/api-keys";
  }
  return "OPENAI_API_KEY көрсетілмеген → жоба түбіндегі .env тексеріп, npm run dev қайта іске қосыңыз";
}

export async function generateGame(
  description: string,
  fixHistory: FixRequestInput[],
  attachments: ServerAttachment[] = []
): Promise<string> {
  return generateGameWithOpenAi(description, fixHistory, attachments);
}
