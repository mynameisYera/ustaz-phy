#!/usr/bin/env tsx
/**
 * RAG толық тазалау: OpenAI Vector Store + data/books/*
 *
 * npm run rag:reset
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import "../server/env.js";
import { clearRagConfig, loadRagConfig } from "../server/rag/config.js";
import { deleteVectorStoreFile } from "../server/rag/vectorStore.js";
import { getOpenAiClient } from "../server/openaiClient.js";

const booksDir = resolve("data/books");
const rootArtifacts = ["physics7grade.ocr.txt"];

async function listAllFileIds(vectorStoreId: string): Promise<string[]> {
  const client = getOpenAiClient();
  const ids: string[] = [];
  let after: string | undefined;

  while (true) {
    const page = await client.vectorStores.files.list(vectorStoreId, after ? { after } : undefined);
    ids.push(...page.data.map((f) => f.id));
    if (!page.has_more || page.data.length === 0) break;
    after = page.data.at(-1)?.id;
  }

  return ids;
}

async function resetOpenAi(): Promise<void> {
  const config = loadRagConfig();
  if (!config) {
    console.log("Vector Store конфигі жоқ — OpenAI тазалау өткізілмеді");
    return;
  }

  console.log(`Vector Store: ${config.vectorStoreId}`);

  const fileIds = await listAllFileIds(config.vectorStoreId);
  for (const fileId of fileIds) {
    try {
      await deleteVectorStoreFile(fileId);
      console.log(`✓ жойылды: ${fileId}`);
    } catch (e) {
      console.warn(`✗ ${fileId}: ${e instanceof Error ? e.message : e}`);
    }
  }

  const client = getOpenAiClient();
  try {
    await client.vectorStores.del(config.vectorStoreId);
    console.log("✓ Vector Store жойылды");
  } catch (e) {
    console.warn(`Vector Store жою: ${e instanceof Error ? e.message : e}`);
  }

  clearRagConfig();
  console.log("✓ rag-config.json тазаланды");
}

function resetLocal(): void {
  if (!existsSync(booksDir)) {
    mkdirSync(booksDir, { recursive: true });
    console.log("data/books/ жасалды (бос)");
  } else {
    const entries = readdirSync(booksDir);
    if (entries.length === 0) {
      console.log("data/books/ бос");
    }
    for (const entry of entries) {
      unlinkSync(resolve(booksDir, entry));
      console.log(`✓ локалды жойылды: data/books/${entry}`);
    }
  }

  for (const name of rootArtifacts) {
    const path = resolve(name);
    try {
      unlinkSync(path);
      console.log(`✓ локалды жойылды: ${name}`);
    } catch {
      // ignore missing
    }
  }
}

async function main() {
  console.log("RAG толық тазалау...\n");
  await resetOpenAi();
  console.log();
  resetLocal();
  console.log("\nДайын. Келесі қадамдар:");
  console.log("  npm run rag:ocr -- physics7grade.pdf");
  console.log("  npm run rag:upload -- data/books/physics7grade.md");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
