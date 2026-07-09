import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabGameCard } from './LabShell';
import { LabFilters, LabGamesStatus, InlineGamePanel, labItemsToCards } from './LabGamesPanel';
import { useLabGames } from '@/presentation/hooks/useLabGames';
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
  const { status, error, subjectId, items, classId, search, setSearch, selectClass, activeGame, setActiveGame, reload } =
    useLabGames('geography', 'География пәні табылмады');

  const backendGames = status === 'ready' ? labItemsToCards(items, setActiveGame, activeGame?.id) : [];

  const staticGames: LabGameCard[] = [
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

  const games = [...staticGames, ...backendGames];

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
      gamesExtra={
        <>
          <LabFilters classId={classId} onSelectClass={selectClass} search={search} onSearchChange={setSearch} />
          <LabGamesStatus status={status} error={error} onRetry={subjectId ? reload : undefined} />
        </>
      }
      calculator={activeGame ? <InlineGamePanel game={activeGame} onBack={() => setActiveGame(null)} /> : <GeographyMapPanel />}
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

const MAP_MIN_HEIGHT = 460;

function GeographyMapPanel() {
  const [tab, setTab] = useState<Tab>('grade7');
  const [fullscreen, setFullscreen] = useState(false);
  const [debugValues, setDebugValues] = useState<{ center: [number, number]; zoom: number; pitch: number; bearing: number } | null>(null);
  const [measureValues, setMeasureValues] = useState<{ distanceKm: number | null; pointCount: number } | null>(null);
  const [terrainNote, setTerrainNote] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState({ width: 880, height: 520 });

  const hostRef = useRef<HTMLDivElement>(null);
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
    const host = hostRef.current;
    if (!host) return;

    const measure = () => ({
      width: Math.max(280, Math.floor(host.clientWidth)),
      height: Math.max(MAP_MIN_HEIGHT, Math.floor(host.clientHeight)),
    });

    setMapSize(measure());

    const observer = new ResizeObserver(() => {
      setMapSize(measure());
    });
    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    mapRef.current?.resize();
  }, [mapSize, fullscreen]);

  useEffect(() => {
    setDebugValues(null);
    setMeasureValues(null);
    setTerrainNote(null);
    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [tab]);

  useEffect(() => {
    if (!fullscreen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen]);

  const taskText =
    activeConfig.objective === 'measure_distance'
      ? 'Екі қаланы шертіп, олардың арақашықтығын есептеңіз.'
      : activeConfig.mode === 'globe'
        ? 'Жер шарын еркін бұрап, айналдырып қарап шығыңыз.'
        : '3D камераны еркін бұрап, ғимараттар мен рельефті зерттеңіз.';

  return (
    <div className={`lab-ggb-wrap${fullscreen ? ' lab-ggb-wrap--fullscreen' : ''}`}>
      <button
        type="button"
        className="lab-ggb-fs-btn"
        onClick={() => setFullscreen((v) => !v)}
        title={fullscreen ? 'Толық экраннан шығу (Esc)' : 'Толық экран'}
        aria-label={fullscreen ? 'Толық экраннан шығу' : 'Толық экран'}
      >
        {fullscreen ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
          </svg>
        )}
      </button>

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
        {!fullscreen && <div className="lab-panel-task">{taskText}</div>}
        <div ref={hostRef} className="lab-ggb-host">
          <MapEngine key={activeConfig.id} width={mapSize.width} height={mapSize.height} styleUrl={activeConfig.styleUrl} onReady={handleReady} />
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
    </div>
  );
}
