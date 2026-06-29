#!/usr/bin/env tsx
/**
 * Барлық PDF-ті бір папкадан OCR арқылы өңдеу
 *
 * npm run rag:ocr:batch -- ./books
 * npm run rag:ocr:batch -- ./books --resume
 */
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { ocrBook, inferBookMeta } from "../server/rag/ocr/pipeline.js";

async function main() {
  const dir = process.argv[2];
  const resume = process.argv.includes("--resume");

  if (!dir) {
    console.error("Пайдалану: npm run rag:ocr:batch -- <pdf-folder> [--resume]");
    process.exit(1);
  }

  const absDir = resolve(dir);
  const pdfs = readdirSync(absDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();

  if (pdfs.length === 0) {
    console.error("PDF табылмады");
    process.exit(1);
  }

  console.log(`${pdfs.length} PDF табылды\n`);

  for (const pdf of pdfs) {
    const path = join(absDir, pdf);
    const meta = inferBookMeta(pdf);
    console.log(`\n=== ${pdf} ===`);

    try {
      const result = await ocrBook({
        pdfPath: path,
        resume,
        subject: meta.subject,
        grade: meta.grade,
        onPage: (page, total) => {
          if (page % 10 === 0 || page === total) {
            process.stdout.write(`\r  ${page}/${total} бет`);
          }
        },
      });

      if (result.skipped) {
        console.log("  → мәтіні бар, OCR өткізілді");
      } else {
        console.log(`\n  → ${result.outputFile}`);
      }
    } catch (e) {
      console.error(`  ✗ ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log("\nБарлығы дайын. Индекстеу: npm run rag:index");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
