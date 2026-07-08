import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabGameCard } from './LabShell';
import { MapEngine } from '@/infrastructure/geography/MapEngine';
import { setupGeoTask, type GeoTaskRuntimeState } from '@/infrastructure/geography/GeoTaskConfig';
import { GEO_TASK_CONFIGS } from '@/infrastructure/geography/geoTaskConfigs';

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
  { text: 'd = R · Δσ', top: '8%', left: '4%' },
  { text: 'lat / lon', top: '18%', right: '6%' },
  { text: 'R⊕ ≈ 6371 км', top: '42%', left: '2%' },
  { text: 'N 43° · E 76°', top: '55%', right: '3%' },
  { text: '360° меридиан', top: '72%', left: '8%' },
  { text: 'h = рельеф', top: '85%', right: '10%' },
  { text: 'azimuth θ', top: '32%', left: '50%' },
  { text: 'экватор 0°', top: '65%', left: '45%' },
] as const;

const LAB_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="calculator"]',
    icon: 'grid',
    title: 'Интерактивті карта',
    body: 'Жер шарын бұрап, қалалар арасын өлшеп, рельефті зерттеңіз. Сыныпты таңдау арқылы тапсырманы өзгертіңіз.',
  },
  {
    target: '[data-tour="instructions"]',
    icon: 'help',
    title: 'Тапсырма нұсқаулығы',
    body: 'Қадам бойынша нұсқаулар — картада не істеу керектігі.',
  },
  {
    target: '[data-tour="games"]',
    icon: 'grid',
    title: 'Ойындар мен зертханалар',
    body: 'Тақырып бойынша ойындар карточкалары.',
  },
];

export function GeographyLabPage() {
  const [tab, setTab] = useState<Tab>('grade7');
  const [debugValues, setDebugValues] = useState<{ center: [number, number]; zoom: number; pitch: number; bearing: number } | null>(null);
  const [measureValues, setMeasureValues] = useState<{ distanceKm: number | null; pointCount: number } | null>(null);
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

  const games: LabGameCard[] = [
    {
      tone: 'accent',
      tag: 'СИМУЛЯТОР',
      name: 'Жер шары',
      desc: 'Жер шарын еркін бұрап, континенттер мен мұхиттарды зерттеңіз.',
      icon: <span style={{ fontSize: '40px' }}>🌍</span>,
    },
    {
      tone: 'accent',
      tag: 'СИМУЛЯТОР',
      name: 'Рельеф картасы',
      desc: '3D камераны бұрап, ғимараттар мен рельефті қарап шығыңыз.',
      icon: <span style={{ fontSize: '40px' }}>🏔️</span>,
    },
    {
      tone: 'amber',
      tag: 'ОЙЫН',
      name: 'Қашықтықты тап',
      desc: 'Екі қаланы шертіп, олардың арақашықтығын дәл есептеңіз.',
      icon: <span style={{ fontSize: '40px' }}>📍</span>,
    },
    {
      tone: 'amber',
      tag: 'ОЙЫН',
      name: 'Координата-квест',
      desc: 'Координаталар бойынша орынды тауып, ұпай жинаңыз.',
      icon: <span style={{ fontSize: '40px' }}>🧭</span>,
    },
  ];

  return (
    <LabShell
      subject="geography"
      subjectIcon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="8" />
          <path d="M2 10h16M10 2a13 13 0 0 1 0 16M10 2a13 13 0 0 0 0 16" />
        </svg>
      }
      subjectTitle="География · Картография"
      subjectChip="География"
      tourSteps={LAB_TOUR_STEPS}
      formulas={CHALK_FORMULAS.map((f) => ({ ...f }))}
      games={games}
      calculator={
        <div className="lab-panel-body">
          <div className="lab-panel-toolbar">
            <div className="lab-panel-tabs">
              {TAB_LABELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`lab-panel-tab${tab === t.id ? ' active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lab-panel-task">
            {activeConfig.objective === 'measure_distance'
              ? 'Екі қаланы шертіп, олардың арақашықтығын есептеңіз.'
              : activeConfig.mode === 'globe'
                ? 'Жер шарын еркін бұрап, айналдырып қарап шығыңыз.'
                : '3D камераны еркін бұрап, ғимараттар мен рельефті зерттеңіз.'}
          </div>
          <div style={{ flex: 1, minHeight: '460px', position: 'relative' }}>
            <MapEngine key={activeConfig.id} width={880} height={520} styleUrl={activeConfig.styleUrl} onReady={handleReady} />
          </div>
          {terrainNote && (
            <div className="lab-panel-task" style={{ borderTop: '1px solid #e6e2d8', borderBottom: 'none' }}>
              ⛰️ {terrainNote}
            </div>
          )}
          {debugValues && (
            <div className="lab-panel-debug">
              <span>
                center = [<strong>{debugValues.center[0].toFixed(4)}</strong>, <strong>{debugValues.center[1].toFixed(4)}</strong>]
              </span>
              <span>
                zoom = <strong>{debugValues.zoom.toFixed(2)}</strong>
              </span>
              {activeConfig.objective === 'measure_distance' && (
                <span>
                  {measureValues?.distanceKm != null
                    ? <>distance = <strong>{measureValues.distanceKm.toFixed(1)} km</strong></>
                    : `points clicked = ${measureValues?.pointCount ?? 0} / 2`}
                </span>
              )}
            </div>
          )}
        </div>
      }
      instructions={
        <>
          <LabInstructionsHead
            title="Нұсқаулық"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v5M10 14h0" />
              </svg>
            }
          />
          <p className="lab-instructions-desc">Картамен жұмыс жасап, географиялық тапсырманы орындаңыз.</p>

          <div className="lab-steps">
            <LabStep n={1} title="Сыныпты таңдаңыз" body="Жоғарыдағы қойындылардан тапсырма деңгейін таңдаңыз." />
            <LabStep n={2} title="Картамен әрекеттесіңіз" body="Тінтуірмен бұрап, масштабтап, қажетті орынды табыңыз." />
            <LabStep n={3} title="Тапсырманы орындаңыз" body="Экран жоғарғы жағындағы тапсырма мәтінін оқып орындаңыз." />
            <LabStep n={4} title="Нәтижені тексеріңіз" body="Төмендегі debug панелінен координаталар мен қашықтықты тексеріңіз." inactive />
          </div>

          <LabHint label="Кеңес">Жердің радиусы R⊕ ≈ 6371 км. Қашықтық d = R · Δσ формуласымен есептеледі.</LabHint>
        </>
      }
    />
  );
}
