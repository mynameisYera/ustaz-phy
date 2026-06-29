import { toFile } from "openai";
import { getOpenAiClient } from "../openaiClient.js";
import { clearRagConfig, loadRagConfig, saveRagConfig, type RagConfig } from "./config.js";
import { analyzePdfBuffer, isWatermarkChunk, WATERMARK_ONLY_MESSAGE } from "./pdfAnalyze.js";

const DEFAULT_STORE_NAME = "Mektep kitaptary";

export interface RagFileInfo {
  id: string;
  filename: string;
  status: string;
  bytes: number;
  createdAt: number;
  lastError?: string;
}

export async function getOrCreateVectorStore(name = DEFAULT_STORE_NAME): Promise<RagConfig> {
  const existing = loadRagConfig();
  if (existing) {
    const client = getOpenAiClient();
    try {
      await client.vectorStores.retrieve(existing.vectorStoreId);
      return existing;
    } catch {
      clearRagConfig();
    }
  }

  const client = getOpenAiClient();
  const store = await client.vectorStores.create({ name });

  const config: RagConfig = {
    vectorStoreId: store.id,
    name,
    createdAt: new Date().toISOString(),
  };
  saveRagConfig(config);
  return config;
}

export async function getVectorStoreStatus() {
  const config = loadRagConfig();
  if (!config) {
    return { configured: false as const };
  }

  const client = getOpenAiClient();
  const store = await client.vectorStores.retrieve(config.vectorStoreId);

  return {
    configured: true as const,
    vectorStoreId: config.vectorStoreId,
    name: config.name,
    createdAt: config.createdAt,
    fileCounts: store.file_counts,
    status: store.status,
  };
}

async function listAllVectorStoreFileEntries(vectorStoreId: string) {
  const client = getOpenAiClient();
  const entries = [];
  let after: string | undefined;

  while (true) {
    const page = await client.vectorStores.files.list(vectorStoreId, after ? { after } : undefined);
    entries.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    after = page.data.at(-1)?.id;
  }

  return entries;
}

export async function listVectorStoreFiles(): Promise<RagFileInfo[]> {
  const config = loadRagConfig();
  if (!config) return [];

  const client = getOpenAiClient();
  const files: RagFileInfo[] = [];

  for (const item of await listAllVectorStoreFileEntries(config.vectorStoreId)) {
    let filename = item.id;
    try {
      const meta = await client.files.retrieve(item.id);
      filename = meta.filename;
    } catch {
      // OpenAI list sometimes keeps ghost entries after delete — skip them.
      continue;
    }

    files.push({
      id: item.id,
      filename,
      status: item.status,
      bytes: item.usage_bytes ?? 0,
      createdAt: item.created_at,
      lastError: item.last_error?.message,
    });
  }

  return files;
}

function chunkHasRealContent(texts: string[]): boolean {
  const meaningful = texts.filter((t) => !isWatermarkChunk(t));
  return meaningful.some((t) => t.length > 40);
}

export async function uploadDocumentToVectorStore(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<RagFileInfo & { chunkCount?: number; hasText?: boolean; isWatermarkOnly?: boolean }> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const analysis = await analyzePdfBuffer(buffer);
    if (analysis.isWatermarkOnly) {
      throw new Error(WATERMARK_ONLY_MESSAGE);
    }
  }

  const config = await getOrCreateVectorStore();
  const client = getOpenAiClient();

  const file = await toFile(buffer, filename, { type: mimeType });
  const attached = await client.vectorStores.files.uploadAndPoll(
    config.vectorStoreId,
    file,
    { pollIntervalMs: 2000 }
  );

  if (attached.status === "failed") {
    throw new Error(
      attached.last_error?.message ??
        "Файл индексация сәтсіз. Сканерленген PDF болуы мүмкін — OCR (.txt) қолданыңыз."
    );
  }

  if (attached.status !== "completed") {
    throw new Error("Файл әлі өңделуде — 1-2 минут күтіп, «Жаңарту» батырмасын басыңыз");
  }

  const contentPage = await client.vectorStores.files.content(
    config.vectorStoreId,
    attached.id
  );
  const texts = contentPage.data.map((c) => c.text?.trim()).filter(Boolean) as string[];
  const hasText = chunkHasRealContent(texts);
  const isWatermarkOnly = texts.length > 0 && !hasText;

  if (texts.length === 0 || isWatermarkOnly) {
    await client.vectorStores.files.del(config.vectorStoreId, attached.id);
    throw new Error(WATERMARK_ONLY_MESSAGE);
  }

  return {
    id: attached.id,
    filename,
    status: attached.status,
    bytes: attached.usage_bytes ?? buffer.length,
    createdAt: attached.created_at,
    lastError: attached.last_error?.message,
    chunkCount: texts.length,
    hasText,
    isWatermarkOnly: false,
  };
}

export async function uploadPdfToVectorStore(
  buffer: Buffer,
  filename: string
): Promise<RagFileInfo & { chunkCount?: number; hasText?: boolean; isWatermarkOnly?: boolean }> {
  return uploadDocumentToVectorStore(buffer, filename, "application/pdf");
}

export async function uploadTextToVectorStore(
  buffer: Buffer,
  filename: string
): Promise<RagFileInfo & { chunkCount?: number; hasText?: boolean }> {
  return uploadDocumentToVectorStore(buffer, filename, "text/plain");
}

export async function assertFilesReady(): Promise<void> {
  const files = await listVectorStoreFiles();

  if (files.length === 0) {
    throw new Error("PDF жүктелмеген — алдымен kitap жүктеңіз");
  }

  const inProgress = files.filter((f) => f.status === "in_progress");
  if (inProgress.length > 0) {
    throw new Error(
      `${inProgress.length} файл әлі өңделуде — 1-2 минут күтіңіз (${inProgress.map((f) => f.filename).join(", ")})`
    );
  }

  const failed = files.filter((f) => f.status === "failed");
  if (failed.length > 0 && files.every((f) => f.status === "failed")) {
    throw new Error(
      `Барлық файл индексациядан өтпedi: ${failed.map((f) => f.lastError ?? f.filename).join("; ")}`
    );
  }

  const completed = files.filter((f) => f.status === "completed");
  if (completed.length === 0) {
    throw new Error("Дайын файл жоқ — PDF индексацияны тексеріңіз");
  }
}

function isOpenAiNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404
  );
}

export async function deleteVectorStoreFile(fileId: string): Promise<void> {
  const config = loadRagConfig();
  if (!config) {
    throw new Error("Vector Store жасалмаған");
  }

  const client = getOpenAiClient();

  try {
    await client.vectorStores.files.del(config.vectorStoreId, fileId);
  } catch (error) {
    if (!isOpenAiNotFoundError(error)) throw error;
  }

  try {
    await client.files.del(fileId);
  } catch (error) {
    if (!isOpenAiNotFoundError(error)) throw error;
  }
}
