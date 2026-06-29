#!/usr/bin/env tsx
/**
 * data/books/*.md файлдарын Vector Store-ға жүктеу
 *
 * npm run rag:index
 * npm run rag:index -- data/books
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import "../server/env.js";
import { getOrCreateVectorStore, uploadDocumentToVectorStore } from "../server/rag/vectorStore.js";

async function main() {
  const dir = resolve(process.argv[2] ?? "data/books");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".txt"))
    .sort();

  if (files.length === 0) {
    console.error(`${dir} ішінде .md/.txt жоқ. Алдымен rag:ocr іске қосыңыз.`);
    process.exit(1);
  }

  const store = await getOrCreateVectorStore();
  console.log(`Vector Store: ${store.vectorStoreId}\n`);

  for (const file of files) {
    const path = join(dir, file);
    const buffer = readFileSync(path);
    const mimeType = file.endsWith(".md") ? "text/markdown" : "text/plain";

    try {
      const uploaded = await uploadDocumentToVectorStore(buffer, file, mimeType);
      console.log(`✓ ${file} — ${uploaded.chunkCount} chunk`);
    } catch (e) {
      console.error(`✗ ${file}: ${e instanceof Error ? e.message : e}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
