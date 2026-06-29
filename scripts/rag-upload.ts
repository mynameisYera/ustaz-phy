#!/usr/bin/env tsx
/**
 * CLI: PDF жүктеу OpenAI Vector Store-ға
 * Пример: npx tsx scripts/rag-upload.ts ./books/physics8.pdf
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "../server/env.js";
import { uploadDocumentToVectorStore, getOrCreateVectorStore } from "../server/rag/vectorStore.js";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Пайдалану: npx tsx scripts/rag-upload.ts <path-to.pdf>");
    process.exit(1);
  }

  const abs = resolve(filePath);
  const buffer = readFileSync(abs);
  const filename = abs.split("/").pop() ?? "book.pdf";
  const lower = filename.toLowerCase();
  const mimeType = lower.endsWith(".txt") ? "text/plain" : "application/pdf";

  const store = await getOrCreateVectorStore();
  console.log(`Vector Store: ${store.vectorStoreId}`);

  const uploaded = await uploadDocumentToVectorStore(buffer, filename, mimeType);
  console.log(`Жүктелді: ${uploaded.filename} (${uploaded.status})`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
