import { polishGameHtml, validateGameHtml } from "./gameHtml.js";
import { assembleReactGameHtml, transpileGameJsx } from "./reactGameHtml.js";
import type { OutputFormat } from "./prompts.js";

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

function extractHtmlFromJson(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { files?: RawFile[] };
    if (!Array.isArray(parsed.files)) return null;
    const index = parsed.files.find(
      (f) => f.path === "index.html" && typeof f.content === "string"
    );
    return index?.content ?? null;
  } catch {
    return null;
  }
}

function extractHtmlFromText(raw: string): string | null {
  const trimmed = raw.trim();
  const htmlStart = trimmed.search(/<!DOCTYPE\s+html|<html[\s>]/i);
  if (htmlStart === -1) return null;
  return trimmed.slice(htmlStart);
}

export async function parseGameResponse(
  raw: string,
  outputFormat?: OutputFormat
): Promise<GameFile[]> {
  if (outputFormat === "react") {
    return parseGameResponseReact(raw);
  }
  return parseGameResponseHtml(raw);
}

async function parseGameResponseReact(raw: string): Promise<GameFile[]> {
  let jsx = raw.trim();

  // Strip a markdown code fence if the model wrapped the component in one.
  const fenced = jsx.match(/```(?:jsx|tsx|js|javascript)?\s*\n([\s\S]*?)```/i);
  if (fenced?.[1]) {
    jsx = fenced[1].trim();
  }

  // Detect a short polite refusal (no component) and surface it as-is.
  if (!jsx.includes("function Game(")) {
    const refusal = tryExtractRefusal(jsx);
    if (refusal) throw new Error(refusal);
    throw new Error("ЖИ Game() компонентін қайтармады");
  }

  const componentJs = await transpileGameJsx(jsx);
  const html = assembleReactGameHtml(componentJs);
  validateGameHtml(html);
  return [{ path: "index.html", content: html }];
}

function parseGameResponseHtml(raw: string): GameFile[] {
  const fromJson = extractHtmlFromJson(raw);
  if (fromJson) return [finalizeIndex(fromJson)];

  const standalone = tryParseStandaloneHtml(raw);
  if (standalone) return [finalizeIndex(standalone[0].content)];

  const embeddedHtml = extractHtmlFromText(raw);
  if (embeddedHtml) return [finalizeIndex(embeddedHtml)];

  const refusal = tryExtractRefusal(raw);
  if (refusal) throw new Error(refusal);

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("ЖИ жарамсыз жауап қайтарды. Толық HTML күтіледі (<!DOCTYPE html>...).</html>).");
  }

  if (!parsed || typeof parsed !== "object" || !("files" in parsed)) {
    throw new Error("ЖИ files өрісі жоқ JSON қайтарды");
  }

  const files = (parsed as { files: RawFile[] }).files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("ЖИ ойын файлдарын қайтармады");
  }

  const normalized: GameFile[] = files
    .filter((f) => f.path && typeof f.content === "string")
    .map((f) => ({ path: f.path!, content: f.content! }));

  const index = normalized.find((f) => f.path === "index.html");
  if (!index) {
    throw new Error("ЖИ index.html жасамады");
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
