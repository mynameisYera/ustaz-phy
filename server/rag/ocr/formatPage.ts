import { isBoilerplateLine } from "../pdfAnalyze.js";

/** OKULYK водяной знағын OCR нәтижесінен тазалау */
export function cleanOcrText(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !isBoilerplateLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatPageMarkdown(pageNum: number, rawText: string): string {
  const text = cleanOcrText(rawText);
  if (!text) {
    return `## Бет ${pageNum}\n\n[бос бет]\n`;
  }
  return `## Бет ${pageNum}\n\n${text}\n`;
}

export interface BookMeta {
  title: string;
  sourceFile: string;
  pages: number;
  subject?: string;
  grade?: number;
  lang?: string;
}

export function formatBookHeader(meta: BookMeta): string {
  const lines = [
    "---",
    `title: ${meta.title}`,
    `source: ${meta.sourceFile}`,
    `pages: ${meta.pages}`,
  ];
  if (meta.subject) lines.push(`subject: ${meta.subject}`);
  if (meta.grade) lines.push(`grade: ${meta.grade}`);
  if (meta.lang) lines.push(`lang: ${meta.lang}`);
  lines.push("---", "");
  return lines.join("\n");
}
