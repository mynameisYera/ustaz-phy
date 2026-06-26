import { getEnv } from "./env.js";
import OpenAI from "openai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import type { FixRequestInput } from "./prompts";

const DEFAULT_MODEL = "gpt-4o-mini";

export function getOpenAiModelName(): string {
  return getEnv("OPENAI_MODEL") || DEFAULT_MODEL;
}

export function getOpenAiApiKey(): string | undefined {
  const key = getEnv("OPENAI_API_KEY");
  if (!key) return undefined;
  if (key.startsWith("key_")) return undefined;
  return key;
}

export function isOpenAiKeyFormatValid(key: string): boolean {
  return /^sk-(proj|svcacct)-/.test(key) || /^sk-[A-Za-z0-9_-]{20,}$/.test(key);
}

export async function generateGameWithOpenAi(
  description: string,
  fixHistory: FixRequestInput[]
): Promise<string> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    const raw = getEnv("OPENAI_API_KEY");
    if (raw?.startsWith("key_")) {
      throw new Error(
        "Вы вставили ID ключа (key_...), а нужен секрет (sk-proj-...). " +
          "Откройте https://platform.openai.com/api-keys"
      );
    }
    throw new Error("OPENAI_API_KEY не задан");
  }

  if (!isOpenAiKeyFormatValid(apiKey)) {
    throw new Error(
      "Неверный формат OPENAI_API_KEY. Ключ начинается с sk-proj- или sk-"
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: getEnv("OPENAI_BASE_URL"),
  });

  const completion = await client.chat.completions.create({
    model: getOpenAiModelName(),
    temperature: 0.7,
    max_tokens: 12000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(description, fixHistory) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("ChatGPT вернул пустой ответ");
  }

  return content;
}
