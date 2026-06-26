import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/** Корень проекта — всегда родитель папки server/ */
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const envPath = resolve(projectRoot, ".env");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });

  
} else {
  dotenv.config({ override: true });
}

export function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}
