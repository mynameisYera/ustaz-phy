interface GameFile {
  path: string;
  content: string;
}

const REQUIRED_PATHS = ["index.html", "style.css", "game.js", "README.md"];

interface RawFile {
  path?: string;
  content?: string;
}

export function parseGameResponse(raw: string): GameFile[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("ИИ вернул невалидный JSON");
  }

  if (!parsed || typeof parsed !== "object" || !("files" in parsed)) {
    throw new Error("ИИ вернул JSON без поля files");
  }

  const files = (parsed as { files: RawFile[] }).files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("ИИ не вернул файлы игры");
  }

  const normalized: GameFile[] = files
    .filter((f) => f.path && typeof f.content === "string")
    .map((f) => ({ path: f.path!, content: f.content! }));

  if (!normalized.some((f) => f.path === "index.html")) {
    throw new Error("ИИ не сгенерировал index.html");
  }

  for (const required of REQUIRED_PATHS) {
    if (!normalized.some((f) => f.path === required)) {
      normalized.push({
        path: required,
        content: required.endsWith(".md")
          ? "# Игра\n\nОткройте index.html в браузере."
          : required.endsWith(".css")
            ? "body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }"
            : required.endsWith(".js")
              ? "// placeholder"
              : "<!DOCTYPE html><html><body><p>Игра загружается…</p></body></html>",
      });
    }
  }

  return normalized;
}
