import { getEnv } from "./env.js";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts.js";
import type { FixRequestInput } from "./prompts.js";
import { getOpenAiClient } from "./openaiClient.js";
import { fetchBookContextForTopic } from "./rag/query.js";

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

export interface GenerateGameOptions {
  useRag?: boolean;
}

async function generateGameWithFileSearch(
  description: string,
  fixHistory: FixRequestInput[]
): Promise<string> {
  const bookContext = await fetchBookContextForTopic(description);
  if (!bookContext) {
    throw new Error(
      "Kitaptan контекст табылмады. RAG Playground-та PDF дайын екенін тексеріңіз (status: completed)."
    );
  }

  const client = getOpenAiClient();
  const userPrompt = `${buildUserPrompt(description, fixHistory)}

Мектеп оқулығынан үзінділер (ойын осы материалға сәйкес болуы керек):
"""
${bookContext}
"""`;

  const completion = await client.chat.completions.create({
    model: getOpenAiModelName(),
    temperature: 0.7,
    max_completion_tokens: 16384,
    messages: [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\nОйын тек жоғарыдағы оқулық үзінділеріне сүйеніп жасалуы керек.`,
      },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("ЖИ бос жауап қайтарды");
  }

  if (completion.choices[0]?.finish_reason === "length") {
    throw new Error(
      "ЖИ жауабы токен лимитіне жетті — ойын жартылай жасалды. Қайта көріңіз."
    );
  }

  return content;
}

export async function generateGameWithOpenAi(
  description: string,
  fixHistory: FixRequestInput[],
  options: GenerateGameOptions = {}
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

  if (options.useRag) {
    return generateGameWithFileSearch(description, fixHistory);
  }

  const client = getOpenAiClient();

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
