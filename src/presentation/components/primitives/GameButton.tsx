import type { ReactNode } from "react";

interface GameButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function GameButton({ onClick, children, disabled }: GameButtonProps) {
  return (
    <button type="button" className="prim-game-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
