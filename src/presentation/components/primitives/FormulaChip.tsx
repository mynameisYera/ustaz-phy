import type { ReactNode } from "react";

export function FormulaChip({ children }: { children: ReactNode }) {
  return <code className="prim-formula-chip">{children}</code>;
}
