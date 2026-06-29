import { useEffect, useRef, useState } from "react";

export type SimId = "energy" | "circuit" | "lens" | "buoyancy";

export const SIMULATORS: { id: SimId; label: string; icon: string }[] = [
  { id: "energy",   label: "Энергия симуляторы", icon: "⚡" },
  { id: "circuit",  label: "Электр тізбегі",     icon: "🔌" },
  { id: "lens",     label: "Линза симуляторы",    icon: "🔍" },
  { id: "buoyancy", label: "Жүзу симуляторы",     icon: "💧" },
];

interface TopBarProps {
  activeSim: SimId;
  onSimChange: (id: SimId) => void;
  onStudioClick: () => void;
  studioActive?: boolean;
}

export function TopBar({ activeSim, onSimChange, onStudioClick, studioActive = false }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = SIMULATORS.find((s) => s.id === activeSim)!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const isSimActive = !studioActive;

  return (
    <nav className="top-bar">
      <div className="top-bar-left" ref={wrapRef}>
        <button
          type="button"
          className={[
            "top-bar-pill",
            open ? "top-bar-pill--open" : "",
            isSimActive ? "top-bar-pill--current" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>
            {active.icon}&nbsp;{active.label}
          </span>
          <span className="top-bar-chevron" aria-hidden="true">
            ▾
          </span>
        </button>

        {open && (
          <ul className="top-bar-menu" role="listbox" aria-label="Симулятор таңдау">
            {SIMULATORS.map((s) => {
              const isSel = s.id === activeSim && isSimActive;
              return (
                <li
                  key={s.id}
                  role="option"
                  aria-selected={isSel}
                  className={`top-bar-menu-item${isSel ? " top-bar-menu-item--active" : ""}`}
                  onClick={() => {
                    onSimChange(s.id);
                    setOpen(false);
                  }}
                >
                  <span className="top-bar-menu-icon">{s.icon}</span>
                  <span>{s.label}</span>
                  {isSel && (
                    <span className="top-bar-menu-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={`top-bar-studio${studioActive ? " top-bar-studio--active" : ""}`}
        onClick={onStudioClick}
      >
        🎮 Game Studio (ЖИ)
      </button>
    </nav>
  );
}
