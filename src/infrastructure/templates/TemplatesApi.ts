export interface TextTemplate {
  id: number;
  classId: number;
  subjectId: number;
  topicId: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

type CreateTemplateBase = {
  classId: number;
  subjectId: number;
  name: string;
  content: string;
};

export type CreateTemplateInput =
  | (CreateTemplateBase & { topicId: number; topicName?: never })
  | (CreateTemplateBase & { topicName: string; topicId?: never });

export interface TemplatesByTopicResponse {
  classId: number;
  subjectId: number;
  topicId: number;
  items: TextTemplate[];
  total: number;
}
export interface AllTemplatesFilters {
  classId?: number;
  subjectId?: number;
  topicId?: number;
  q?: string;
}

export interface AllTemplatesResponse {
  classId: number | null;
  subjectId: number | null;
  topicId: number | null;
  q: string | null;
  items: TextTemplate[];
  total: number;
}

const API_BASE = "https://uiren-backend.onrender.com/api";

interface ErrorBody {
  detail?: string;
  error_code?: string;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

const NETWORK_ERROR =
  "Сервер шаблонов недоступен — возможно, он просыпается. Подождите немного и повторите.";

export async function createTemplate(params: CreateTemplateInput): Promise<TextTemplate> {
  const body: Record<string, unknown> = {
    classId: params.classId,
    subjectId: params.subjectId,
    name: params.name,
    content: params.content,
  };

  if ("topicId" in params && params.topicId != null) {
    body.topicId = params.topicId;
  } else if ("topicName" in params && params.topicName) {
    body.topicName = params.topicName;
  } else {
    throw new Error("Укажите topicId или topicName");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось сохранить шаблон (${response.status})`));
  }

  return (await response.json()) as TextTemplate;
}

export async function listTemplatesByTopic(topicId: number): Promise<TemplatesByTopicResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/templates?topicId=${topicId}`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить шаблоны темы (${response.status})`));
  }

  return (await response.json()) as TemplatesByTopicResponse;
}

export async function fetchAllTemplates(
  filters: AllTemplatesFilters = {},
): Promise<AllTemplatesResponse> {
  const params = new URLSearchParams();
  if (filters.classId != null) params.set("classId", String(filters.classId));
  if (filters.subjectId != null) params.set("subjectId", String(filters.subjectId));
  if (filters.topicId != null) params.set("topicId", String(filters.topicId));
  if (filters.q) params.set("q", filters.q);

  const query = params.toString();
  const url = query ? `${API_BASE}/allTemplates?${query}` : `${API_BASE}/allTemplates`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить шаблоны (${response.status})`));
  }

  return (await response.json()) as AllTemplatesResponse;
}

export async function getTemplate(id: number): Promise<TextTemplate> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/templates/${id}`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (response.status === 404) {
    throw new Error("Шаблон не найден");
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить шаблон (${response.status})`));
  }

  return (await response.json()) as TextTemplate;
}
