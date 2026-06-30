import { getEnv } from "./env.js";
import OpenAI from "openai";
import { getOpenAiApiKey, getOpenAiModelName, isOpenAiKeyFormatValid } from "./openai.js";

const MAX_PAGES = 5;

export async function extractTextFromScannedPages(pageImages: string[]): Promise<string> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey || !isOpenAiKeyFormatValid(apiKey)) {
    throw new Error("OPENAI_API_KEY көрсетілмеген");
  }

  const images = pageImages.slice(0, MAX_PAGES).map((dataUrl) => ({
    type: "image_url" as const,
    image_url: { url: dataUrl, detail: "high" as const },
  }));

  const client = new OpenAI({
    apiKey,
    baseURL: getEnv("OPENAI_BASE_URL"),
  });

  const completion = await client.chat.completions.create({
    model: getOpenAiModelName(),
    temperature: 0.2,
    max_completion_tokens: 10000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Бұл сканерленген оқулық/материал беттері. Барлық мәтінді оқы да қазақша немесе орысша қайта жазы. " +
              "Формулалар, атаулар, анықтамалар, мысалдар сақталсын. Тек мәтін қайтар, HTML жоқ.",
          },
          ...images,
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("PDF материалынан мәтін оқу мүмкін болмады");
  }

  return text;
}
