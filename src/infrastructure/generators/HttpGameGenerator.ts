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
        ? "API /api/generate бұл хостингте қолжетімсіз. Сервермен деплой керек (npm start) немесе Vercel/Cloudflare Pages Functions."
        : `Сервер JSON емес жауап қайтарды: ${preview}`
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
          useRag: input.useRag ?? false,
        }),
      });
    } catch {
      throw new Error(
        "API-мен байланысу сәтсіз аяқталды. Деплойды тексеріңіз: сол доменде /api/generate болуы керек."
      );
    }

    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(data?.error ?? `Сервер қатесі (${response.status})`);
    }

    if (!data?.files?.length) {
      throw new Error("Сервер ойын файлдарын қайтармады");
    }

    return data.files;
  }
}
