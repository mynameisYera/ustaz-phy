#!/usr/bin/env tsx
/**
 * Сканерленген PDF → Markdown (OCR)
 *
 * npm run rag:ocr -- physics7grade.pdf
 * npm run rag:ocr -- physics7grade.pdf --from 1 --to 20
 * npm run rag:ocr -- physics7grade.pdf --resume
 */
import { resolve } from "node:path";
import { ocrBook, inferBookMeta } from "../server/rag/ocr/pipeline.js";

function parseArgs(argv: string[]) {
  const filePath = argv[2];
  let from: number | undefined;
  let to: number | undefined;
  let resume = false;
  let outputDir: string | undefined;

  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === "--from") from = Number(argv[++i]);
    if (argv[i] === "--to") to = Number(argv[++i]);
    if (argv[i] === "--resume") resume = true;
    if (argv[i] === "--out") outputDir = argv[++i];
  }

  return { filePath, from, to, resume, outputDir };
}

async function main() {
  const { filePath, from, to, resume, outputDir } = parseArgs(process.argv);
  if (!filePath) {
    console.error("Пайдалану: npm run rag:ocr -- <file.pdf> [--from 1] [--to 50] [--resume] [--out data/books]");
    process.exit(1);
  }

  const abs = resolve(filePath);
  const meta = inferBookMeta(abs);

  console.log(`OCR: ${abs}`);
  if (meta.subject || meta.grade) {
    console.log(`Метаданные: ${meta.subject ?? "?"} / ${meta.grade ?? "?"} сынып`);
  }

  const result = await ocrBook({
    pdfPath: abs,
    outputDir,
    from,
    to,
    resume,
    subject: meta.subject,
    grade: meta.grade,
    onPage: (page, total, preview) => {
      const snippet = preview.replace(/\n/g, " ").slice(0, 60) || "(бос)";
      console.log(`Бет ${page}/${total}: ${snippet}…`);
    },
  });

  if (result.skipped) {
    console.log("PDF-те мәтін бар — OCR қажет емес. Тікелей rag:upload қолданыңыз.");
    process.exit(0);
  }

  console.log(`\nДайын: ${result.outputFile} (${result.pagesProcessed} бет)`);
  console.log(`Келесі қadam: npm run rag:upload -- ${result.outputFile}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
