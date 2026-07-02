import { useState } from "react";
import { Sidebar } from "../primitives/Sidebar";
import { SectionLabel } from "../primitives/SectionLabel";
import { ModePills } from "../primitives/ModePills";
import { SliderRow } from "../primitives/SliderRow";
import { BodyCard } from "../primitives/BodyCard";
import { Canvas } from "../primitives/Canvas";
import { FormulaChip } from "../primitives/FormulaChip";
import { GameButton } from "../primitives/GameButton";
import "../../styles/simulator.css";
import "../../styles/primitives.css";

const FLUID_MODES = [
  { id: "water",    label: "Су" },
  { id: "seawater", label: "Теңіз суы" },
  { id: "oil",      label: "Май" },
];

const FLUID_DENSITY: Record<string, number> = {
  water: 1000,
  seawater: 1025,
  oil: 850,
};

const LIQUID_COLOR: Record<string, string> = {
  water:    "#3b82f6",
  seawater: "#1d4ed8",
  oil:      "#d97706",
};

const OBJECTS = [
  { id: "wood",  label: "Ағаш",  density: 600 },
  { id: "iron",  label: "Темір", density: 7800 },
  { id: "ice",   label: "Мұз",   density: 917 },
];

const BODY_COLOR: Record<string, string> = {
  wood: "#92400e",
  iron: "#64748b",
  ice:  "#bae6fd",
};

const G = 9.81;

// SVG layout constants
const VW = 500, VH = 420;
const TK_X = 150, TK_Y = 40, TK_W = 200, TK_H = 300;
const TK_BOTTOM = TK_Y + TK_H;                          // 340
const LIQUID_FILL = 0.78;
const LIQUID_TOP_Y = TK_Y + TK_H * (1 - LIQUID_FILL);  // ~106
const BODY_R = 28;
const BODY_CX = TK_X + TK_W / 2;                       // 250
const ARROW_MAX = 55;

