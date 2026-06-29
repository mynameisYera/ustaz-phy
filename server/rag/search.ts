import { getEnv } from "../env.js";
import { getOpenAiModelName } from "../openai.js";
import { getOpenAiClient } from "../openaiClient.js";
import { loadRagConfig } from "./config.js";
import { isWatermarkChunk, WATERMARK_ONLY_MESSAGE } from "./pdfAnalyze.js";
import { assertFilesReady, listVectorStoreFiles } from "./vectorStore.js";

const DEFAULT_RAG_MODEL = "gpt-4o-mini";

/** File Search үшін күрделірек модель — nano нашар нәтиже береді */
export function getRagModelName(): string {
  return getEnv("OPENAI_RAG_MODEL") || DEFAULT_RAG_MODEL;
}

export interface BookSearchHit {
  text: string;
  filename: string;
  score: number;
}

export async function searchBookChunks(
  query: string,
  maxResults = 20
): Promise<BookSearchHit[]> {
  const config = loadRagConfig();
  if (!config) {
    throw new Error("Vector Store жоқ — RAG Playground-та PDF жүктеңіз");
  }

  await assertFilesReady();

  const client = getOpenAiClient();
  const page = await client.vectorStores.search(config.vectorStoreId, {
    query,
    max_num_results: maxResults,
    rewrite_query: true,
  });

  const hits: BookSearchHit[] = [];
  for (const item of page.data) {
    for (const part of item.content) {
      const text = part.text?.trim();
      if (text && !isWatermarkChunk(text)) {
        hits.push({
          text,
          filename: item.filename,
          score: item.score,
        });
      }
    }
  }

  return hits;
}

export async function getFileChunkSample(fileId: string, limit = 5): Promise<string[]> {
  const config = loadRagConfig();
  if (!config) return [];

  const client = getOpenAiClient();
  const page = await client.vectorStores.files.content(config.vectorStoreId, fileId);

  return page.data
    .map((c) => c.text?.trim())
    .filter((t): t is string => Boolean(t))
    .slice(0, limit);
}

export async function getIndexingDiagnostics() {
  const files = await listVectorStoreFiles();
  const diagnostics = [];

  for (const file of files) {
    const sample = file.status === "completed" ? await getFileChunkSample(file.id, 3) : [];
    const realSample = sample.filter((s) => !isWatermarkChunk(s));
    diagnostics.push({
      ...file,
      chunkSample: sample,
      hasText: realSample.some((s) => s.length > 20),
      isWatermarkOnly: sample.length > 0 && realSample.length === 0,
    });
  }

  return diagnostics;
}

function buildContextBlock(hits: BookSearchHit[]): string {
  return hits
    .slice(0, 20)
    .map((h, i) => `[${i + 1}] (${h.filename}, score ${h.score.toFixed(2)})\n${h.text}`)
    .join("\n\n---\n\n");
}

export async function answerFromBooks(question: string): Promise<{
  answer: string;
  vectorStoreId: string;
  sources: BookSearchHit[];
}> {
  const config = loadRagConfig();
  if (!config) {
    throw new Error("Vector Store жоқ — RAG Playground-та PDF жүктеңіз");
  }

  const hits = await searchBookChunks(question, 25);

  if (hits.length === 0) {
    throw new Error(WATERMARK_ONLY_MESSAGE);
  }

  const context = buildContextBlock(hits);
  const filenames = [...new Set(hits.map((h) => h.filename))];

  const client = getOpenAiClient();
  const completion = await client.chat.completions.create({
    model: getRagModelName(),
    temperature: 0.2,
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `Сен мектеп оқулығы бойынша сұраққа жауап бересің.
Тек берілген үзінділерге сүйен. Қазақ тілінде жауап бер.
Үзінділерде нақты жауап бар болса — оны айт.
Жоқ болса — "Kitapta табылмады" деп қысқа жауап бер.`,
      },
      {
        role: "user",
        content: `Оқулық: ${filenames.join(", ")}\n\nҮзінділер:\n${context}\n\nСұрақ: ${question}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("ЖИ бос жауап қайтарды");
  }

  return {
    answer,
    vectorStoreId: config.vectorStoreId,
    sources: hits.slice(0, 5),
  };
}

/** Ойын генерациясы үшін kitap контексті */
export async function fetchBookContextForTopic(topic: string): Promise<string | null> {
  const config = loadRagConfig();
  if (!config) return null;

  try {
    await assertFilesReady();
  } catch {
    return null;
  }

  const hits = await searchBookChunks(topic, 15);
  if (hits.length === 0) return null;

  return buildContextBlock(hits);
}

export function getVectorStoreIdForRag(): string | null {
  return loadRagConfig()?.vectorStoreId ?? null;
}
