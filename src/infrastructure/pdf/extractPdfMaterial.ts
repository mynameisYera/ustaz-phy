import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_TEXT_LENGTH = 200;
const MAX_PAGES = 5;
const RENDER_SCALE = 1.5;

async function extractTextLayer(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const parts: string[] = [];
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) parts.push(pageText);
  }

  return parts.join("\n\n").trim();
}

async function renderPagesToImages(pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> {
  const images: string[] = [];
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) continue;

    await page.render({ canvasContext: context, viewport, canvas }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.85));
  }

  return images;
}

async function ocrPages(pageImages: string[]): Promise<string> {
  const response = await fetch("/api/extract-material", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageImages }),
  });

  const data = (await response.json()) as { text?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `PDF оқу қатесі (${response.status})`);
  }
  if (!data.text?.trim()) {
    throw new Error("PDF материалынан мәтін табылмады");
  }

  return data.text.trim();
}

export async function extractPdfMaterial(file: File): Promise<string> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Тек PDF файл қабылданады");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const textLayer = await extractTextLayer(pdf);
  if (textLayer.length >= MIN_TEXT_LENGTH) {
    return textLayer;
  }

  const pageImages = await renderPagesToImages(pdf);
  if (pageImages.length === 0) {
    throw new Error("PDF беттерін оқу мүмкін болмады");
  }

  return ocrPages(pageImages);
}
