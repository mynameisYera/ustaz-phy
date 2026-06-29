import { PDFParse } from "pdf-parse";

const WATERMARK_PATTERNS = [
  /OKULYK\.(COM|KZ)/i,
  /образовательных\s+целях/i,
  /Приказа\s+Министра\s+образования/i,
  /Все\s+учебники\s+Казахстана/i,
  /исключительно\s+в\s+образовательных/i,
];

export function isBoilerplateLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 5) return true;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(t)) return true;
  return WATERMARK_PATTERNS.some((p) => p.test(t));
}

export function isWatermarkChunk(text: string): boolean {
  const t = text.trim();
  if (!t) return true;

  const lines = t.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
  if (lines.length === 0) return true;
  if (lines.every(isBoilerplateLine)) return true;

  const realChars = lines.filter((l) => !isBoilerplateLine(l)).join(" ").length;
  return realChars < 40;
}

export interface PdfAnalysis {
  pages: number;
  totalTextLength: number;
  lineCount: number;
  realLineCount: number;
  isWatermarkOnly: boolean;
  sampleRealLines: string[];
}

export async function analyzePdfBuffer(buffer: Buffer): Promise<PdfAnalysis> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const lines = result.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5);
  const realLines = lines.filter((l) => !isBoilerplateLine(l));

  return {
    pages: result.total,
    totalTextLength: result.text.length,
    lineCount: lines.length,
    realLineCount: realLines.length,
    isWatermarkOnly: realLines.length === 0 && lines.length > 0,
    sampleRealLines: realLines.slice(0, 5),
  };
}

export const WATERMARK_ONLY_MESSAGE =
  "PDF тек OKULYK водяной знағының мәтінін қамтиды — kitap мазмұны сканерленген (сурет). " +
  "RAG жұмыс істемейді. Шешім: npm run rag:ocr -- physics7grade.pdf командасымен OCR жасап, .txt жүктеңіз.";
