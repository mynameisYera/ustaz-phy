import type { GeoGebraApi, GeoGebraAppName } from './GeoGebraApplet';

export interface LandmarkSpec {
  name: string;
  point: [number, number];
  emoji: string;
  label: string;
}

export interface DistanceTaskConfig {
  id: string;
  label: string;
  appName: GeoGebraAppName;
  showGrid: boolean;
  showAlgebraInput: boolean;
  showToolBar: boolean;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** y-values where a horizontal road runs across the whole width. */
  horizontalRoads: number[];
  /** x-values where a vertical road runs across the whole height. */
  verticalRoads: number[];
  landmarks: LandmarkSpec[];
  /** Grid intersection the car starts at and distance is measured from. */
  start: [number, number];
  objective: string;
}

export type Point = [number, number];

const CAR_NAME = 'car';
const CAR_X_NAME = 'carX';
const CAR_Y_NAME = 'carY';
const TRAIL_NAME = 'trail';

const ROAD_COLOR = '#9A968C';
const NODE_COLOR = '#2E7D32';
const CAR_COLOR = '#3B5BFF';
const TRAIL_COLOR = '#3B5BFF';

function ggbPoint([x, y]: Point): string {
  return `(${x}, ${y})`;
}

/** Runs a GeoGebra command and warns (rather than throwing) if it fails. */
function run(api: GeoGebraApi, command: string): boolean {
  const ok = api.evalCommand(command);
  if (!ok) console.warn(`[DistanceTask] GeoGebra command failed: ${command}`);
  return ok;
}

/** All grid-line intersections that fall on both a road and inside the bounds. */
export function roadIntersections(config: DistanceTaskConfig): Point[] {
  const nodes: Point[] = [];
  for (const y of config.horizontalRoads) {
    for (const x of config.verticalRoads) {
      nodes.push([x, y]);
    }
  }
  return nodes;
}

export function setupDistanceTask(api: GeoGebraApi, config: DistanceTaskConfig): void {
  api.setGridVisible(config.showGrid);
  run(api, `ZoomIn(${config.xMin}, ${config.yMin}, ${config.xMax}, ${config.yMax})`);

  // Horizontal roads (span full width).
  config.horizontalRoads.forEach((y, i) => {
    const name = `hRoad${i}`;
    run(api, `${name} = Segment((${config.xMin}, ${y}), (${config.xMax}, ${y}))`);
    run(api, `SetLineThickness(${name}, 9)`);
    run(api, `SetColor(${name}, "${ROAD_COLOR}")`);
    api.setFixed(name, true);
  });

  // Vertical roads (span full height).
  config.verticalRoads.forEach((x, i) => {
    const name = `vRoad${i}`;
    run(api, `${name} = Segment((${x}, ${config.yMin}), (${x}, ${config.yMax}))`);
    run(api, `SetLineThickness(${name}, 9)`);
    run(api, `SetColor(${name}, "${ROAD_COLOR}")`);
    api.setFixed(name, true);
  });

  // Intersection nodes.
  roadIntersections(config).forEach((node, i) => {
    const name = `node${i}`;
    run(api, `${name} = ${ggbPoint(node)}`);
    api.setFixed(name, true);
    run(api, `SetPointSize(${name}, 4)`);
    run(api, `SetColor(${name}, "${NODE_COLOR}")`);
    run(api, `ShowLabel(${name}, false)`);
  });

  // Landmarks — emoji drawn as a Text just above each point.
  config.landmarks.forEach((landmark) => {
    const [x, y] = landmark.point;
    run(api, `${landmark.name}Label = Text("${landmark.emoji}", (${x - 0.25}, ${y + 0.95}))`);
    api.setFixed(`${landmark.name}Label`, true);
  });

  // Traveled-path trail (blue), initially a degenerate segment at the start.
  const [sx, sy] = config.start;
  run(api, `${TRAIL_NAME} = Polyline((${sx}, ${sy}), (${sx}, ${sy}))`);
  run(api, `SetLineThickness(${TRAIL_NAME}, 7)`);
  run(api, `SetColor(${TRAIL_NAME}, "${TRAIL_COLOR}")`);
  run(api, `SetLineOpacity(${TRAIL_NAME}, 0.6)`);
  api.setFixed(TRAIL_NAME, true);

  // Draggable car point + an emoji that follows it.
  run(api, `${CAR_NAME} = ${ggbPoint(config.start)}`);
  run(api, `SetPointSize(${CAR_NAME}, 8)`);
  run(api, `SetColor(${CAR_NAME}, "${CAR_COLOR}")`);
  run(api, `ShowLabel(${CAR_NAME}, false)`);
  run(api, `carIcon = Text("🚗", (x(${CAR_NAME}) - 0.3, y(${CAR_NAME}) + 0.85))`);
  api.setFixed('carIcon', true);

  run(api, `${CAR_X_NAME} = x(${CAR_NAME})`);
  run(api, `${CAR_Y_NAME} = y(${CAR_NAME})`);
}

