import {
  FRICTION_COEFF,
  GRAVITY,
  computePhysics,
  createCube,
  type InteractionMode,
} from "./energy";

export type HiddenParam = "mass" | "energy" | "angle" | "velocity" | "distance";

export interface GameChallenge {
  mode: InteractionMode;
  mass: number;
  energy: number;
  angle: number;
  hidden: HiddenParam;
  correctAnswer: number;
  question: string;
  unit: string;
}

const HIDDEN_BY_MODE: Record<InteractionMode, HiddenParam[]> = {
  drop: ["mass", "energy", "distance"],
  push: ["mass", "energy", "velocity", "distance"],
  throw: ["mass", "energy", "angle", "velocity", "distance"],
};

const MODE_LABELS: Record<InteractionMode, string> = {
  push: "Итеру",
  throw: "Лақтыру",
  drop: "Түсіру (v₀ = 0)",
};

function velocityQuestion(mode: InteractionMode): string {
  if (mode === "throw") return "Лақтырудың бастапқы жылдамдығын табыңыз";
  return "Итергеннен кейінгі жылдамдықты табыңыз";
}

function distanceQuestion(mode: InteractionMode): string {
  if (mode === "drop") return "Түсу биіктігі h табыңыз";
  if (mode === "throw") return "Ұшу қашықтығы L табыңыз";
  return "Тоқтауға дейінгі жол L табыңыз";
}

export function questionForHidden(hidden: HiddenParam, mode: InteractionMode): string {
  switch (hidden) {
    case "mass":
      return "Болат кубтың массасын табыңыз";
    case "energy":
      return mode === "drop" ? "Ep потенциалдық энергиясын табыңыз" : "Ek кинетикалық энергиясын табыңыз";
    case "angle":
      return "Лақтыру бұрышын θ табыңыз";
    case "velocity":
      return velocityQuestion(mode);
    case "distance":
      return distanceQuestion(mode);
  }
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function roundMass(v: number): number {
  return Math.round(v * 2) / 2;
}

function roundEnergy(v: number): number {
  return Math.round(v * 2) / 2;
}

function answerForHidden(
  hidden: HiddenParam,
  mode: InteractionMode,
  mass: number,
  energy: number,
  angle: number
): number {
  const physics = computePhysics(createCube(mass), energy, mode, angle);
  switch (hidden) {
    case "mass":
      return mass;
    case "energy":
      return energy;
    case "angle":
      return angle;
    case "velocity":
      return physics.velocity;
    case "distance":
      return mode === "drop" ? (physics.heightM ?? 0) : physics.distanceM;
  }
}

export function generateGameChallenge(): GameChallenge {
  const mode = pick<InteractionMode>(["push", "throw", "drop"]);
  const mass = roundMass(1 + Math.random() * 19);
  const energy = roundEnergy(3 + Math.random() * 27);
  const angle = Math.round(15 + Math.random() * 55);
  const hidden = pick(HIDDEN_BY_MODE[mode]);
  const correctAnswer = answerForHidden(hidden, mode, mass, energy, angle);
  const unit =
    hidden === "mass" ? "кг" : hidden === "angle" ? "°" : hidden === "energy" ? "Дж" : hidden === "velocity" ? "м/с" : "м";

  return {
    mode,
    mass,
    energy,
    angle,
    hidden,
    correctAnswer,
    question: `${questionForHidden(hidden, mode)} (${unit})`,
    unit,
  };
}

export function checkGameAnswer(challenge: GameChallenge, raw: string): boolean {
  const given = Number(raw.replace(",", ".").trim());
  if (!Number.isFinite(given)) return false;

  const expected = challenge.correctAnswer;
  const absTol =
    challenge.hidden === "angle" ? 1.5 : challenge.hidden === "mass" ? 0.25 : 0.15;
  const relTol = 0.03;

  return Math.abs(given - expected) <= Math.max(absTol, Math.abs(expected) * relTol);
}

export function getModeLabel(mode: InteractionMode): string {
  return MODE_LABELS[mode];
}

export function distanceSymbol(mode: InteractionMode): string {
  return mode === "drop" ? "h" : "L";
}

export function showsAfterExperiment(
  challenge: GameChallenge,
  param: HiddenParam | "velocity"
): boolean {
  if (param === challenge.hidden) return false;
  if (challenge.mode === "drop" && param === "velocity") return false;

  switch (challenge.hidden) {
    case "mass":
    case "energy":
    case "angle":
      return param === "distance";
    case "velocity":
    case "distance":
      return false;
    default:
      return false;
  }
}

export function needsExperiment(challenge: GameChallenge): boolean {
  return ["mass", "energy", "angle"].includes(challenge.hidden);
}

export function getGameHint(challenge: GameChallenge): string {
  const g = `g = ${GRAVITY} м/с²`;
  const { mode, hidden } = challenge;

  if (mode === "drop") {
    if (hidden === "mass") {
      return `Дене бастапқы жылдамдықсыз (v₀ = 0) қояды. Тәжірибені іске қосып, h өлшеңіз, Ep = mgh, ${g} қолданыңыз.`;
    }
    if (hidden === "energy") {
      return `v₀ = 0. Тәжірибені іске қосып, h біліңіз, содан кейін Ep = mgh, ${g}.`;
    }
    return `v₀ = 0. m және Ep берілген. Биіктік: h = Ep/(mg), ${g}. Тәжірибе міндетті емес.`;
  }

  if (mode === "push") {
    const mu = `μ = ${FRICTION_COEFF}`;
    if (hidden === "mass") {
      return `Тәжірибені іске қосып, L өлшеңіз. Формула: Ek = μmgL, одан m, ${g}, ${mu}.`;
    }
    if (hidden === "energy") {
      return `Тәжірибені іске қосып, L өлшеңіз. Формула: Ek = μmgL, ${g}, ${mu}.`;
    }
    if (hidden === "distance") {
      return `m және Ek берілген. Жол: L = Ek/(μmg), ${g}, ${mu}.`;
    }
    return `m және Ek берілген. Жылдамдық: v = √(2Ek/m).`;
  }

  if (hidden === "mass") {
    return `Тәжірибені іске қосып, L өлшеңіз. m = 2Ek·sin(2θ)/(g·L), ${g}.`;
  }
  if (hidden === "energy") {
    return `Тәжірибені іске қосып, L өлшеңіз. Ek = m·g·L/(2·sin(2θ)), ${g}.`;
  }
  if (hidden === "angle") {
    return `Тәжірибені іске қосып, L өлшеңіз. sin(2θ) = L·g/v², v = √(2Ek/m), ${g}.`;
  }
  if (hidden === "distance") {
    return `m, Ek және θ берілген. Қашықтық: L = Ek·sin(2θ)/(mg), ${g}.`;
  }
  return `m және Ek берілген. Жылдамдық: v = √(2Ek/m).`;
}
