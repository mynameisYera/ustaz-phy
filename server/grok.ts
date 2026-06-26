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

export function getGrokBackend(): GrokBackend {
  const key = getGrokApiKey();
  if (key?.startsWith("gsk_")) return "groq";
  return "xai";
}

export function getGrokModelName(): string {
  const custom = getEnv("GROK_MODEL");
  if (custom) return custom;
  return getGrokBackend() === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_XAI_MODEL;
}

export function getGrokDisplayName(): string {
  return getGrokBackend() === "groq" ? "Groq (Llama)" : "xAI Grok";
}

export function isGrokConfigured(): boolean {
  return Boolean(getGrokApiKey());
}

export function getGrokConfigError(): string | null {
  if (isGrokConfigured()) return null;

  return (
    "GROK_API_KEY не задан. Ключ xAI (xai-...) → console.x.ai, " +
    "или Groq (gsk_...) → console.groq.com/keys"
  );
}

export async function generateGameWithGrok(
  description: string,
  fixHistory: FixRequestInput[]
): Promise<string> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    throw new Error(getGrokConfigError() ?? "GROK_API_KEY не задан");
  }

  const backend = getGrokBackend();
  const baseURL = backend === "groq" ? GROQ_BASE : XAI_BASE;

  const client = new OpenAI({ apiKey, baseURL });

  const maxTokens = backend === "groq" ? 8000 : 12000;

  const completion = await client.chat.completions.create({
    model: getGrokModelName(),
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
    throw new Error(`${getGrokDisplayName()} вернул пустой ответ`);
  }

  return content;
}
