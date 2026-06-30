import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleExtractMaterial } from "../server/handleExtractMaterial.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const result = await handleExtractMaterial(req.body ?? {});

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(200).json({ text: result.text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Сервердің ішкі қатесі";
    console.error("[api/extract-material] unhandled:", message);
    res.status(500).json({ error: message });
  }
}
