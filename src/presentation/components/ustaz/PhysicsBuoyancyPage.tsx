import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/physics-spike.css';
import { PhysicsCanvas, type PhysicsWorldHandle } from '@/infrastructure/physics/PhysicsCanvas';
import {
  computeBuoyantForceMagnitude,
  computeSubmersionFraction,
  setupBuoyancyTask,
  type BuoyancyTaskConfig,
} from '@/infrastructure/physics/BuoyancyTaskConfig';
import {
  MATERIAL_PRESETS,
  buildGrade7Config,
  GRADE_11_BUOYANCY_TASK,
  type MaterialKey,
} from '@/infrastructure/physics/buoyancyTaskConfigs';

type Tab = 'grade7' | 'grade11';

interface DebugValues {
  y: number;
  submersionFraction: number;
  buoyantForce: number;
  netForce: number;
}

const GRAVITY_MS2 = 9.81;

export function PhysicsBuoyancyPage() {
  const [tab, setTab] = useState<Tab>('grade7');
  const [material, setMaterial] = useState<MaterialKey>('wood');
  const [objectDensity, setObjectDensity] = useState(700);
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [debugValues, setDebugValues] = useState<DebugValues | null>(null);

  const handleRef = useRef<PhysicsWorldHandle | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeConfig: BuoyancyTaskConfig = useMemo(() => {
    if (tab === 'grade7') return buildGrade7Config(material);
    return {
      ...GRADE_11_BUOYANCY_TASK,
      fluidDensity,
      objects: GRADE_11_BUOYANCY_TASK.objects.map((o) => ({ ...o, density: objectDensity })),
    };
  }, [tab, material, objectDensity, fluidDensity]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleReady = useCallback(
    (handle: PhysicsWorldHandle) => {
      handleRef.current = handle;
      const runtime = setupBuoyancyTask(handle.engine, activeConfig);

      const spec = activeConfig.objects[0];
      const body = runtime.bodies.get(spec.name);

      const tick = () => {
        if (body) {
          const fraction = computeSubmersionFraction(body, spec, activeConfig.waterY);
          const buoyantForce = computeBuoyantForceMagnitude(spec, fraction, activeConfig.fluidDensity, GRAVITY_MS2);
          const weight = spec.density * (spec.shape === 'circle' ? Math.PI * (spec.size / 100) ** 2 : ((spec.size * 2) / 100) ** 2) * GRAVITY_MS2;
          setDebugValues({
            y: body.position.y,
            submersionFraction: fraction,
            buoyantForce,
            netForce: buoyantForce - weight,
          });
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      stopLoop();
      tick();
    },
    [activeConfig, stopLoop]
  );

  useEffect(() => stopLoop, [stopLoop]);

  useEffect(() => {
    setDebugValues(null);
  }, [activeConfig.id, objectDensity, fluidDensity]);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <header className="border-b border-neutral-200 bg-white px-10 py-5">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900">
          Physics Labs — Matter.js Buoyancy Engine (spike)
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Бір компонент, екі config: Архимед күші custom force ретінде іске асырылған.
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-10 py-8 pb-20">
        <div className="mb-5 flex gap-2">
          <TabButton active={tab === 'grade7'} onClick={() => setTab('grade7')} label="7-сынып" />
          <TabButton active={tab === 'grade11'} onClick={() => setTab('grade11')} label="11-сынып" />
        </div>

        <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Тапсырма</p>
          <p className="text-base text-neutral-900">{activeConfig.objective}</p>
        </div>

        {tab === 'grade7' && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-5">
            <label className="text-sm text-neutral-600" htmlFor="material-select">
              Материал:
            </label>
            <select
              id="material-select"
              value={material}
              onChange={(e) => setMaterial(e.target.value as MaterialKey)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              {Object.entries(MATERIAL_PRESETS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === 'grade11' && (
          <div className="mb-5 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5">
            <SliderRow
              label="Дене тығыздығы (kg/m³)"
              value={objectDensity}
              min={100}
              max={9000}
              step={10}
              onChange={setObjectDensity}
            />
            <SliderRow
              label="Сұйықтық тығыздығы (kg/m³)"
              value={fluidDensity}
              min={500}
              max={2000}
              step={10}
              onChange={setFluidDensity}
            />
          </div>
        )}

        <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-3">
          <PhysicsCanvas
            key={activeConfig.id}
            width={activeConfig.width}
            height={activeConfig.height}
            onReady={handleReady}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-5 font-mono text-sm text-neutral-300">
          <p className="mb-2.5 text-[11px] uppercase tracking-wide text-emerald-300">
            Debug panel — live Matter.js body values
          </p>
          {!debugValues && <p>Simulation жүктелуде…</p>}
          {debugValues && activeConfig.showNumericReadout && (
            <>
              <p>y position = {debugValues.y.toFixed(1)} px</p>
              <p>submerged fraction = {(debugValues.submersionFraction * 100).toFixed(1)}%</p>
              <p>buoyant force = {debugValues.buoyantForce.toFixed(3)} N</p>
              <p className="mt-2 text-amber-300">net force = {debugValues.netForce.toFixed(3)} N</p>
            </>
          )}
          {debugValues && !activeConfig.showNumericReadout && (
            <p>
              {debugValues.submersionFraction >= 0.95
                ? 'Дене толығымен батты (sinking)'
                : debugValues.submersionFraction <= 0.05
                  ? 'Дене бетінде қалқып тұр (floating)'
                  : 'Дене жартылай батқан (partially submerged)'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'h-9 rounded-full border border-emerald-700 bg-emerald-700 px-4 text-sm font-medium text-white'
          : 'h-9 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-900'
      }
    >
      {label}
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-neutral-600">
        <span>{label}</span>
        <span className="font-mono text-neutral-900">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
