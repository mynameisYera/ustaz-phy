import type { MaterialType } from "@/domain/physics/energy";

interface Props {
  material: MaterialType;
  size?: "sm" | "md" | "lg";
}

export function SimObjectVisual({ material, size = "md" }: Props) {
  const cls = `sim-mat sim-mat--${material} sim-mat--${size}`;
  return <div className={cls} aria-hidden />;
}
