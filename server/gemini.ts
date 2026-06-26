import { getEnv } from "./env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import type { FixRequestInput } from "./prompts";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

// Актуальные модели free tier (gemini-1.5-* сняты с API → 404)
const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export function getGeminiModelName(): string {
  return getEnv("GEMINI_MODEL") || DEFAULT_MODEL;
}

export function getGeminiApiKey(): string | undefined {
  return getEnv("GEMINI_API_KEY");
}

function getModelCandidates(): string[] {
  return [...new Set([getGeminiModelName(), ...FALLBACK_MODELS])];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isQuotaError(error: unknown): boolean {
  return /429|quota|Quota exceeded|Too Many Requests/i.test(errorMessage(error));
}

function isModelUnavailableError(error: unknown): boolean {
  return /404|not found|not supported/i.test(errorMessage(error));
}

function shouldTryNextModel(error: unknown): boolean {
  return isQuotaError(error) || isModelUnavailableError(error);
}

function parseRetryDelayMs(error: unknown): number {
  const msg = errorMessage(error);
  const secMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (secMatch) return Math.ceil(parseFloat(secMatch[1]) * 1000) + 500;

  const jsonMatch = msg.match(/"retryDelay":"(\d+)s"/);
  if (jsonMatch) return parseInt(jsonMatch[1], 10) * 1000 + 500;

  return 8000;
}

function toUserError(lastError: unknown, triedModels: string[]): Error {
  if (isQuotaError(lastError)) {
    return new Error(
      `Квота Gemini исчерпана (пробовали: ${triedModels.join(", ")}). ` +
        "Подождите 1–2 минуты. В .env: GEMINI_MODEL=gemini-2.5-flash-lite"
    );
  }
  if (isModelUnavailableError(lastError)) {
    return new Error(
      `Модели Gemini недоступны (пробовали: ${triedModels.join(", ")}). ` +
        "Проверьте ключ: https://aistudio.google.com/app/apikey"
    );
  }
  return lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function generateWithModel(
  apiKey: string,
  modelName: string,
  description: string,
  fixHistory: FixRequestInput[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 6144,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(buildUserPrompt(description, fixHistory));
  const content = result.response.text();

  if (!content) {
    throw new Error("Gemini вернул пустой ответ");
  }

  return content;
}

export async function generateGameWithGemini(
  description: string,
  fixHistory: FixRequestInput[]
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY не задан");
  }

  const candidates = getModelCandidates();
  const triedModels: string[] = [];
  let lastError: unknown;

  for (const modelName of candidates) {
    triedModels.push(modelName);
    console.log(`[gemini] trying ${modelName}…`);

    try {
      return await generateWithModel(apiKey, modelName, description, fixHistory);
    } catch (error) {
      lastError = error;
      console.warn(`[gemini] ${modelName} failed:`, errorMessage(error));

      if (!shouldTryNextModel(error)) {
        throw toUserError(error, triedModels);
      }

      if (isQuotaError(error)) {
        const delay = Math.min(parseRetryDelayMs(error), 30000);
        console.warn(`[gemini] quota on ${modelName}, waiting ${delay}ms…`);
        await sleep(delay);

        try {
          return await generateWithModel(apiKey, modelName, description, fixHistory);
        } catch (retryError) {
          lastError = retryError;
          console.warn(`[gemini] retry failed for ${modelName}, next model…`);
        }
      }
    }
  }

  throw toUserError(lastError, triedModels);
}
