import Matter from 'matter-js';

export type FloatingShape = 'circle' | 'rectangle';

export interface FloatingObjectSpec {
  name: string;
  shape: FloatingShape;
  /** radius for circle, half-width(=half-height, square) for rectangle, in px */
  size: number;
  /** kg/m^3 */
  density: number;
  x: number;
  y: number;
  fixed: boolean;
  color: string;
}

export interface BuoyancyTaskConfig {
  id: string;
  label: string;
  width: number;
  height: number;
  /** y-coordinate (px) of the water surface */
  waterY: number;
  /** kg/m^3 */
  fluidDensity: number;
  objects: FloatingObjectSpec[];
  objective: string;
  showNumericReadout: boolean;
}

/** px -> "meters" conversion so force numbers stay in a sane physical range */
const PIXELS_PER_METER = 100;

function circleArea(radiusPx: number): number {
  const r = radiusPx / PIXELS_PER_METER;
  return Math.PI * r * r;
}

function rectangleArea(halfSidePx: number): number {
  const side = (halfSidePx * 2) / PIXELS_PER_METER;
  return side * side;
}

/**
 * Fraction of the object's height that is below the water line, clamped to [0, 1].
 * Treats circles and squares as having "height" = 2 * size for a simple, visually
 * consistent submersion estimate (not a precise chord-area integral).
 */
export function computeSubmersionFraction(body: Matter.Body, spec: FloatingObjectSpec, waterY: number): number {
  const halfHeight = spec.size;
  const top = body.position.y - halfHeight;
  const bottom = body.position.y + halfHeight;

  if (bottom <= waterY) return 0;
  if (top >= waterY) return 1;

  const submergedHeight = bottom - waterY;
  return Matter.Common.clamp(submergedHeight / (halfHeight * 2), 0, 1);
}

/** Archimedes' principle: F_buoyancy = fluid_density * submerged_volume * g */
export function computeBuoyantForceMagnitude(
  spec: FloatingObjectSpec,
  submersionFraction: number,
  fluidDensity: number,
  gravity: number
): number {
  const area = spec.shape === 'circle' ? circleArea(spec.size) : rectangleArea(spec.size);
  const submergedVolume = area * submersionFraction;
  return fluidDensity * submergedVolume * gravity;
}

export interface BuoyancyRuntimeState {
  bodies: Map<string, Matter.Body>;
  specs: Map<string, FloatingObjectSpec>;
  waterBody: Matter.Body;
}

export function setupBuoyancyTask(engine: Matter.Engine, config: BuoyancyTaskConfig): BuoyancyRuntimeState {
  const world = engine.world;

  const waterBody = Matter.Bodies.rectangle(
    config.width / 2,
    config.waterY + (config.height - config.waterY) / 2,
    config.width,
    config.height - config.waterY,
    {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: 'rgba(60, 130, 220, 0.25)' },
    }
  );

  const ground = Matter.Bodies.rectangle(config.width / 2, config.height + 25, config.width, 50, {
    isStatic: true,
    render: { visible: false },
  });
  const leftWall = Matter.Bodies.rectangle(-25, config.height / 2, 50, config.height * 2, { isStatic: true, render: { visible: false } });
  const rightWall = Matter.Bodies.rectangle(config.width + 25, config.height / 2, 50, config.height * 2, {
    isStatic: true,
    render: { visible: false },
  });

  const bodies = new Map<string, Matter.Body>();
  const specs = new Map<string, FloatingObjectSpec>();

  for (const spec of config.objects) {
    const area = spec.shape === 'circle' ? circleArea(spec.size) : rectangleArea(spec.size);
    const mass = spec.density * area;

    const body =
      spec.shape === 'circle'
        ? Matter.Bodies.circle(spec.x, spec.y, spec.size, { render: { fillStyle: spec.color } })
        : Matter.Bodies.rectangle(spec.x, spec.y, spec.size * 2, spec.size * 2, { render: { fillStyle: spec.color } });

    Matter.Body.setMass(body, mass);
    Matter.Body.setStatic(body, spec.fixed);
    (body as Matter.Body & { label: string }).label = spec.name;

    bodies.set(spec.name, body);
    specs.set(spec.name, spec);
  }

  Matter.World.add(world, [waterBody, ground, leftWall, rightWall, ...bodies.values()]);

  const gravity = engine.gravity.y * engine.gravity.scale * 1000;

  const beforeUpdateHandler = () => {
    for (const spec of specs.values()) {
      if (spec.fixed) continue;
      const body = bodies.get(spec.name);
      if (!body) continue;

      const fraction = computeSubmersionFraction(body, spec, config.waterY);
      if (fraction <= 0) continue;

      const buoyantForceMagnitude = computeBuoyantForceMagnitude(spec, fraction, config.fluidDensity, gravity);

      // Matter.Body.applyForce expects force in mass-scaled units consistent with
      // engine.gravity; divide by 1000 to bring our physical-scale Newtons back to
      // Matter's internal force scale (inverse of the gravity conversion above).
      Matter.Body.applyForce(body, body.position, { x: 0, y: -buoyantForceMagnitude / 1000 });
    }
  };

  Matter.Events.on(engine, 'beforeUpdate', beforeUpdateHandler);

  return { bodies, specs, waterBody };
}
