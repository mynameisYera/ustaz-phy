import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import Tesseract, { type Worker } from "tesseract.js";
import { analyzePdfBuffer } from "../pdfAnalyze.js";
import { formatBookHeader, formatPageMarkdown, type BookMeta } from "./formatPage.js";
import { renderPageToPng } from "./renderPage.js";

export interface OcrProgress {
  sourceFile: string;
  outputFile: string;
  totalPages: number;
  lastCompletedPage: number;
  startedAt: string;
  updatedAt: string;
}

export interface OcrBookOptions {
  pdfPath: string;
  outputDir?: string;
  from?: number;
  to?: number;
  resume?: boolean;
  subject?: string;
  grade?: number;
  lang?: string;
  onPage?: (page: number, total: number, preview: string) => void;
}

const DEFAULT_OUTPUT_DIR = "data/books";

function progressPath(outputFile: string): string {
  return `${outputFile}.progress.json`;
}

function loadProgress(path: string): OcrProgress | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as OcrProgress;
  } catch {
    return null;
  }
}

function saveProgress(progress: OcrProgress): void {
  writeFileSync(progressPath(progress.outputFile), JSON.stringify(progress, null, 2));
}

async function createOcrWorker(): Promise<Worker> {
  return Tesseract.createWorker("kaz+rus", 1, {
    logger: () => {},
  });
}

async function ocrPng(worker: Worker, png: Buffer): Promise<string> {
  const { data } = await worker.recognize(png);
  return data.text.trim();
}

export async function ocrBook(options: OcrBookOptions): Promise<{
  outputFile: string;
  pagesProcessed: number;
  skipped: boolean;
}> {
  const abs = resolve(options.pdfPath);
  const buffer = readFileSync(abs);
  const analysis = await analyzePdfBuffer(buffer);
  const filename = basename(abs);
  const bookId = filename.replace(/\.pdf$/i, "");

  if (!analysis.isWatermarkOnly && analysis.realLineCount > 20) {
    return { outputFile: "", pagesProcessed: 0, skipped: true };
  }

  const outDir = resolve(options.outputDir ?? DEFAULT_OUTPUT_DIR);
  mkdirSync(outDir, { recursive: true });

  const outputFile = join(outDir, `${bookId}.md`);
  const progressFile = progressPath(outputFile);
  const existing = options.resume ? loadProgress(progressFile) : null;

  const from = options.from ?? 1;
  const doc = await getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;
  const to = Math.min(options.to ?? doc.numPages, doc.numPages);

  const startPage =
    options.resume && existing && existing.lastCompletedPage >= from
      ? existing.lastCompletedPage + 1
      : from;

  const meta: BookMeta = {
    title: bookId,
    sourceFile: filename,
    pages: doc.numPages,
    subject: options.subject,
    grade: options.grade,
    lang: options.lang ?? "kk",
  };

  const isNewFile = startPage <= from;
  const out = createWriteStream(outputFile, {
    encoding: "utf8",
    flags: isNewFile ? "w" : "a",
  });

  if (isNewFile) {
    out.write(formatBookHeader(meta));
  }

  const progress: OcrProgress = {
    sourceFile: abs,
    outputFile,
    totalPages: to,
    lastCompletedPage: isNewFile ? 0 : (existing?.lastCompletedPage ?? 0),
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveProgress(progress);

  const worker = await createOcrWorker();
  let pagesProcessed = 0;

  try {
    for (let p = startPage; p <= to; p++) {
      const page = await doc.getPage(p);
      const png = await renderPageToPng(page);
      const raw = await ocrPng(worker, png);
      const md = formatPageMarkdown(p, raw);
      out.write(`\n${md}\n`);
      pagesProcessed++;

      progress.lastCompletedPage = p;
      progress.updatedAt = new Date().toISOString();
      saveProgress(progress);

      options.onPage?.(p, to, raw.slice(0, 80));
    }
  } finally {
    out.end();
    await worker.terminate();
  }

  if (progress.lastCompletedPage >= to) {
    writeFileSync(progressFile.replace(".progress.json", ".done.json"), JSON.stringify(progress, null, 2));
  }

  return { outputFile, pagesProcessed, skipped: false };
}

export function inferBookMeta(filename: string): Pick<BookMeta, "subject" | "grade"> {
  const lower = filename.toLowerCase();
  const gradeMatch = lower.match(/(\d+)\s*(grade|syryp|сынып|class)/) ?? lower.match(/(\d+)/);
  const grade = gradeMatch ? Number(gradeMatch[1]) : undefined;

  let subject: string | undefined;
  if (/physics|физика|fizika/.test(lower)) subject = "physics";
  else if (/math|матем|matem/.test(lower)) subject = "math";
  else if (/bio|био/.test(lower)) subject = "biology";
  else if (/chem|хим|xim/.test(lower)) subject = "chemistry";

  return { subject, grade };
}
