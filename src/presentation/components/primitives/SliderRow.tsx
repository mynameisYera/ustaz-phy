interface SliderRowProps {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function SliderRow({ label, value, unit = "", min, max, step = 1, onChange, disabled }: SliderRowProps) {
  return (
    <div className="prim-slider-row">
      <label className="prim-slider-label">
        {label}:{" "}
        <strong>
          {value}
          {unit ? ` ${unit}` : ""}
        </strong>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
