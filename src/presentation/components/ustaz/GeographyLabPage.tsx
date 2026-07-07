import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapEngine } from '@/infrastructure/geography/MapEngine';
import { setupGeoTask, type GeoTaskRuntimeState } from '@/infrastructure/geography/GeoTaskConfig';
import { GEO_TASK_CONFIGS } from '@/infrastructure/geography/geoTaskConfigs';
import '@/presentation/styles/geo-lab.css';

type Tab = 'grade7' | 'grade8' | 'grade11';

const TAB_TO_CONFIG_ID: Record<Tab, string> = {
  grade7: 'grade-7-geo',
  grade8: 'grade-8-geo',
  grade11: 'grade-11-geo',
};

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'grade7', label: '7-сынып' },
  { id: 'grade8', label: '8-сынып' },
  { id: 'grade11', label: '11-сынып' },
];

const CHALK_FORMULAS = [
  { text: 'd = R · Δσ', top: '8%', left: '4%', rot: '-12deg', delay: '0s' },
  { text: 'lat / lon', top: '18%', right: '6%', rot: '8deg', delay: '1.2s' },
  { text: 'R⊕ ≈ 6371 км', top: '42%', left: '2%', rot: '6deg', delay: '0.6s' },
  { text: 'N 43° · E 76°', top: '55%', right: '3%', rot: '-10deg', delay: '1.8s' },
  { text: '360° меридиан', top: '72%', left: '8%', rot: '-6deg', delay: '2.4s' },
  { text: 'h = рельеф', top: '85%', right: '10%', rot: '14deg', delay: '0.3s' },
  { text: 'azimuth θ', top: '32%', left: '50%', rot: '-4deg', delay: '1s' },
  { text: 'экватор 0°', top: '65%', left: '45%', rot: '5deg', delay: '2s' },
] as const;

interface DebugValues {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

interface MeasureValues {
  distanceKm: number | null;
  pointCount: number;
}

export function GeographyLabPage() {
  const [tab, setTab] = useState<Tab>('grade7');
  const [debugValues, setDebugValues] = useState<DebugValues | null>(null);
  const [measureValues, setMeasureValues] = useState<MeasureValues | null>(null);
  const [terrainNote, setTerrainNote] = useState<string | null>(null);

  const mapRef = useRef<maplibregl.Map | null>(null);
  const runtimeRef = useRef<GeoTaskRuntimeState | null>(null);

  const activeConfig = GEO_TASK_CONFIGS.find((c) => c.id === TAB_TO_CONFIG_ID[tab])!;

  const handleReady = useCallback(
    (map: maplibregl.Map) => {
      mapRef.current = map;

      const runtime = setupGeoTask(map, activeConfig);
      runtimeRef.current = runtime;
      setTerrainNote(runtime.terrainNote);
      runtime.onMeasureUpdate = (distanceKm, pointCount) => setMeasureValues({ distanceKm, pointCount });

      const readCamera = () => {
        const center = map.getCenter();
        setDebugValues({
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      };

      readCamera();
      map.on('move', readCamera);
    },
    [activeConfig]
  );

  useEffect(() => {
    setDebugValues(null);
    setMeasureValues(null);
    setTerrainNote(null);
    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [tab]);

  return (
    <div className="geo-lab">
      <div className="geo-lab-formulas" aria-hidden>
        {CHALK_FORMULAS.map((f) => (
          <span
            key={f.text}
            className="geo-lab-formula"
            style={{
              top: f.top,
              left: (f as { left?: string }).left,
              right: (f as { right?: string }).right,
            }}
          >
            {f.text}
          </span>
        ))}
      </div>

      <nav className="geo-lab-nav">
        <div className="geo-lab-brand">
          <div className="geo-lab-logo" aria-hidden>
            🌍
          </div>
          <div>
            <p className="geo-lab-brand-title">География зертханасы</p>
            <p className="geo-lab-brand-sub">Ойнап үйренеміз!</p>
          </div>
        </div>
        <button type="button" className="geo-lab-back-btn" onClick={() => window.location.assign('/')}>
          ← Басты бет
        </button>
      </nav>

      <section className="geo-lab-hero">
        <div className="geo-lab-hero-inner">
          <div className="geo-lab-dot" />
          <h1 className="geo-lab-hero-title">
            <span>MapLibre</span> зертханасы
          </h1>
          <span className="geo-lab-chip">Интерактивті</span>
        </div>
        <p className="geo-lab-hero-desc">
          Жер шарын бұрап, қалалар арасын өлшеп, рельефті зерттеп — географияны қызықты тәжірибе ретінде көріңіз!
        </p>

        <div className="geo-lab-tabs">
          {TAB_LABELS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`geo-lab-tab${tab === t.id ? ' geo-lab-tab--active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="geo-lab-sim-wrap">
        <div className="geo-lab-sim-frame">
          <div className="geo-lab-sim-label">
            <span>Интерактивті зертхана</span>
          </div>
          <div className="geo-lab-sim-body">
            <div className="geo-lab-task">
              <p className="geo-lab-task-label">Тапсырма</p>
              <p className="geo-lab-task-text">
                {activeConfig.objective === 'measure_distance'
                  ? 'Екі қаланы шертіп, олардың арақашықтығын есептеңіз.'
                  : activeConfig.mode === 'globe'
                    ? 'Жер шарын еркін бұрап, айналдырып қарап шығыңыз.'
                    : '3D камераны еркін бұрап, ғимараттар мен рельефті зерттеңіз.'}
              </p>
            </div>

            <div className="geo-lab-applet">
              <MapEngine key={activeConfig.id} width={880} height={520} styleUrl={activeConfig.styleUrl} onReady={handleReady} />
            </div>

            {terrainNote && (
              <div className="geo-lab-note">
                <span aria-hidden>⛰️</span>
                <span>{terrainNote}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="geo-lab-debug">
        <p className="geo-lab-debug-title">Debug panel — live MapLibre camera values</p>
        {!debugValues && <p>Map жүктелуде…</p>}
        {debugValues && (
          <>
            <p>center = [{debugValues.center[0].toFixed(4)}, {debugValues.center[1].toFixed(4)}]</p>
            <p>zoom = {debugValues.zoom.toFixed(2)}</p>
            <p>pitch = {debugValues.pitch.toFixed(1)}°</p>
            <p>bearing = {debugValues.bearing.toFixed(1)}°</p>
            {activeConfig.objective === 'measure_distance' && (
              <p className="geo-lab-debug-ref">
                {measureValues?.distanceKm != null
                  ? `distance = ${measureValues.distanceKm.toFixed(1)} km`
                  : `points clicked = ${measureValues?.pointCount ?? 0} / 2`}
              </p>
            )}
          </>
        )}
      </div>

      <footer className="geo-lab-footer">
        География зертханасы · Ustaz Geography · {new Date().getFullYear()} ✨
      </footer>
    </div>
  );
}
