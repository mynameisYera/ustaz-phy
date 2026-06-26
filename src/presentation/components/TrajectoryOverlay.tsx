import type { TrajectoryPoint } from "@/domain/physics/energy";
import { ARENA_GROUND_BOTTOM, ARENA_ORIGIN_X } from "@/domain/physics/energy";

interface Props {
  points: TrajectoryPoint[];
  ppm: number;
  arenaHeight: number;
  visible: boolean;
}

export function TrajectoryOverlay({ points, ppm, arenaHeight, visible }: Props) {
  if (!visible || points.length < 2) return null;

  const originX = ARENA_ORIGIN_X;
  const groundY = ARENA_GROUND_BOTTOM;

  const toSvg = (p: TrajectoryPoint) => ({
    x: originX + p.x * ppm,
    y: arenaHeight - groundY - p.y * ppm,
  });

  const d = points
    .map((p, i) => {
      const { x, y } = toSvg(p);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const last = toSvg(points[points.length - 1]);
  const first = toSvg(points[0]);

  return (
    <svg className="sim-trajectory-svg" aria-hidden>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#fbbf24" />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeDasharray="8 5"
        markerEnd="url(#arrowhead)"
        className="sim-trajectory-path"
      />
      <circle cx={first.x} cy={first.y} r="5" fill="#22c55e" opacity="0.9" />
      <circle cx={last.x} cy={last.y} r="6" fill="#ef4444" opacity="0.9" />
      <text
        x={first.x + 8}
        y={first.y - 8}
        fill="#ffffff"
        fontSize="12"
        fontWeight="600"
        stroke="#14532d"
        strokeWidth="3"
        paintOrder="stroke"
      >
        бастау
      </text>
      <text
        x={last.x + 8}
        y={last.y - 8}
        fill="#ffffff"
        fontSize="12"
        fontWeight="600"
        stroke="#7f1d1d"
        strokeWidth="3"
        paintOrder="stroke"
      >
        аяқтау
      </text>
    </svg>
  );
}
