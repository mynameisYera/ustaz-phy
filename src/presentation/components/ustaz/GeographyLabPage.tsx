import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapEngine } from '@/infrastructure/geography/MapEngine';
import { setupGeoTask, type GeoTaskRuntimeState } from '@/infrastructure/geography/GeoTaskConfig';
import { GEO_TASK_CONFIGS } from '@/infrastructure/geography/geoTaskConfigs';

type Tab = 'grade7' | 'grade8' | 'grade11';

const TAB_TO_CONFIG_ID: Record<Tab, string> = {
  grade7: 'grade-7-geo',
  grade8: 'grade-8-geo',
  grade11: 'grade-11-geo',
};

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
    <div className="min-h-screen bg-neutral-50 font-sans">
      <header className="border-b border-neutral-200 bg-white px-10 py-5">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900">
          Geography Labs — MapLibre Engine (spike)
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Бір компонент, екі config: төмендегі таб арасын ауыстырып көріңіз.
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-10 py-8 pb-20">
        <div className="mb-5 flex gap-2">
          <TabButton active={tab === 'grade7'} onClick={() => setTab('grade7')} label="7-сынып" />
          <TabButton active={tab === 'grade8'} onClick={() => setTab('grade8')} label="8-сынып" />
          <TabButton active={tab === 'grade11'} onClick={() => setTab('grade11')} label="11-сынып" />
        </div>

        <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Тапсырма</p>
          <p className="text-base text-neutral-900">
            {activeConfig.objective === 'measure_distance'
              ? 'Екі қаланы шертіп, олардың арақашықтығын есептеңіз.'
              : activeConfig.mode === 'globe'
                ? 'Жер шарын еркін бұрап, айналдырып қарап шығыңыз.'
                : '3D камераны еркін бұрап, ғимараттар мен рельефті зерттеңіз.'}
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-3">
          <MapEngine key={activeConfig.id} width={880} height={520} styleUrl={activeConfig.styleUrl} onReady={handleReady} />
        </div>

        {terrainNote && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {terrainNote}
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-5 font-mono text-sm text-neutral-300">
          <p className="mb-2.5 text-[11px] uppercase tracking-wide text-emerald-300">
            Debug panel — live MapLibre camera values
          </p>
          {!debugValues && <p>Map жүктелуде…</p>}
          {debugValues && (
            <>
              <p>center = [{debugValues.center[0].toFixed(4)}, {debugValues.center[1].toFixed(4)}]</p>
              <p>zoom = {debugValues.zoom.toFixed(2)}</p>
              <p>pitch = {debugValues.pitch.toFixed(1)}°</p>
              <p>bearing = {debugValues.bearing.toFixed(1)}°</p>
              {activeConfig.objective === 'measure_distance' && (
                <p className="mt-2 text-amber-300">
                  {measureValues?.distanceKm != null
                    ? `distance = ${measureValues.distanceKm.toFixed(1)} km`
                    : `points clicked = ${measureValues?.pointCount ?? 0} / 2`}
                </p>
              )}
            </>
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