/** Snap an arbitrary dragged position to the nearest road (nearest horizontal OR vertical line). */
export function snapToRoads(config: DistanceTaskConfig, px: number, py: number): Point {
  const nearestH = nearest(config.horizontalRoads, py); // closest horizontal road (a y value)
  const nearestV = nearest(config.verticalRoads, px); // closest vertical road (an x value)

  const distToH = Math.abs(py - nearestH);
  const distToV = Math.abs(px - nearestV);

  // Clamp to bounds along the chosen road.
  if (distToH <= distToV) {
    return [clamp(px, config.xMin, config.xMax), nearestH];
  }
  return [nearestV, clamp(py, config.yMin, config.yMax)];
}

/**
 * Taxicab route along the roads from the start intersection to the car at (px, py),
 * with at most one turn, staying on road lines. Start is assumed to be a road
 * intersection (on both a horizontal and a vertical road). Returns the ordered
 * points (including start and end) and the total length.
 */
export function travelPath(config: DistanceTaskConfig, px: number, py: number): { path: Point[]; length: number } {
  const [startX, startY] = config.start;
  const end: Point = [px, py];

  const onVertical = config.verticalRoads.some((x) => approx(x, px));

  let path: Point[];
  if (onVertical) {
    // Car is on a vertical road (x = px). Travel along start's horizontal road to px,
    // then up/down that vertical road to py.
    path = [[startX, startY], [px, startY], [px, py]];
  } else {
    // Car is on a horizontal road (y = py). Travel along start's vertical road to py,
    // then across that horizontal road to px.
    path = [[startX, startY], [startX, py], [px, py]];
  }

  path = dedupe(path);
  if (path.length < 2) path = [[startX, startY], end];
  return { path, length: polylineLength(path) };
}

function polylineLength(pts: Point[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
}

function dedupe(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || !(approx(last[0], p[0]) && approx(last[1], p[1]))) out.push(p);
  }
  return out;
}

/** Redraw the blue traveled-path trail as the given polyline. */
export function updateTrail(api: GeoGebraApi, path: Point[]): void {
  const pts = path.length >= 2 ? path : [...path, ...path];
  api.evalCommand(`${TRAIL_NAME} = Polyline(${pts.map(ggbPoint).join(', ')})`);
  api.evalCommand(`SetLineThickness(${TRAIL_NAME}, 7)`);
  api.evalCommand(`SetColor(${TRAIL_NAME}, "${TRAIL_COLOR}")`);
  api.evalCommand(`SetLineOpacity(${TRAIL_NAME}, 0.6)`);
}

function nearest(values: number[], target: number): number {
  return values.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), values[0]);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-6;
}

export const CAR_OBJECT_NAME = CAR_NAME;
export const CAR_X_OBJECT_NAME = CAR_X_NAME;
export const CAR_Y_OBJECT_NAME = CAR_Y_NAME;
