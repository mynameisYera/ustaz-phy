import { generateGame, getAiConfigError } from "./ai.js";
import { parseGameResponse } from "./parseGameResponse.js";

export interface ServerAttachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface GenerateRequestBody {
  description?: string;
  fixHistory?: { message: string }[];
  attachments?: ServerAttachment[];
}

export interface GameFilePayload {
  path: string;
  content: string;
}

export type GenerateResult =
  | { ok: true; files: GameFilePayload[] }
  | { ok: false; status: number; error: string };

export async function handleGenerate(body: GenerateRequestBody): Promise<GenerateResult> {
  const { description, fixHistory = [], attachments = [] } = body;

  const configError = getAiConfigError();
  if (configError) {
    return { ok: false, status: 400, error: configError };
  }

  if (!description?.trim()) {
    return { ok: false, status: 400, error: "description міндетті" };
  }

  try {
    const content = await generateGame(description.trim(), fixHistory, attachments);
    const files = parseGameResponse(content);
    return { ok: true, files };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Генерация қатесі";
    console.error("[generate]", message);
    return { ok: false, status: 502, error: message };
  }
}
