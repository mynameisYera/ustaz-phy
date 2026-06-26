export type MaterialType = "steel-cube";

export interface SimObject {
  id: string;
  name: string;
  mass: number;
  material: MaterialType;
  color: string;
  springK?: number;
}

export const STEEL_CUBE: SimObject = {
  id: "cube",
  name: "Стальной куб",
  mass: 2,
  material: "steel-cube",
  color: "#64748b",
};

export function createCube(massKg: number): SimObject {
  return { ...STEEL_CUBE, mass: massKg };
}

export const ARENA_ORIGIN_X = 40;
export const ARENA_GROUND_BOTTOM = 84;
export const BASE_PPM = 70;
export const MAX_PPM = 160;
export const MIN_VIEW_WIDTH_M = 2.5;
export const MIN_VIEW_HEIGHT_M = 2;
export const DEFAULT_VIEW_WIDTH_M = 8;
export const DEFAULT_VIEW_HEIGHT_M = 6;
export const VIEW_PADDING_M = 0.6;

function niceRulerStep(minStep: number): number {
  const steps = [1, 2, 5, 10, 20, 50];
  return steps.find((s) => s >= minStep) ?? 1;
}

export function rulerTicks(maxM: number, ppm = BASE_PPM): number[] {
  const minLabelPx = 36;
  const minStepM = minLabelPx / Math.max(ppm, 1);
  const step = niceRulerStep(minStepM);

  const ticks: number[] = [];
  for (let m = 0; m <= maxM + 0.001; m += step) {
    ticks.push(Math.round(m));
  }

  return [...new Set(ticks)];
}

export function computeArenaView(params: {
  arenaWidth: number;
  arenaHeight: number;
  posX: number;
  posY: number;
  physics: PhysicsResult | null;
  trajectory: TrajectoryPoint[];
}): { ppm: number; widthM: number; heightM: number } {
  const { arenaWidth, arenaHeight, posX, posY, physics, trajectory } = params;

  let minX = 0;
  let minY = 0;
  let maxX = 0.4;
  let maxY = 0.4;

  const consider = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  consider(0, 0);
  consider(posX, posY);

  if (physics) {
    if (physics.mode === "push") consider(physics.distanceM, 0);
    if (physics.mode === "throw") {
      consider(physics.distanceM, physics.heightM ?? 0);
    }
    if (physics.mode === "drop") {
      consider(posX || 1.5, physics.heightM ?? 0);
    }
  }

  for (const p of trajectory) consider(p.x, p.y);

  const spanX = maxX - minX;
  const spanY = maxY - minY;

  const widthM = Math.max(spanX * 1.35 + VIEW_PADDING_M * 2, MIN_VIEW_WIDTH_M);
  const heightM = Math.max(spanY * 1.35 + VIEW_PADDING_M * 2, MIN_VIEW_HEIGHT_M);

  const usableW = Math.max(arenaWidth - ARENA_ORIGIN_X - 24, 200);
  const usableH = Math.max(arenaHeight - ARENA_GROUND_BOTTOM - 32, 150);

  const ppm = Math.min(MAX_PPM, usableW / widthM, usableH / heightM);

  return { ppm, widthM, heightM };
}

export type InteractionMode = "push" | "throw" | "drop";

export const GRAVITY = 9.8;
export const FRICTION_COEFF = 0.12;
const FRICTION = FRICTION_COEFF;
const APPLY_DISTANCE = 0.5;

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface PhysicsResult {
  mode: InteractionMode;
  energyJ: number;
  massKg: number;
  forceN: number;
  acceleration: number;
  velocity: number;
  velocityY?: number;
  velocityX?: number;
  workJ: number;
  distanceM: number;
  heightM?: number;
  angleDeg?: number;
  flightTimeS?: number;
  explanation: string;
  solutionSteps: string[];
  isSpring: boolean;
  springCompressionM?: number;
}

function speedFromEnergy(m: number, E: number): number {
  return Math.sqrt((2 * E) / m);
}

