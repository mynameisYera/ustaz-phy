export interface SimulatorListItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface SimulatorsResponse {
  items: SimulatorListItem[];
  total: number;
}

const API_BASE = "https://uiren-backend.onrender.com/api";

interface ErrorBody {
  detail?: string;
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
  "Сервер симуляторлар тізімін бере алмады — сервер «оянуы» мүмкін. Күте тұрып, қайталаңыз.";

export async function fetchSimulators(): Promise<SimulatorsResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/simulators`);
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `Симуляторлар тізімін жүктеу мүмкін болмады (${response.status})`));
  }

  return (await response.json()) as SimulatorsResponse;
}
