import type { GameFile } from "@/domain/entities/Game";
import type { GenerateGameInput, GameGenerator } from "@/domain/ports/GameGenerator";

interface GenerateResponse {
  files: GameFile[];
}

interface ErrorResponse {
  error: string;
}

export class HttpGameGenerator implements GameGenerator {
  constructor(private readonly apiUrl = "/api/generate") {}

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
        "Не удалось связаться с API. Перезапустите: npm run dev"
      );
    }

    const data = (await response.json()) as GenerateResponse & ErrorResponse;

    if (!response.ok) {
      throw new Error(data.error ?? `Ошибка сервера (${response.status})`);
    }

    if (!data.files?.length) {
      throw new Error("Сервер не вернул файлы игры");
    }

    return data.files;
  }
}
