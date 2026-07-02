import type { ReactNode } from "react";

interface SectionLabelProps {
  num: number | string;
  children: ReactNode;
}

export function SectionLabel({ num, children }: SectionLabelProps) {
  return (
    <h2 className="prim-section-label">
      <span className="prim-section-num">{num}.</span> {children}
    </h2>
  );
}
