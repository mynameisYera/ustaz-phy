import { getEnv } from "./env.js";
import OpenAI from "openai";
import { buildUserPrompt, getSystemPrompt } from "./prompts.js";
import type { FixRequestInput, GameGenerationContext } from "./prompts.js";
import type { ServerAttachment } from "./handleGenerate.js";

const DEFAULT_MODEL = "gpt-4o";

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
  context: GameGenerationContext,
  fixHistory: FixRequestInput[],
  attachments: ServerAttachment[] = []
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

  // Build text for the user prompt, including any attached text files
  const textFiles = attachments.filter((a) => a.mimeType.startsWith("text/"));
  const imageFiles = attachments.filter((a) => a.mimeType.startsWith("image/"));

  let userText = buildUserPrompt(context, fixHistory);
  if (textFiles.length > 0) {
    const fileSection = textFiles
      .map((f) => {
        const content = Buffer.from(f.data, "base64").toString("utf-8");
        return `[Прикреплённый файл: ${f.name}]\n${content}`;
      })
      .join("\n\n");
    userText += `\n\nПрикреплённые материалы учителя:\n"""\n${fileSection}\n"""`;
  }

  // Build message content — array when images are present, plain string otherwise
  const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: "text", text: userText },
    ...imageFiles.map(
      (img): OpenAI.Chat.ChatCompletionContentPartImage => ({
        type: "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.data}` },
      })
    ),
  ];

  const completion = await client.chat.completions.create({
    model: getOpenAiModelName(),
    temperature: 1,
    max_completion_tokens: 16384,
    messages: [
      { role: "system", content: getSystemPrompt(context.outputFormat) },
      { role: "user", content: userContent },
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
