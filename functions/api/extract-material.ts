import { handleExtractMaterial } from "../../server/handleExtractMaterial.js";

interface PagesContext {
  request: Request;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  let body: Record<string, unknown>;

  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Сұрау денесіндегі JSON дұрыс емес" }, { status: 400 });
  }

  const pageImages = Array.isArray(body.pageImages)
    ? body.pageImages.filter((item): item is string => typeof item === "string")
    : undefined;

  const result = await handleExtractMaterial({ pageImages });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ text: result.text });
}
