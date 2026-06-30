import { generateGame, getAiConfigError } from "./ai.js";
import { parseGameResponse } from "./parseGameResponse.js";
import type { GameGenerationContext } from "./prompts.js";

export interface ServerAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface GenerateRequestBody extends Partial<GameGenerationContext> {
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

function parseGrade(value: unknown): number | null {
  const grade = Number(value);
  if (!Number.isInteger(grade) || grade < 1 || grade > 11) return null;
  return grade;
}

export async function handleGenerate(body: GenerateRequestBody): Promise<GenerateResult> {
  const configError = getAiConfigError();
  if (configError) {
    return { ok: false, status: 400, error: configError };
  }

  const grade = parseGrade(body.grade);
  const subject = body.subject?.trim();
  const lessonTopic = body.lessonTopic?.trim();
  const description = body.description?.trim();
  const materialText = body.materialText?.trim();
  const fixHistory = body.fixHistory ?? [];

  if (grade === null) {
    return { ok: false, status: 400, error: "Класс таңдалуы керек (1–11)" };
  }
  if (!subject) {
    return { ok: false, status: 400, error: "Пән көрсетілуі керек" };
  }
  if (!lessonTopic) {
    return { ok: false, status: 400, error: "Сабақ тақырыбы көрсетілуі керек" };
  }
  if (!description) {
    return { ok: false, status: 400, error: "description міндетті" };
  }

  const context: GameGenerationContext = {
    grade,
    subject,
    lessonTopic,
    description,
    materialText: materialText || undefined,
  };

  try {
    const content = await generateGame(context, fixHistory, body.attachments ?? []);
    const files = parseGameResponse(content);
    return { ok: true, files };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Генерация қатесі";
    console.error("[generate]", message);
    return { ok: false, status: 502, error: message };
  }
}