export function BuoyancySim() {
  const [fluid, setFluid] = useState("water");
  const [selectedObj, setSelectedObj] = useState("wood");
  const [volume, setVolume] = useState(1);

  const rhoFluid = FLUID_DENSITY[fluid];
  const obj      = OBJECTS.find((o) => o.id === selectedObj)!;

  const floats  = obj.density < rhoFluid;
  const subFrac = floats ? obj.density / rhoFluid : 1.0;

  const mass   = obj.density * volume * 0.001;              // kg
  const weight = mass * G;                                  // N
  const F_arch = rhoFluid * G * (volume * subFrac * 0.001); // N

  // Body center Y in SVG
  // floating: subFrac fraction of diameter is below LIQUID_TOP_Y
  const bodyCY = floats
    ? LIQUID_TOP_Y + BODY_R * (2 * subFrac - 1)
    : TK_BOTTOM - BODY_R;

  // Force arrow lengths: normalize so the dominant force = ARROW_MAX
  const maxF    = Math.max(weight, F_arch, 0.01);
  const gravLen = Math.max(14, (weight / maxF) * ARROW_MAX);
  const archLen = Math.max(14, (F_arch  / maxF) * ARROW_MAX);

  // Arrow endpoints (start from body surface)
  const gStartY = bodyCY + BODY_R;
  const gEndY   = gStartY + gravLen;
  const aStartY = bodyCY - BODY_R;
  const aEndY   = aStartY - archLen;

  const liqColor   = LIQUID_COLOR[fluid];
  const bodyColor  = BODY_COLOR[selectedObj];
  const stateColor = floats ? "#22c55e" : "#ef4444";
  const stateLabel = floats ? "Жүзеді ✓" : "Батады ✗";

  return (
    <div className="sim-layout">
      <Sidebar width={400}>
        <header className="sim-panel-header">
          <h1>Жүзу симуляторы</h1>
          <p>Архимед заңы · тығыздық · итеруші күш</p>
        </header>

        <section className="sim-section">
          <GameButton onClick={() => {}}>🎯 Ойын: Тап</GameButton>
        </section>

        <section className="sim-section">
          <SectionLabel num={1}>Сұйықтық</SectionLabel>
          <ModePills modes={FLUID_MODES} value={fluid} onChange={setFluid} />
        </section>

        <section className="sim-section">
          <SectionLabel num={2}>Дене</SectionLabel>
          {OBJECTS.map((o) => (
            <BodyCard
              key={o.id}
              selected={selectedObj === o.id}
              onClick={() => setSelectedObj(o.id)}
            >
              <span>{o.label}</span>
              <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#64748b" }}>
                {o.density} кг/м³
              </span>
            </BodyCard>
          ))}
        </section>

        <section className="sim-section">
          <SectionLabel num={3}>Көлем</SectionLabel>
          <SliderRow
            label="V"
            value={volume}
            unit="дм³"
            min={0.1}
            max={10}
            step={0.1}
            onChange={setVolume}
          />
        </section>

        <section className="sim-section sim-section-last">
          <button type="button" className="sim-apply-btn">
            Іске қосу
          </button>
        </section>

        <section className="sim-metrics" style={{ marginTop: 8 }}>
          <h2>Көрсеткіштер</h2>
          <dl>
            <div><dt>Fа</dt><dd>{F_arch.toFixed(2)} Н</dd></div>
            <div><dt>G</dt><dd>{weight.toFixed(2)} Н</dd></div>
            <div><dt>Батқан</dt><dd>{(subFrac * 100).toFixed(0)} %</dd></div>
            <div>
              <dt>Күй</dt>
              <dd style={{ color: stateColor }}>
                {floats ? "Жүзеді" : "Батады"}
              </dd>
            </div>
          </dl>
        </section>
      </Sidebar>

      <div className="sim-resizer" role="separator" aria-orientation="vertical" />

      <section className="sim-playground">
        <Canvas
          formulas={
            <>
              <FormulaChip>Fа = ρgV</FormulaChip>
              <FormulaChip>G = mg</FormulaChip>
              <FormulaChip>ρ = m/V</FormulaChip>
            </>
          }
        >
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%"
               style={{ display: "block" }}>

            <defs>
              <clipPath id="buoy-tank-clip">
                <rect x={TK_X + 2} y={TK_Y + 2} width={TK_W - 4} height={TK_H - 4} />
              </clipPath>
            </defs>

            {/* Liquid fill */}
            <rect
              x={TK_X + 2} y={LIQUID_TOP_Y}
              width={TK_W - 4}
              height={TK_BOTTOM - LIQUID_TOP_Y - 2}
              fill={liqColor} opacity={0.45}
              clipPath="url(#buoy-tank-clip)"
            />

            {/* Tank walls */}
            <rect x={TK_X} y={TK_Y} width={TK_W} height={TK_H}
              fill="none" stroke="#64748b" strokeWidth={3} rx={4} />

            {/* Liquid surface dashes */}
            <line
              x1={TK_X + 4} y1={LIQUID_TOP_Y}
              x2={TK_X + TK_W - 4} y2={LIQUID_TOP_Y}
              stroke={liqColor} strokeWidth={2}
              strokeDasharray="6 3" opacity={0.9}
            />

            {/* Body circle */}
            <circle cx={BODY_CX} cy={bodyCY} r={BODY_R}
              fill={bodyColor} stroke="#1e293b" strokeWidth={2} />
            <text x={BODY_CX} y={bodyCY + 4}
              textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
              {obj.label}
            </text>

            {/* Gravity arrow (red, down) */}
            <line
              x1={BODY_CX} y1={gStartY}
              x2={BODY_CX} y2={gEndY - 9}
              stroke="#ef4444" strokeWidth={3} strokeLinecap="round"
            />
            <polygon
              points={`${BODY_CX},${gEndY} ${BODY_CX - 6},${gEndY - 10} ${BODY_CX + 6},${gEndY - 10}`}
              fill="#ef4444"
            />
            <text
              x={BODY_CX + 10} y={(gStartY + gEndY) / 2 + 5}
              fill="#ef4444" fontSize="13" fontWeight="bold"
            >G</text>

            {/* Buoyancy arrow (green, up) */}
            <line
              x1={BODY_CX} y1={aStartY}
              x2={BODY_CX} y2={aEndY + 9}
              stroke="#22c55e" strokeWidth={3} strokeLinecap="round"
            />
            <polygon
              points={`${BODY_CX},${aEndY} ${BODY_CX - 6},${aEndY + 10} ${BODY_CX + 6},${aEndY + 10}`}
              fill="#22c55e"
            />
            <text
              x={BODY_CX + 10} y={(aStartY + aEndY) / 2 + 5}
              fill="#22c55e" fontSize="13" fontWeight="bold"
            >Fа</text>

            {/* Fluid density (right of tank) */}
            <text x={TK_X + TK_W + 12} y={LIQUID_TOP_Y + 14}
              fill="#94a3b8" fontSize="12">ρ_ж = {rhoFluid}</text>
            <text x={TK_X + TK_W + 12} y={LIQUID_TOP_Y + 28}
              fill="#94a3b8" fontSize="11">кг/м³</text>

            {/* Object density (right, at body level) */}
            <text x={TK_X + TK_W + 12} y={bodyCY - 4}
              fill="#94a3b8" fontSize="12">ρ_д = {obj.density}</text>
            <text x={TK_X + TK_W + 12} y={bodyCY + 10}
              fill="#94a3b8" fontSize="11">кг/м³</text>

            {/* State label */}
            <text x={VW / 2} y={VH - 10} textAnchor="middle"
              fill={stateColor} fontSize="15" fontWeight="bold">
              {stateLabel}
            </text>
          </svg>
        </Canvas>
      </section>
    </div>
  );
}
