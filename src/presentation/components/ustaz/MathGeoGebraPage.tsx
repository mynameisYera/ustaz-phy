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
import {
  fetchLabGames,
  fetchLabRoute,
  fetchLabSubjects,
  type LabItem,
} from '@/infrastructure/labs/LabsApi';
import '@/presentation/styles/math-lab.css';

type LoadStatus = 'loading' | 'ready' | 'error';

const GAME_ICONS = ['📐', '📊', '🧮', '📏', '🔢', '✏️'];

function gameIcon(id: number): string {
  return GAME_ICONS[id % GAME_ICONS.length];
}

type Tab =
  | { kind: 'distance'; config: (typeof DISTANCE_TASK_CONFIGS)[number] }
  | { kind: 'vector'; config: (typeof VECTOR_TASK_CONFIGS)[number] };

const TABS: Tab[] = [
  ...DISTANCE_TASK_CONFIGS.map((config) => ({ kind: 'distance', config }) as const),
  ...VECTOR_TASK_CONFIGS.map((config) => ({ kind: 'vector', config }) as const),
];

const CHALK_FORMULAS = [
  { text: 'a² + b² = c²', top: '8%', left: '4%', rot: '-12deg', delay: '0s' },
  { text: '∫ f(x) dx', top: '18%', right: '6%', rot: '8deg', delay: '1.2s' },
  { text: 'y = kx + b', top: '42%', left: '2%', rot: '6deg', delay: '0.6s' },
  { text: 'sin²θ + cos²θ = 1', top: '55%', right: '3%', rot: '-10deg', delay: '1.8s' },
  { text: 'd = √(Δx² + Δy²)', top: '72%', left: '8%', rot: '-6deg', delay: '2.4s' },
  { text: 'A = πr²', top: '85%', right: '10%', rot: '14deg', delay: '0.3s' },
  { text: '|v⃗| = √(x² + y²)', top: '32%', left: '50%', rot: '-4deg', delay: '1s' },
  { text: 'f′(x) = lim Δy/Δx', top: '65%', left: '45%', rot: '5deg', delay: '2s' },
] as const;

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

  const [labStatus, setLabStatus] = useState<LoadStatus>('loading');
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [labError, setLabError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const activeTab = TABS.find((t) => t.config.id === activeTabId)!;

  const loadLabs = (id: number) => {
    setLabStatus('loading');
    setLabError(null);
    void fetchLabGames(id)
      .then(({ items }) => {
        setLabs(items);
        setLabStatus('ready');
      })
      .catch((e) => {
        setLabError(e instanceof Error ? e.message : 'Зертханаларды жүктеу мүмкін болмады');
        setLabStatus('error');
      });
  };

  useEffect(() => {
    void fetchLabSubjects()
      .then((items) => {
        const math =
          items.find((s) => s.name.toLowerCase() === 'math') ??
          items.find((s) => s.name.toLowerCase().includes('math')) ??
          null;
        if (!math) {
          setLabStatus('error');
          setLabError('Математика пәні табылмады');
          return;
        }
        setSubjectId(math.subjectId);
        loadLabs(math.subjectId);
      })
      .catch((e) => {
        setLabError(e instanceof Error ? e.message : 'Пәндерді жүктеу мүмкін болмады');
        setLabStatus('error');
      });
  }, []);

  const handleOpenLab = async (labId: number) => {
    if (!subjectId) return;
    setOpeningId(labId);
    setOpenError(null);
    try {
      const { route } = await fetchLabRoute(subjectId);
      window.open(route, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : 'Зертхананы ашу мүмкін болмады');
    } finally {
      setOpeningId(null);
    }
  };

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
    <div className="math-lab">
      <div className="math-lab-formulas" aria-hidden>
        {CHALK_FORMULAS.map((f) => (
          <span
            key={f.text}
            className="math-lab-formula"
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

      <nav className="math-lab-nav">
        <div className="math-lab-brand">
          <div className="math-lab-logo" aria-hidden>
            📐
          </div>
          <div>
            <p className="math-lab-brand-title">Математика зертханасы</p>
            <p className="math-lab-brand-sub">Ойнап үйренеміз!</p>
          </div>
        </div>
        <button type="button" className="math-lab-back-btn" onClick={() => window.location.assign('/')}>
          ← Басты бет
        </button>
      </nav>

      <section className="math-lab-hero">
        <div className="math-lab-hero-inner">
          <div className="math-lab-dot" />
          <h1 className="math-lab-hero-title">
            <span>GeoGebra</span> зертханасы
          </h1>
          <span className="math-lab-chip">Интерактивті</span>
        </div>
        <p className="math-lab-hero-desc">
          Нүктелерді жылжытып, векторлар мен қашықтықты өлшеп — математиканы қызықты тәжірибе ретінде көріңіз!
        </p>

        <div className="math-lab-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.config.id}
              type="button"
              onClick={() => setActiveTabId(tab.config.id)}
              className={`math-lab-tab${activeTabId === tab.config.id ? ' math-lab-tab--active' : ''}`}
            >
              {tab.config.label}
            </button>
          ))}
        </div>
      </section>

      <section className="math-lab-sim-wrap">
        <div className="math-lab-sim-frame">
          <div className="math-lab-sim-label">
            <span>Интерактивті зертхана</span>
          </div>
          <div className="math-lab-sim-body">
            <div className="math-lab-task">
              <p className="math-lab-task-label">Тапсырма</p>
              <p className="math-lab-task-text">{activeTab.config.objective}</p>
            </div>

            <div className="math-lab-applet">
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
              <div className="math-lab-readout">
                <span className="math-lab-readout-label">Жүрген қашықтық</span>
                <span className="math-lab-readout-value">
                  {debugValues?.kind === 'distance' && debugValues.distanceValue
                    ? `${debugValues.distanceValue} бірлік`
                    : '…'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="math-lab-debug">
        <p className="math-lab-debug-title">Debug panel — live GeoGebra API values</p>
        {!debugValues && <p>Applet жүктелуде…</p>}
        {debugValues?.kind === 'vector' && (
          <>
            {debugValues.vectorReadouts.map((r) => (
              <p key={r.name}>
                {r.name} = {r.value}
              </p>
            ))}
            <p className="math-lab-debug-ref">hidden reference = {debugValues.referenceValue ?? '…'}</p>
          </>
        )}
        {debugValues?.kind === 'distance' && (
          <p className="math-lab-debug-ref">distanceTraveled = {debugValues.distanceValue ?? '…'}</p>
        )}
      </div>

      <section className="math-lab-games">
        <div className="math-lab-games-head">
          <div className="math-lab-games-icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="16" height="10" rx="3" />
              <circle cx="6.5" cy="11" r="1.5" />
              <circle cx="13.5" cy="11" r="1.5" />
              <path d="M8 4h4" />
            </svg>
          </div>
          <div>
            <h2 className="math-lab-games-title">Ойын таңдаңыз</h2>
            <p className="math-lab-games-sub">Қызықты зертханалар мен ойындар</p>
          </div>
        </div>

        {openError && <div className="math-lab-alert">{openError}</div>}

        <div className="math-lab-games-grid">
          {labStatus === 'loading' &&
            [0, 1, 2, 3].map((i) => <div key={i} className="math-lab-skeleton" />)}

          {labStatus === 'error' && (
            <div className="math-lab-error-box">
              <p>Жүктеу мүмкін болмады</p>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{labError}</p>
              {subjectId && (
                <button type="button" className="math-lab-retry-btn" onClick={() => loadLabs(subjectId)}>
                  Қайталау 🔄
                </button>
              )}
            </div>
          )}

          {labStatus === 'ready' && labs.length === 0 && (
            <div className="math-lab-empty">
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>Ойындар әлі жоқ 🌱</p>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                Кейінірек қайта көріңіз
              </p>
            </div>
          )}

          {labStatus === 'ready' &&
            labs.map((lab) => (
              <button
                key={lab.id}
                type="button"
                className="math-lab-game-card"
                onClick={() => void handleOpenLab(lab.id)}
                disabled={openingId === lab.id}
              >
                <div className="math-lab-game-thumb" aria-hidden>
                  {gameIcon(lab.id)}
                </div>
                <div className="math-lab-game-body">
                  <p className="math-lab-game-name">{lab.name}</p>
                  <p className="math-lab-game-desc">{lab.content}</p>
                  <span className="math-lab-game-cta">
                    {openingId === lab.id ? 'Ашылуда… ⏳' : 'Ойынды ашу →'}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </section>

      <footer className="math-lab-footer">
        Математика зертханасы · Ustaz Math · {new Date().getFullYear()} ✨
      </footer>
    </div>
  );
}
