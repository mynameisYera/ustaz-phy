import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoGebraApplet, type GeoGebraApi } from '@/infrastructure/geogebra/GeoGebraApplet';
import { setupVectorTask } from '@/infrastructure/geogebra/VectorTaskConfig';
import { VECTOR_TASK_CONFIGS } from '@/infrastructure/geogebra/vectorTaskConfigs';
import {
  setupDistanceTask,
  snapToRoads,
  travelPath,
  updateTrail,
  CAR_OBJECT_NAME,
  CAR_X_OBJECT_NAME,
  CAR_Y_OBJECT_NAME,
} from '@/infrastructure/geogebra/DistanceTaskConfig';
import { DISTANCE_TASK_CONFIGS } from '@/infrastructure/geogebra/distanceTaskConfigs';

type Tab =
  | { kind: 'distance'; config: (typeof DISTANCE_TASK_CONFIGS)[number] }
  | { kind: 'vector'; config: (typeof VECTOR_TASK_CONFIGS)[number] };

const TABS: Tab[] = [
  ...DISTANCE_TASK_CONFIGS.map((config) => ({ kind: 'distance', config }) as const),
  ...VECTOR_TASK_CONFIGS.map((config) => ({ kind: 'vector', config }) as const),
];

interface VectorDebugValues {
  kind: 'vector';
  vectorReadouts: { name: string; value: string }[];
  referenceValue: string | null;
}

interface DistanceDebugValues {
  kind: 'distance';
  distanceValue: string | null;
}

type DebugValues = VectorDebugValues | DistanceDebugValues;

export function MathGeoGebraPage() {
  const [activeTabId, setActiveTabId] = useState(TABS[0].config.id);
  const [debugValues, setDebugValues] = useState<DebugValues | null>(null);
  const apiRef = useRef<GeoGebraApi | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const activeTab = TABS.find((t) => t.config.id === activeTabId)!;

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const handleReady = useCallback(
    (api: GeoGebraApi) => {
      apiRef.current = api;

      if (activeTab.kind === 'vector') {
        const config = activeTab.config;
        setupVectorTask(api, config);

        const readValues = () => {
          if (!apiRef.current) return;
          const vectorReadouts = config.vectors.map((v) => ({
            name: v.name,
            value: apiRef.current!.getValueString(v.name),
          }));
          const referenceValue = apiRef.current.exists(config.referenceObjectName)
            ? apiRef.current.getValueString(config.referenceObjectName)
            : null;
          setDebugValues({ kind: 'vector', vectorReadouts, referenceValue });
        };

        readValues();
        for (const v of config.vectors) {
          api.registerObjectUpdateListener(v.name, readValues);
        }
        stopPolling();
        pollIntervalRef.current = window.setInterval(readValues, 500);
        return;
      }

      const config = activeTab.config;
      setupDistanceTask(api, config);
      let snapping = false;
      let lastTrailSig = '';

      const readValues = () => {
        if (!apiRef.current || snapping) return;
        if (!apiRef.current.exists(CAR_X_OBJECT_NAME) || !apiRef.current.exists(CAR_Y_OBJECT_NAME)) {
          setDebugValues({ kind: 'distance', distanceValue: null });
          return;
        }
        const px = apiRef.current.getValue(CAR_X_OBJECT_NAME);
        const py = apiRef.current.getValue(CAR_Y_OBJECT_NAME);

        // Snap the dragged car onto the nearest road (taxicab streets).
        const [sx, sy] = snapToRoads(config, px, py);
        if (Math.hypot(px - sx, py - sy) > 1e-3) {
          snapping = true;
          apiRef.current.evalCommand(`SetCoords(${CAR_OBJECT_NAME}, ${sx}, ${sy})`);
          snapping = false;
        }

        // Trace the taxicab route from the start intersection and show its length.
        const { path, length } = travelPath(config, sx, sy);
        const sig = path.map((p) => p.join(':')).join('|');
        if (sig !== lastTrailSig) {
          updateTrail(apiRef.current, path);
          lastTrailSig = sig;
        }
        setDebugValues({ kind: 'distance', distanceValue: length.toFixed(2) });
      };

      readValues();
      api.registerObjectUpdateListener(CAR_OBJECT_NAME, readValues);
      stopPolling();
      pollIntervalRef.current = window.setInterval(readValues, 200);
    },
    [activeTab, stopPolling]
  );

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    setDebugValues(null);
  }, [activeTabId]);

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF6', fontFamily: 'inherit' }}>
      <header style={{ borderBottom: '1px solid #E6E2D8', background: '#FFFFFF', padding: '20px 40px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '26px', letterSpacing: '-0.01em', margin: 0, color: '#1A1A17' }}>
          Math Labs — GeoGebra
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '14px', margin: '6px 0 0' }}>
          Сынып бойынша тапсырманы таңдаңыз.
        </p>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px 80px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.config.id}
              type="button"
              onClick={() => setActiveTabId(tab.config.id)}
              style={{
                height: '38px',
                padding: '0 18px',
                borderRadius: '19px',
                border: activeTabId === tab.config.id ? '1px solid #1E6E5C' : '1px solid #E6E2D8',
                background: activeTabId === tab.config.id ? '#1E6E5C' : '#FFFFFF',
                color: activeTabId === tab.config.id ? '#FFFFFF' : '#1A1A17',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: activeTabId === tab.config.id ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              {tab.config.label}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF', padding: '20px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6F6E66', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Тапсырма
          </p>
          <p style={{ margin: 0, fontSize: '16px', color: '#1A1A17' }}>{activeTab.config.objective}</p>
        </div>

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF', padding: '12px', marginBottom: '20px' }}>
          <GeoGebraApplet
            key={activeTab.config.id}
            appName={activeTab.config.appName}
            width={880}
            height={520}
            showToolBar={activeTab.config.showToolBar}
            showAlgebraInput={activeTab.config.showAlgebraInput}
            perspective={activeTab.kind === 'vector' ? activeTab.config.perspective : undefined}
            onReady={handleReady}
          />
        </div>

        {activeTab.kind === 'distance' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #E6E2D8', borderRadius: '12px', background: '#EAF1ED', padding: '16px 20px', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', color: '#1E6E5C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Жүрген қашықтық
            </span>
            <span style={{ fontFamily: 'Spectral, serif', fontSize: '28px', fontWeight: 600, color: '#1A1A17' }}>
              {debugValues?.kind === 'distance' && debugValues.distanceValue ? `${debugValues.distanceValue} бірлік` : '…'}
            </span>
          </div>
        )}

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#1A1A17', padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px', color: '#D8D3C6' }}>
          <p style={{ margin: '0 0 10px', color: '#8FBFAF', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>
            Debug panel — live GeoGebra API values
          </p>
          {!debugValues && <p style={{ margin: 0 }}>Applet жүктелуде…</p>}
          {debugValues?.kind === 'vector' && (
            <>
              {debugValues.vectorReadouts.map((r) => (
                <p key={r.name} style={{ margin: '0 0 4px' }}>
                  {r.name} = {r.value}
                </p>
              ))}
              <p style={{ margin: '8px 0 0', color: '#C9A96A' }}>
                hidden reference = {debugValues.referenceValue ?? '…'}
              </p>
            </>
          )}
          {debugValues?.kind === 'distance' && (
            <p style={{ margin: 0, color: '#C9A96A' }}>
              distanceTraveled = {debugValues.distanceValue ?? '…'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
