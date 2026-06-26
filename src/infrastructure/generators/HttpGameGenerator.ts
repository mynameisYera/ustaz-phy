import type { GameFile } from "@/domain/entities/Game";
import type { GenerateGameInput, GameGenerator } from "@/domain/ports/GameGenerator";

interface GenerateResponse {
  files: GameFile[];
}

interface ErrorResponse {
  error: string;
}

function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  return fromEnv || "/api/generate";
}

async function readJsonResponse(
  response: Response
): Promise<(GenerateResponse & ErrorResponse) | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as GenerateResponse & ErrorResponse;
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 100);
    const looksLikeHtml = preview.startsWith("<") || preview.startsWith("The page");

    throw new Error(
      looksLikeHtml
        ? "API /api/generate недоступен на этом хостинге. Нужен деплой с сервером (npm start) или Vercel/Cloudflare Pages Functions."
        : `Сервер вернул не JSON: ${preview}`
    );
  }
}

export class HttpGameGenerator implements GameGenerator {
  constructor(private readonly apiUrl = resolveApiUrl()) {}

  async generate(input: GenerateGameInput): Promise<GameFile[]> {
    let response: Response;

    try {
      response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: input.description,
          fixHistory: input.fixHistory.map((f) => ({ message: f.message })),
          apiKey: input.apiKey,
        }),
      });
    } catch {
      throw new Error(
        "Не удалось связаться с API. Проверьте деплой: нужен /api/generate на том же домене."
      );
    }

    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(data?.error ?? `Ошибка сервера (${response.status})`);
    }

    if (!data?.files?.length) {
      throw new Error("Сервер не вернул файлы игры");
    }

    return data.files;
  }
}
