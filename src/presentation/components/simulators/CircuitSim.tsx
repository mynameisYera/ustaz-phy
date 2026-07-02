import { useState } from "react";
import { Sidebar } from "../primitives/Sidebar";
import { SectionLabel } from "../primitives/SectionLabel";
import { ModePills } from "../primitives/ModePills";
import { SliderRow } from "../primitives/SliderRow";
import { Canvas } from "../primitives/Canvas";
import { FormulaChip } from "../primitives/FormulaChip";
import { GameButton } from "../primitives/GameButton";
import "../../styles/simulator.css";
import "../../styles/primitives.css";

const CIRCUIT_MODES = [
  { id: "series",   label: "Тізбекті" },
  { id: "parallel", label: "Параллель" },
];

export function CircuitSim() {
  const [circuitMode, setCircuitMode] = useState("series");
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(100);

  const current = voltage / resistance;
  const power = voltage * current;

  return (
    <div className="sim-layout">
      <Sidebar width={400}>
        <header className="sim-panel-header">
          <h1>Электр тізбегі</h1>
          <p>Ом заңы · қуат · тізбек схемасы</p>
        </header>

        <section className="sim-section">
          <GameButton onClick={() => {}}>🎯 Ойын: Тап</GameButton>
        </section>

        <section className="sim-section">
          <SectionLabel num={1}>Тізбек түрі</SectionLabel>
          <ModePills modes={CIRCUIT_MODES} value={circuitMode} onChange={setCircuitMode} />
        </section>

        <section className="sim-section">
          <SectionLabel num={2}>Кернеу</SectionLabel>
          <SliderRow
            label="U"
            value={voltage}
            unit="В"
            min={1}
            max={50}
            onChange={setVoltage}
          />
        </section>

        <section className="sim-section">
          <SectionLabel num={3}>Кедергі</SectionLabel>
          <SliderRow
            label="R"
            value={resistance}
            unit="Ом"
            min={10}
            max={1000}
            step={10}
            onChange={setResistance}
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
            <div><dt>I</dt><dd>{current.toFixed(3)} А</dd></div>
            <div><dt>P</dt><dd>{power.toFixed(2)} Вт</dd></div>
            <div><dt>U</dt><dd>{voltage} В</dd></div>
            <div><dt>R</dt><dd>{resistance} Ом</dd></div>
          </dl>
        </section>
      </Sidebar>

      <div className="sim-resizer" role="separator" aria-orientation="vertical" />

      <section className="sim-playground">
        <Canvas
          formulas={
            <>
              <FormulaChip>U = IR</FormulaChip>
              <FormulaChip>P = UI</FormulaChip>
              <FormulaChip>R = ρL/A</FormulaChip>
            </>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: "#334155",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "3rem" }}>🔌</span>
            <span style={{ fontSize: "1.1rem", color: "#475569", fontWeight: 600 }}>
              Электр тізбегі симуляторы
            </span>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Жақында қосылады</span>
          </div>
        </Canvas>
      </section>
    </div>
  );
}
