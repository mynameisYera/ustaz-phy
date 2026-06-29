import type { CSSProperties, ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
  width?: number;
}

export function Sidebar({ children, width }: SidebarProps) {
  const style: CSSProperties = width !== undefined ? { width } : {};
  return (
    <aside className="prim-sidebar" style={style}>
      <div className="prim-sidebar-scroll">{children}</div>
    </aside>
  );
}
