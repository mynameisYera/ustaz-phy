const ORIGIN = "https://uiren-backend.onrender.com";
const API_BASE = `${ORIGIN}/api`;

export interface LabSubject {
  name: string;
  subjectId: number;
}

export interface LabItem {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LabGamesResponse {
  subjectId: number;
  items: LabItem[];
  total: number;
}

export interface LabRoute {
  name: string;
  id: number;
  route: string;
}

interface ErrorBody {
  detail?: string;
}

const NETWORK_ERROR =
  "Сервер зертханалар недоступен — возможно, он просыпается. Подождите немного и повторите.";

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchLabSubjects(): Promise<LabSubject[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/lab/subjects`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить предметы (${response.status})`));
  }

  return (await response.json()) as LabSubject[];
}

export async function fetchLabGames(subjectId: number): Promise<LabGamesResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/lab/games/${subjectId}`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить лаборатории (${response.status})`));
  }

  return (await response.json()) as LabGamesResponse;
}

export async function fetchLabRoute(subjectId: number): Promise<LabRoute> {
  let response: Response;
  try {
    response = await fetch(`${ORIGIN}/api/labs/${subjectId}`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось открыть лабораторию (${response.status})`));
  }

  return (await response.json()) as LabRoute;
}
