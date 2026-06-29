import { handleGenerate } from "../../server/handleGenerate.js";

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

  const result = await handleGenerate({
    grade: typeof body.grade === "number" ? body.grade : Number(body.grade),
    subject: typeof body.subject === "string" ? body.subject : undefined,
    lessonTopic: typeof body.lessonTopic === "string" ? body.lessonTopic : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    materialText: typeof body.materialText === "string" ? body.materialText : undefined,
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
