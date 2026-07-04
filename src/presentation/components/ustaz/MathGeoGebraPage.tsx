import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoGebraApplet, type GeoGebraApi } from '@/infrastructure/geogebra/GeoGebraApplet';
import { setupVectorTask } from '@/infrastructure/geogebra/VectorTaskConfig';
import { VECTOR_TASK_CONFIGS } from '@/infrastructure/geogebra/vectorTaskConfigs';

interface DebugValues {
  vectorReadouts: { name: string; value: string }[];
  referenceValue: string | null;
}

export function MathGeoGebraPage() {
  const [activeConfigId, setActiveConfigId] = useState(VECTOR_TASK_CONFIGS[0].id);
  const [debugValues, setDebugValues] = useState<DebugValues | null>(null);
  const apiRef = useRef<GeoGebraApi | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const activeConfig = VECTOR_TASK_CONFIGS.find((c) => c.id === activeConfigId)!;

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const handleReady = useCallback(
    (api: GeoGebraApi) => {
      apiRef.current = api;
      setupVectorTask(api, activeConfig);

      const readValues = () => {
        if (!apiRef.current) return;
        const vectorReadouts = activeConfig.vectors.map((v) => ({
          name: v.name,
          value: apiRef.current!.getValueString(v.name),
        }));
        const referenceValue = apiRef.current.exists(activeConfig.referenceObjectName)
          ? apiRef.current.getValueString(activeConfig.referenceObjectName)
          : null;
        setDebugValues({ vectorReadouts, referenceValue });
      };

      readValues();

      for (const v of activeConfig.vectors) {
        api.registerObjectUpdateListener(v.name, readValues);
      }

      stopPolling();
      pollIntervalRef.current = window.setInterval(readValues, 500);
    },
    [activeConfig, stopPolling]
  );

  useEffect(() => stopPolling, [stopPolling]);

  useEffect(() => {
    setDebugValues(null);
  }, [activeConfigId]);

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF6', fontFamily: 'inherit' }}>
      <header style={{ borderBottom: '1px solid #E6E2D8', background: '#FFFFFF', padding: '20px 40px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '26px', letterSpacing: '-0.01em', margin: 0, color: '#1A1A17' }}>
          Math Labs — GeoGebra Vector Engine (spike)
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '14px', margin: '6px 0 0' }}>
          Бір компонент, екі config: төмендегі таб арасын ауыстырып көріңіз.
        </p>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px 80px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {VECTOR_TASK_CONFIGS.map((config) => (
            <button
              key={config.id}
              type="button"
              onClick={() => setActiveConfigId(config.id)}
              style={{
                height: '38px',
                padding: '0 18px',
                borderRadius: '19px',
                border: activeConfigId === config.id ? '1px solid #1E6E5C' : '1px solid #E6E2D8',
                background: activeConfigId === config.id ? '#1E6E5C' : '#FFFFFF',
                color: activeConfigId === config.id ? '#FFFFFF' : '#1A1A17',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: activeConfigId === config.id ? 500 : 400,
                cursor: 'pointer',
              }}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF', padding: '20px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6F6E66', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Тапсырма
          </p>
          <p style={{ margin: 0, fontSize: '16px', color: '#1A1A17' }}>{activeConfig.objective}</p>
        </div>

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF', padding: '12px', marginBottom: '20px' }}>
          <GeoGebraApplet
            key={activeConfig.id}
            appName={activeConfig.appName}
            width={880}
            height={520}
            showToolBar={activeConfig.showToolBar}
            showAlgebraInput={activeConfig.showAlgebraInput}
            perspective={activeConfig.perspective}
            onReady={handleReady}
          />
        </div>

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#1A1A17', padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px', color: '#D8D3C6' }}>
          <p style={{ margin: '0 0 10px', color: '#8FBFAF', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>
            Debug panel — live GeoGebra API values
          </p>
          {!debugValues && <p style={{ margin: 0 }}>Applet жүктелуде…</p>}
          {debugValues && (
            <>
              {debugValues.vectorReadouts.map((r) => (
                <p key={r.name} style={{ margin: '0 0 4px' }}>
                  {r.name} = {r.value}
                </p>
              ))}
              <p style={{ margin: '8px 0 0', color: '#C9A96A' }}>
                hidden reference ({activeConfig.referenceObjectName}) = {debugValues.referenceValue ?? '…'}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
