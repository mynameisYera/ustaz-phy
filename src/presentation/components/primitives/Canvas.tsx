import type { ReactNode } from "react";

interface CanvasProps {
  scaleLabel?: string;
  trajectoryLabel?: string;
  headerActions?: ReactNode;
  expanded?: boolean;
  onToggleExpand?: () => void;
  formulas?: ReactNode;
  children: ReactNode;
}

export function Canvas({
  scaleLabel,
  trajectoryLabel,
  headerActions,
  expanded,
  onToggleExpand,
  formulas,
  children,
}: CanvasProps) {
  return (
    <div className="prim-canvas">
      <div className="prim-canvas-header">
        <span className="prim-canvas-title">Тәжірибе экраны</span>
        <div className="prim-canvas-header-right">
          {scaleLabel && <span className="prim-canvas-scale">{scaleLabel}</span>}
          {trajectoryLabel && <span className="prim-canvas-traj">{trajectoryLabel}</span>}
          {headerActions}
          {onToggleExpand && (
            <button type="button" className="prim-canvas-expand-btn" onClick={onToggleExpand}>
              {expanded ? "Жию" : "Алаңды кеңейту"}
            </button>
          )}
        </div>
      </div>

      <div className="prim-canvas-body">{children}</div>

      {formulas && <div className="prim-canvas-formula-bar">{formulas}</div>}
    </div>
  );
}
