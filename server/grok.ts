import OpenAI from "openai";
import { getEnv } from "./env.js";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import type { FixRequestInput } from "./prompts";

export type GrokBackend = "xai" | "groq";

const XAI_BASE = "https://api.x.ai/v1";
const GROQ_BASE = "https://api.groq.com/openai/v1";

const DEFAULT_XAI_MODEL = "grok-3-fast";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGrokApiKey(): string | undefined {
  return getEnv("GROK_API_KEY") || getEnv("XAI_API_KEY") || getEnv("GROQ_API_KEY");
}

export function resolveGrokApiKey(userKey?: string): string | undefined {
  const trimmed = userKey?.trim();
  return trimmed || getGrokApiKey();
}

export function getGrokBackendForKey(key: string): GrokBackend {
  if (key.startsWith("gsk_")) return "groq";
  return "xai";
}

export function getGrokBackend(): GrokBackend {
  const key = getGrokApiKey();
  if (!key) return "groq";
  return getGrokBackendForKey(key);
}

export function getGrokModelNameForKey(key: string): string {
  const custom = getEnv("GROK_MODEL");
  if (custom) return custom;
  return getGrokBackendForKey(key) === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_XAI_MODEL;
}

export function getGrokModelName(): string {
  const key = getGrokApiKey();
  if (!key) return DEFAULT_GROQ_MODEL;
  return getGrokModelNameForKey(key);
}

export function getGrokDisplayNameForKey(key: string): string {
  return getGrokBackendForKey(key) === "groq" ? "Groq (Llama)" : "xAI Grok";
}

export function getGrokDisplayName(): string {
  const key = getGrokApiKey();
  if (!key) return "Groq (Llama)";
  return getGrokDisplayNameForKey(key);
}

export function isGrokConfigured(): boolean {
  return Boolean(getGrokApiKey());
}

export function getGrokConfigError(userKey?: string): string | null {
  if (resolveGrokApiKey(userKey)) return null;

  return (
    "Введите API-ключ в Game Studio: Groq (gsk_...) → console.groq.com/keys, " +
    "или xAI (xai-...) → console.x.ai"
  );
}

export async function generateGameWithGrok(
  description: string,
  fixHistory: FixRequestInput[],
  userApiKey?: string
): Promise<string> {
  const apiKey = resolveGrokApiKey(userApiKey);
  if (!apiKey) {
    throw new Error(getGrokConfigError(userApiKey) ?? "API-ключ не задан");
  }

  const backend = getGrokBackendForKey(apiKey);
  const baseURL = backend === "groq" ? GROQ_BASE : XAI_BASE;

  const client = new OpenAI({ apiKey, baseURL });

  const maxTokens = backend === "groq" ? 8000 : 12000;
  const displayName = getGrokDisplayNameForKey(apiKey);

  const completion = await client.chat.completions.create({
    model: getGrokModelNameForKey(apiKey),
    temperature: 0.7,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(description, fixHistory) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`${displayName} вернул пустой ответ`);
  }

  return content;
}
