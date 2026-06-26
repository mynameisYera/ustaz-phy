import { polishGameHtml, validateGameHtml } from "./gameHtml.js";

interface GameFile {
  path: string;
  content: string;
}

interface RawFile {
  path?: string;
  content?: string;
}

function finalizeIndex(html: string): GameFile {
  const polished = polishGameHtml(html);
  validateGameHtml(polished);
  return { path: "index.html", content: polished };
}

function tryParseStandaloneHtml(raw: string): GameFile[] | null {
  const trimmed = raw.trim();

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    return [{ path: "index.html", content: trimmed }];
  }

  const fenced = trimmed.match(/```(?:html)?\s*\n([\s\S]*?)```/i);
  if (fenced?.[1]?.trim().startsWith("<")) {
    return [{ path: "index.html", content: fenced[1].trim() }];
  }

  return null;
}

function tryExtractRefusal(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/<!DOCTYPE\s+html|<html[\s>]/i.test(trimmed)) return null;

  const fenced = trimmed.match(/```(?:html)?\s*\n([\s\S]*?)```/i);
  if (fenced?.[1]?.trim().match(/<!DOCTYPE\s+html|<html[\s>]/i)) return null;

  if (trimmed.length > 1500) return null;

  return trimmed;
}

export function parseGameResponse(raw: string): GameFile[] {
  const standalone = tryParseStandaloneHtml(raw);
  if (standalone) return [finalizeIndex(standalone[0].content)];

  const refusal = tryExtractRefusal(raw);
  if (refusal) throw new Error(refusal);

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("ИИ вернул невалидный ответ. Ожидается index.html (<!DOCTYPE html>...).");
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

  const index = normalized.find((f) => f.path === "index.html");
  if (!index) {
    throw new Error("ИИ не сгенерировал index.html");
  }

  if (!index.content.includes("<style") && !index.content.includes("<script")) {
    const css = normalized.find((f) => f.path === "style.css")?.content ?? "";
    const js = normalized.find((f) => f.path === "game.js")?.content ?? "";
    if (css || js) {
      index.content = mergeSplitAssets(index.content, css, js);
    }
  }

  return [finalizeIndex(index.content)];
}

function mergeSplitAssets(html: string, css: string, js: string): string {
  let result = html
    .replace(/<link[^>]*href=["']style\.css["'][^>]*\/?>/i, css ? `<style>${css}</style>` : "")
    .replace(/<script[^>]*src=["']game\.js["'][^>]*><\/script>/i, js ? `<script>${js}</script>` : "");

  if (css && !result.includes("<style")) {
    result = result.replace("</head>", `<style>${css}</style></head>`);
  }
  if (js && !result.includes("<script")) {
    result = result.replace("</body>", `<script>${js}</script></body>`);
  }

  return result;
}
