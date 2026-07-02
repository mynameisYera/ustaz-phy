interface ModePillsProps {
  modes: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function ModePills({ modes, value, onChange, disabled }: ModePillsProps) {
  return (
    <div className="prim-mode-pills">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`prim-mode-pill${value === m.id ? " prim-mode-pill--active" : ""}`}
          onClick={() => onChange(m.id)}
          disabled={disabled}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
