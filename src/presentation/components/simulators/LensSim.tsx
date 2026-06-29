import { useState } from "react";
import { Sidebar } from "../primitives/Sidebar";
import { SectionLabel } from "../primitives/SectionLabel";
import { ModePills } from "../primitives/ModePills";
import { SliderRow } from "../primitives/SliderRow";
import { Canvas } from "../primitives/Canvas";
import { FormulaChip } from "../primitives/FormulaChip";
import { GameButton } from "../primitives/GameButton";

const LENS_MODES = [
  { id: "convex",  label: "Жинақтаушы" },
  { id: "concave", label: "Шашыратқыш" },
];

export function LensSim() {
  const [lensType, setLensType] = useState("convex");
  const [focalLength, setFocalLength] = useState(10);
  const [objectDist, setObjectDist] = useState(20);

  const sign = lensType === "convex" ? 1 : -1;
  const f = sign * focalLength;
  const imageDist = f !== 0 ? (objectDist * f) / (objectDist - f) : 0;
  const magnification = objectDist !== 0 ? -imageDist / objectDist : 0;

  return (
    <div className="sim-layout">
      <Sidebar width={400}>
        <header className="sim-panel-header">
          <h1>Линза симуляторы</h1>
          <p>Жұқа линза · кескін · үлкейту</p>
        </header>

        <section className="sim-section">
          <GameButton onClick={() => {}}>🎯 Ойын: Тап</GameButton>
        </section>

        <section className="sim-section">
          <SectionLabel num={1}>Линза түрі</SectionLabel>
          <ModePills modes={LENS_MODES} value={lensType} onChange={setLensType} />
        </section>

        <section className="sim-section">
          <SectionLabel num={2}>Фокус қашықтығы</SectionLabel>
          <SliderRow
            label="f"
            value={focalLength}
            unit="см"
            min={2}
            max={30}
            onChange={setFocalLength}
          />
        </section>

        <section className="sim-section">
          <SectionLabel num={3}>Заттың қашықтығы</SectionLabel>
          <SliderRow
            label="d"
            value={objectDist}
            unit="см"
            min={2}
            max={60}
            onChange={setObjectDist}
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
            <div><dt>d′</dt><dd>{imageDist.toFixed(1)} см</dd></div>
            <div><dt>Γ</dt><dd>{magnification.toFixed(2)}×</dd></div>
            <div><dt>f</dt><dd>{f} см</dd></div>
          </dl>
        </section>
      </Sidebar>

      <div className="sim-resizer" role="separator" aria-orientation="vertical" />

      <section className="sim-playground">
        <Canvas
          formulas={
            <>
              <FormulaChip>1/f = 1/d + 1/d′</FormulaChip>
              <FormulaChip>Γ = −d′/d</FormulaChip>
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
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "3rem" }}>🔍</span>
            <span style={{ fontSize: "1.1rem", color: "#475569", fontWeight: 600 }}>
              Линза симуляторы
            </span>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Жақында қосылады</span>
          </div>
        </Canvas>
      </section>
    </div>
  );
}
