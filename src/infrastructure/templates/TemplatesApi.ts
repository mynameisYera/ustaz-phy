export interface TextTemplate {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TemplatesListResponse {
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

export async function createTemplate(name: string, content: string): Promise<TextTemplate> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось сохранить шаблон (${response.status})`));
  }

  return (await response.json()) as TextTemplate;
}

export async function listTemplates(): Promise<TemplatesListResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/templates`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить шаблоны (${response.status})`));
  }

  return (await response.json()) as TemplatesListResponse;
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
