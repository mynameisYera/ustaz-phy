const ORIGIN = "https://uiren-backend.onrender.com";
const API_BASE = `${ORIGIN}/api`;

export interface LabSubject {
  name: string;
  subjectId: number;
}

/**
 * A lab game. When listing across all classes the backend returns a leaner
 * shape (`id`/`name`/`content` only), so everything else is optional.
 */
export interface LabItem {
  id: number;
  classId?: number;
  name: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface LabGamesResponse {
  subjectId: number;
  classId: number | null;
  items: LabItem[];
  total: number;
}

export interface LabRoute {
  name: string;
  id: number;
  route: string;
}

export interface LabGameCreated {
  id: number;
  classId: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UploadLabGameInput {
  subjectId: number;
  classId: number;
  name: string;
  contentBase64: string;
}

export interface UpdateLabGameInput {
  subjectId?: number;
  classId?: number;
  name?: string;
  content?: string;
  contentBase64?: string;
}

export interface LabGameUpdated {
  id: number;
  subjectId: number;
  classId: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
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

/**
 * List a subject's lab games.
 *
 * `classId: null` means "all classes": the POST endpoint requires a classId, so
 * that case goes through `GET /api/lab/games/{subject_id}`, where both filters
 * are optional. The GET returns the leaner item shape (no per-item classId).
 */
export async function fetchLabGames(
  subjectId: number,
  classId: number | null,
  name?: string,
): Promise<LabGamesResponse> {
  const trimmed = name?.trim();
  let response: Response;
  try {
    if (classId === null) {
      const query = new URLSearchParams();
      if (trimmed) query.set("name", trimmed);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      response = await fetch(`${API_BASE}/lab/games/${subjectId}${suffix}`);
    } else {
      response = await fetch(`${API_BASE}/lab/games/${subjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmed ? { classId, name: trimmed } : { classId }),
      });
    }
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

function decodeBase64Utf8(input: string): string {
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Decode a lab item's base64-encoded HTML for inline rendering (iframe srcDoc).
 * Falls back to the raw content if it is not valid base64 (plain HTML/URL).
 */
export function decodeLabItemHtml(item: LabItem): string {
  try {
    return decodeBase64Utf8(item.content);
  } catch {
    return item.content;
  }
}

function encodeBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * UTF-8-safe base64 encoder for HTML content — mirror of `decodeBase64Utf8`.
 * Used by the upload page to encode raw HTML into `contentBase64`.
 */
export function toContentBase64(input: string): string {
  return encodeBase64Utf8(input);
}

/**
 * Create a lab-game record on the external backend.
 * POST /api/lab/games with { subjectId, classId, name, contentBase64 }.
 */
export async function uploadLabGame(input: UploadLabGameInput): Promise<LabGameCreated> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/lab/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось загрузить игру (${response.status})`));
  }

  return (await response.json()) as LabGameCreated;
}

/**
 * Partially update a lab-game record by id.
 * PATCH /api/lab/games/{game_id} with any subset of
 * { subjectId, classId, name, content, contentBase64 }.
 */
export async function updateLabGame(
  gameId: number,
  input: UpdateLabGameInput,
): Promise<LabGameUpdated> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/lab/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось обновить игру (${response.status})`));
  }

  return (await response.json()) as LabGameUpdated;
}

/**
 * Delete a lab-game record by id.
 * DELETE /api/lab/games/{game_id} — returns 204 on success.
 */
export async function deleteLabGame(gameId: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/lab/games/${gameId}`, {
      method: "DELETE",
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Не удалось удалить игру (${response.status})`));
  }
}

export function openLabItemContent(item: LabItem): void {
  try {
    const html = decodeBase64Utf8(item.content);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    // Fallback for non-base64 content (if backend returns a plain URL/path)
    window.open(item.content, "_blank", "noopener,noreferrer");
  }
}
