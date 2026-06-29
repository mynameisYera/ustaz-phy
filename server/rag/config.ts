import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnv } from "../env.js";

export interface RagConfig {
  vectorStoreId: string;
  name: string;
  createdAt: string;
}

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data");
const configPath = resolve(dataDir, "rag-config.json");

function ensureDataDir(): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

export function loadRagConfig(): RagConfig | null {
  const fromEnv = getEnv("OPENAI_VECTOR_STORE_ID");
  if (fromEnv) {
    return {
      vectorStoreId: fromEnv,
      name: getEnv("OPENAI_VECTOR_STORE_NAME") ?? "School Books",
      createdAt: "",
    };
  }

  if (!existsSync(configPath)) return null;

  try {
    return JSON.parse(readFileSync(configPath, "utf8")) as RagConfig;
  } catch {
    return null;
  }
}

export function saveRagConfig(config: RagConfig): void {
  ensureDataDir();
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

export function clearRagConfig(): void {
  if (existsSync(configPath)) {
    writeFileSync(configPath, "", "utf8");
  }
}
