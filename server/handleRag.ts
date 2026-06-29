import {
  deleteVectorStoreFile,
  getOrCreateVectorStore,
  getVectorStoreStatus,
  uploadDocumentToVectorStore,
} from "./rag/vectorStore.js";
import { getIndexingDiagnostics, querySchoolBooks, searchBookChunks } from "./rag/query.js";

export async function handleRagStatus() {
  try {
    const status = await getVectorStoreStatus();
    if (!status.configured) {
      return { ok: true as const, configured: false };
    }

    const diagnostics = await getIndexingDiagnostics();
    const fileCounts = {
      in_progress: diagnostics.filter((f) => f.status === "in_progress").length,
      completed: diagnostics.filter((f) => f.status === "completed").length,
      failed: diagnostics.filter((f) => f.status === "failed").length,
      cancelled: diagnostics.filter((f) => f.status === "cancelled").length,
      total: diagnostics.length,
    };

    return { ok: true as const, ...status, fileCounts, files: diagnostics };
  } catch (e) {
    const message = e instanceof Error ? e.message : "RAG статус қатесі";
    return { ok: false as const, status: 502, error: message };
  }
}

export async function handleRagCreateStore(body: { name?: string }) {
  try {
    const config = await getOrCreateVectorStore(body.name?.trim() || undefined);
    return { ok: true as const, ...config };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Vector Store қатесі";
    return { ok: false as const, status: 502, error: message };
  }
}

export async function handleRagUpload(file: { buffer: Buffer; originalname: string; mimetype: string } | undefined) {
  if (!file) {
    return { ok: false as const, status: 400, error: "Файл жоқ" };
  }

  const name = file.originalname.toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || name.endsWith(".pdf");
  const isTxt =
    file.mimetype === "text/plain" ||
    file.mimetype === "text/markdown" ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".ocr.txt");

  if (!isPdf && !isTxt) {
    return { ok: false as const, status: 400, error: "Тек PDF, MD немесе TXT (OCR) қабылданады" };
  }

  try {
    const mimeType = isPdf
      ? "application/pdf"
      : name.endsWith(".md")
        ? "text/markdown"
        : "text/plain";
    const uploaded = await uploadDocumentToVectorStore(file.buffer, file.originalname, mimeType);
    return { ok: true as const, file: uploaded };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Файл жүктеу қатесі";
    return { ok: false as const, status: 502, error: message };
  }
}

export async function handleRagDeleteFile(fileId: string) {
  if (!fileId?.trim()) {
    return { ok: false as const, status: 400, error: "fileId міндетті" };
  }

  try {
    await deleteVectorStoreFile(fileId.trim());
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Файлды жою қатесі";
    return { ok: false as const, status: 502, error: message };
  }
}

export async function handleRagQuery(body: { question?: string }) {
  const question = body.question?.trim();
  if (!question) {
    return { ok: false as const, status: 400, error: "Сұрақ міндетті" };
  }

  try {
    const result = await querySchoolBooks(question);
    return {
      ok: true as const,
      answer: result.answer,
      vectorStoreId: result.vectorStoreId,
      sources: result.sources?.map((s) => ({
        filename: s.filename,
        score: s.score,
        preview: s.text.slice(0, 200),
      })),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "File Search қатесі";
    return { ok: false as const, status: 502, error: message };
  }
}

export async function handleRagDebugSearch(body: { question?: string }) {
  const question = body.question?.trim();
  if (!question) {
    return { ok: false as const, status: 400, error: "Сұрақ міндетті" };
  }

  try {
    const hits = await searchBookChunks(question, 10);
    return {
      ok: true as const,
      count: hits.length,
      hits: hits.map((h) => ({
        filename: h.filename,
        score: h.score,
        text: h.text.slice(0, 400),
      })),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Іздеу қатесі";
    return { ok: false as const, status: 502, error: message };
  }
}
