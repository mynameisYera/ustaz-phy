import { handleGenerate } from "../../server/handleGenerate.js";

interface PagesContext {
  request: Request;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  let body: Record<string, unknown>;

  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Некорректный JSON в теле запроса" }, { status: 400 });
  }

  const result = await handleGenerate({
    description: typeof body.description === "string" ? body.description : undefined,
    fixHistory: Array.isArray(body.fixHistory)
      ? body.fixHistory.filter(
          (item): item is { message: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { message?: unknown }).message === "string"
        )
      : [],
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ files: result.files });
}