export function computeTrajectory(
  physics: PhysicsResult,
  startX = 0
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [{ x: startX, y: physics.mode === "drop" ? (physics.heightM ?? 0) : 0 }];

  if (physics.isSpring) {
    const x = physics.springCompressionM ?? 0;
    for (let i = 0; i <= 20; i++) {
      points.push({ x: (x * i) / 20, y: 0 });
    }
    return points;
  }

  if (physics.mode === "push") {
    const steps = 40;
    for (let i = 1; i <= steps; i++) {
      points.push({ x: (physics.distanceM * i) / steps, y: 0 });
    }
    return points;
  }

  if (physics.mode === "drop") {
    const h = physics.heightM ?? 0;
    const x = startX || 1.5;
    for (let i = 0; i <= 30; i++) {
      points.push({ x, y: h - (h * i) / 30 });
    }
    points.push({ x, y: 0 });
    return points;
  }

  if (physics.mode === "throw") {
    const rad = ((physics.angleDeg ?? 45) * Math.PI) / 180;
    const v = physics.velocity;
    let state = { x: startX, y: 0.02, vx: v * Math.cos(rad), vy: v * Math.sin(rad) };
    const dt = 0.04;
    for (let i = 0; i < 300; i++) {
      state.vy -= GRAVITY * dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      if (state.y < 0) {
        points.push({ x: state.x, y: 0 });
        break;
      }
      if (i % 2 === 0) points.push({ x: state.x, y: state.y });
    }
    return points;
  }

  return points;
}

