import { generateGame, getAiConfigError } from "./ai.js";
import { parseGameResponse } from "./parseGameResponse.js";

export interface GenerateRequestBody {
  description?: string;
  fixHistory?: { message: string }[];
}

export interface GameFilePayload {
  path: string;
  content: string;
}

export type GenerateResult =
  | { ok: true; files: GameFilePayload[] }
  | { ok: false; status: number; error: string };

export async function handleGenerate(body: GenerateRequestBody): Promise<GenerateResult> {
  const { description, fixHistory = [] } = body;

  const configError = getAiConfigError();
  if (configError) {
    return { ok: false, status: 400, error: configError };
  }

  if (!description?.trim()) {
    return { ok: false, status: 400, error: "description обязателен" };
  }

  try {
    const content = await generateGame(description.trim(), fixHistory);
    const files = parseGameResponse(content);
    return { ok: true, files };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка генерации";
    console.error("[generate]", message);
    return { ok: false, status: 502, error: message };
  }
}
