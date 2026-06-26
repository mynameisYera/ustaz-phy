import { getEnv } from "./env.js";
import OpenAI from "openai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts.js";
import type { FixRequestInput } from "./prompts.js";

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
        "Сіз кілт идентификаторын (key_...) енгіздіңіз, ал sk-proj-... секреті керек. " +
          "https://platform.openai.com/api-keys ашыңыз"
      );
    }
    throw new Error("OPENAI_API_KEY көрсетілмеген");
  }

  if (!isOpenAiKeyFormatValid(apiKey)) {
    throw new Error(
      "OPENAI_API_KEY форматы дұрыс емес. Кілт sk-proj- немесе sk- басталады"
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: getEnv("OPENAI_BASE_URL"),
  });

  const completion = await client.chat.completions.create({
    model: getOpenAiModelName(),
    temperature: 0.7,
    max_completion_tokens: 16384,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(description, fixHistory) },
    ],
  });

  const choice = completion.choices[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error("ChatGPT бос жауап қайтарды");
  }

  if (choice.finish_reason === "length") {
    throw new Error(
      "ЖИ жауабы токен лимитіне жетті — ойын жартылай жасалды. Қайта көріңіз немесе сипаттаманы қысқартыңыз."
    );
  }

  return content;
}