export function computePhysics(
  object: SimObject,
  energyJ: number,
  mode: InteractionMode = "push",
  angleDeg = 45
): PhysicsResult {
  const m = object.mass;
  const E = energyJ;

  if (object.springK && mode === "push") {
    const x = Math.sqrt((2 * E) / object.springK);
    const F = object.springK * x;
    const a = F / m;
    return {
      mode: "push",
      energyJ: E,
      massKg: m,
      forceN: F,
      acceleration: a,
      velocity: 0,
      workJ: E,
      distanceM: x,
      explanation:
        `Энергия ${E.toFixed(1)} Дж сжала стальную пружину на ${x.toFixed(2)} м. ` +
        `Упругая сила F = kx = ${F.toFixed(1)} Н.`,
      solutionSteps: [
        `Дано: E = ${E} Дж, k = ${object.springK} Н/м, m = ${m} кг`,
        `½kx² = E  →  x = √(2E/k) = √(2·${E}/${object.springK}) = ${x.toFixed(3)} м`,
        `F = k·x = ${object.springK}·${x.toFixed(3)} = ${F.toFixed(2)} Н`,
        `a = F/m = ${F.toFixed(2)}/${m} = ${a.toFixed(2)} м/с²`,
        `Ответ: сжатие ${x.toFixed(2)} м, сила ${F.toFixed(1)} Н`,
      ],
      isSpring: true,
      springCompressionM: x,
    };
  }

  const v = speedFromEnergy(m, E);

  if (mode === "drop") {
    const h = E / (m * GRAVITY);
    const fallTime = Math.sqrt((2 * h) / GRAVITY);
    const vyImpact = GRAVITY * fallTime;
    return {
      mode: "drop",
      energyJ: E,
      massKg: m,
      forceN: m * GRAVITY,
      acceleration: GRAVITY,
      velocity: vyImpact,
      velocityY: vyImpact,
      workJ: E,
      distanceM: 0,
      heightM: h,
      flightTimeS: fallTime,
      explanation:
        `Объект с высоты ${h.toFixed(2)} м. Потенциальная энергия Ep = mgh = ${E.toFixed(1)} Дж ` +
        `превратилась в кинетическую. Скорость удара ${vyImpact.toFixed(2)} м/с.`,
      solutionSteps: [
        `Дано: E = Ep = ${E} Дж, m = ${m} кг, g = ${GRAVITY} м/с²`,
        `Ep = mgh  →  h = E/(mg) = ${E}/(${m}·${GRAVITY}) = ${h.toFixed(3)} м`,
        `Свободное падение: h = gt²/2  →  t = √(2h/g) = ${fallTime.toFixed(3)} с`,
        `v = gt = ${GRAVITY}·${fallTime.toFixed(3)} = ${vyImpact.toFixed(2)} м/с`,
        `Проверка: Ek = ½mv² = 0.5·${m}·${vyImpact.toFixed(2)}² ≈ ${E.toFixed(1)} Дж ✓`,
        `Ответ: высота ${h.toFixed(2)} м, время ${fallTime.toFixed(2)} с, v = ${vyImpact.toFixed(2)} м/с`,
      ],
      isSpring: false,
    };
  }

  if (mode === "throw") {
    const rad = (angleDeg * Math.PI) / 180;
    const vx = v * Math.cos(rad);
    const vy = v * Math.sin(rad);
    const flightTime = (2 * vy) / GRAVITY;
    const range = vx * flightTime;
    const maxH = (vy * vy) / (2 * GRAVITY);
    const force = E / APPLY_DISTANCE;

    return {
      mode: "throw",
      energyJ: E,
      massKg: m,
      forceN: force,
      acceleration: force / m,
      velocity: v,
      velocityX: vx,
      velocityY: vy,
      workJ: E,
      distanceM: range,
      heightM: maxH,
      angleDeg,
      flightTimeS: flightTime,
      explanation:
        `Бросок под ${angleDeg}°. v = ${v.toFixed(2)} м/с, дальность ${range.toFixed(2)} м, ` +
        `макс. высота ${maxH.toFixed(2)} м.`,
      solutionSteps: [
        `Дано: E = ${E} Дж, m = ${m} кг, θ = ${angleDeg}°, g = ${GRAVITY} м/с²`,
        `Ek = E:  ½mv² = ${E}  →  v = √(2E/m) = √(2·${E}/${m}) = ${v.toFixed(3)} м/с`,
        `vx = v·cosθ = ${v.toFixed(3)}·cos${angleDeg}° = ${vx.toFixed(3)} м/с`,
        `vy = v·sinθ = ${v.toFixed(3)}·sin${angleDeg}° = ${vy.toFixed(3)} м/с`,
        `Время полёта: t = 2vy/g = ${flightTime.toFixed(3)} с`,
        `Дальность: L = vx·t = ${range.toFixed(3)} м`,
        `Макс. высота: H = vy²/(2g) = ${maxH.toFixed(3)} м`,
        `Работа: W = F·s = ${force.toFixed(1)}·${APPLY_DISTANCE} ≈ ${E} Дж`,
        `Ответ: L = ${range.toFixed(2)} м, H = ${maxH.toFixed(2)} м, t = ${flightTime.toFixed(2)} с`,
      ],
      isSpring: false,
    };
  }

  const force = E / APPLY_DISTANCE;
  const acceleration = force / m;
  const distance = E / (FRICTION * m * GRAVITY);

  return {
    mode: "push",
    energyJ: E,
    massKg: m,
    forceN: force,
    acceleration,
    velocity: v,
    workJ: E,
    distanceM: distance,
    explanation:
      `Толчок ${E.toFixed(1)} Дж → v = ${v.toFixed(2)} м/с. Путь до остановки ${distance.toFixed(2)} м.`,
    solutionSteps: [
      `Дано: E = ${E} Дж, m = ${m} кг, μ = ${FRICTION}, g = ${GRAVITY} м/с²`,
      `½mv² = E  →  v = √(2E/m) = ${v.toFixed(3)} м/с`,
      `F = W/s = E/s = ${E}/${APPLY_DISTANCE} = ${force.toFixed(2)} Н`,
      `a = F/m = ${acceleration.toFixed(3)} м/с²`,
      `Путь до остановки: L = E/(μmg) = ${distance.toFixed(3)} м`,
      `Ответ: v = ${v.toFixed(2)} м/с, L = ${distance.toFixed(2)} м`,
    ],
    isSpring: false,
  };
}

export interface MotionState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

export function stepProjectile(state: MotionState, dt: number): MotionState {
  const vy = state.vy - GRAVITY * dt;
  const x = state.x + state.vx * dt;
  const y = state.y + state.vy * dt;
  const speed = Math.sqrt(state.vx * state.vx + vy * vy);
  return { x, y, vx: state.vx, vy, speed };
}

export function stepDrop(state: MotionState, dt: number): MotionState {
  const vy = state.vy - GRAVITY * dt;
  const y = state.y + state.vy * dt;
  const speed = Math.abs(vy);
  return { x: state.x, y, vx: 0, vy, speed };
}

export function pixelsPerMeter(): number {
  return BASE_PPM;
}
