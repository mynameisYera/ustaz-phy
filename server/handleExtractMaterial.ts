import { getAiConfigError } from "./ai.js";
import { extractTextFromScannedPages } from "./extractMaterial.js";

export interface ExtractMaterialRequestBody {
  pageImages?: string[];
}

export type ExtractMaterialResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

export async function handleExtractMaterial(
  body: ExtractMaterialRequestBody
): Promise<ExtractMaterialResult> {
  const configError = getAiConfigError();
  if (configError) {
    return { ok: false, status: 400, error: configError };
  }

  const pageImages = body.pageImages?.filter(Boolean) ?? [];
  if (pageImages.length === 0) {
    return { ok: false, status: 400, error: "PDF беттері жоқ" };
  }

  try {
    const text = await extractTextFromScannedPages(pageImages);
    return { ok: true, text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF оқу қатесі";
    console.error("[extract-material]", message);
    return { ok: false, status: 502, error: message };
  }
}
