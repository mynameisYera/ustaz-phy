import type { ReactNode } from "react";

interface BodyCardProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function BodyCard({ selected, onClick, children }: BodyCardProps) {
  return (
    <div
      className={`prim-body-card${selected ? " prim-body-card--active" : ""}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
