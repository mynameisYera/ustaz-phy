const API_BASE = "https://uiren-backend.onrender.com/api";

export interface CatalogItem {
  id: number;
  name: string;
}

export interface ClassesResponse {
  items: CatalogItem[];
  total: number;
}

export interface SubjectsResponse {
  classId: number;
  items: (CatalogItem & { classId: number })[];
  total: number;
}

export interface TopicItem extends CatalogItem {
  subjectId: number;
}

export interface TopicsResponse {
  subjectId: number;
  items: TopicItem[];
  total: number;
}

interface ErrorBody {
  detail?: string;
}

const NETWORK_ERROR =
  "Сервер каталога недоступен — возможно, он просыпается. Подождите немного и повторите.";

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchClasses(): Promise<ClassesResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/classes`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить классы (${response.status})`));
  }

  return (await response.json()) as ClassesResponse;
}

export async function fetchSubjects(classId: number): Promise<SubjectsResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/subjects?classId=${classId}`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить предметы (${response.status})`));
  }

  return (await response.json()) as SubjectsResponse;
}

export async function fetchTopics(subjectId: number): Promise<TopicsResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/topics?subjectId=${subjectId}`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить темы (${response.status})`));
  }

  return (await response.json()) as TopicsResponse;
}

export async function createTopic(subjectId: number, name: string): Promise<TopicItem> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, name }),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось создать тему (${response.status})`));
  }

  return (await response.json()) as TopicItem;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolveTopicForLesson(
  classId: number,
  subjectName: string,
  topicName: string,
): Promise<{ classId: number; subjectId: number; topicId: number }> {
  const { items: subjects } = await fetchSubjects(classId);
  const subject = subjects.find((s) => normalizeName(s.name) === normalizeName(subjectName));
  if (!subject) {
    throw new Error(`Пән «${subjectName}» табылмады`);
  }

  const trimmedTopic = topicName.trim();
  const { items: topics } = await fetchTopics(subject.id);
  const existing = topics.find((t) => normalizeName(t.name) === normalizeName(trimmedTopic));
  if (existing) {
    return { classId, subjectId: subject.id, topicId: existing.id };
  }

  try {
    const topic = await createTopic(subject.id, trimmedTopic);
    return { classId, subjectId: subject.id, topicId: topic.id };
  } catch (e) {
    if (e instanceof Error && e.message.includes("уже есть")) {
      const { items: refreshed } = await fetchTopics(subject.id);
      const retry = refreshed.find((t) => normalizeName(t.name) === normalizeName(trimmedTopic));
      if (retry) {
        return { classId, subjectId: subject.id, topicId: retry.id };
      }
    }
    throw e;
  }
}
