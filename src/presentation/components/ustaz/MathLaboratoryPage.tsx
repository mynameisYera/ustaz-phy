import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabGameCard } from './LabShell';
import { GeoGebraApplet, type GeoGebraApi } from '@/infrastructure/geogebra/GeoGebraApplet';
import { fetchLabGames, fetchLabRoute, fetchLabSubjects } from '@/infrastructure/labs/LabsApi';

const CHALK_FORMULAS = [
  { text: 'a⃗ + b⃗ = c⃗', top: '4%', left: '3%' },
  { text: '|AB| = √((x₂−x₁)² + (y₂−y₁)²)', top: '7%', right: '10%' },
  { text: 'y = kx + b', top: '15%', left: '18%' },
  { text: 'S = ½ · a · h', top: '22%', right: '5%' },
  { text: 'cos α = (a⃗·b⃗)/(|a⃗|·|b⃗|)', top: '32%', left: '5%' },
  { text: 'a² + b² = c²', top: '40%', right: '14%' },
  { text: 'f(x) = ax² + bx + c', top: '50%', left: '12%' },
  { text: 'tg α = y/x', top: '58%', right: '7%' },
  { text: 'Σ aₙ = n(a₁+aₙ)/2', top: '68%', left: '4%' },
  { text: 'π ≈ 3.14159', top: '76%', right: '12%' },
  { text: '∫ f(x) dx', top: '85%', left: '16%' },
  { text: 'lim (1+1/n)ⁿ = e', top: '92%', right: '20%' },
] as const;

const LAB_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="calculator"]',
    icon: 'grid',
    title: 'Графикалық калькулятор',
    body: 'Толыққанды GeoGebra калькуляторы. Нүктелерді, векторларды, кесінділерді және функцияларды салуға болады. Жоғарыдағы құралдар тақтасын немесе сол жақтағы енгізу жолын пайдаланыңыз.',
  },
  {
    target: '[data-tour="instructions"]',
    icon: 'help',
    title: 'Тапсырма нұсқаулығы',
    body: 'Калькуляторда не және қалай салу керектігі туралы қадамдық нұсқаулар. Қадамдарды ретімен орындаңыз, төмендегі кеңес нәтижені тексеруге көмектеседі.',
  },
  {
    target: '[data-tour="games"]',
    icon: 'grid',
    title: 'Ойындар мен симуляторлар',
    body: 'Тақырып бойынша ойындар карточкалары. «Симулятор» калькулятордың үстінде жұмыс істейді және мұғалім реттейді, «Ойын» — оқушыларға арналған дербес белсенділік.',
  },
];

type LoadStatus = 'loading' | 'ready' | 'error';

function labIcon(index: number, tone: 'accent' | 'amber') {
  if (index % 2 === 0) {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={tone === 'accent' ? 'var(--accent-bright)' : '#FBBF24'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
        <line x1="4" y1="24" x2="44" y2="24" />
        <line x1="24" y1="4" x2="24" y2="44" />
        <polyline points="10,38 20,20 30,28 40,10" />
        <circle cx="20" cy="20" r="3" fill={tone === 'accent' ? 'var(--accent-bright)' : '#FBBF24'} opacity="0.25" />
        <circle cx="30" cy="28" r="3" fill={tone === 'accent' ? 'var(--accent-bright)' : '#FBBF24'} opacity="0.25" />
      </svg>
    );
  }

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={tone === 'accent' ? 'var(--accent-bright)' : '#FBBF24'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
      <polygon points="12,38 24,10 36,38" />
      <line x1="16" y1="30" x2="32" y2="30" />
      <path d="M10 14h8M28 14h8" />
    </svg>
  );
}

export function MathLaboratoryPage() {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [cards, setCards] = useState<LabGameCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLabSubjects()
      .then((subjects) => {
        const math =
          subjects.find((s) => s.name.toLowerCase() === 'math') ??
          subjects.find((s) => s.name.toLowerCase().includes('math')) ??
          null;

        if (!math) {
          setStatus('error');
          setError('Математика пәні табылмады');
          return;
        }

        setSubjectId(math.subjectId);
        setStatus('loading');
        setError(null);

        return fetchLabGames(math.subjectId).then(({ items }) => {
          const mapped: LabGameCard[] = items.map((item, index) => {
            const tone = index % 3 === 0 ? 'amber' : 'accent';
            return {
              tone,
              tag: tone === 'accent' ? 'СИМУЛЯТОР' : 'ОЙЫН',
              name: item.name,
              desc: item.content,
              icon: labIcon(index, tone),
              onClick: () => {
                void fetchLabRoute(math.subjectId).then(({ route }) => {
                  window.open(route, '_blank', 'noopener,noreferrer');
                });
              },
            };
          });

          setCards(mapped);
          setStatus('ready');
        });
      })
      .catch((e) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Зертханаларды жүктеу мүмкін болмады');
      });
  }, []);

  const reload = () => {
    if (!subjectId) return;
    setStatus('loading');
    setError(null);
    void fetchLabGames(subjectId)
      .then(({ items }) => {
        const mapped: LabGameCard[] = items.map((item, index) => {
          const tone = index % 3 === 0 ? 'amber' : 'accent';
          return {
            tone,
            tag: tone === 'accent' ? 'СИМУЛЯТОР' : 'ОЙЫН',
            name: item.name,
            desc: item.content,
            icon: labIcon(index, tone),
            onClick: () => {
              void fetchLabRoute(subjectId).then(({ route }) => {
                window.open(route, '_blank', 'noopener,noreferrer');
              });
            },
          };
        });
        setCards(mapped);
        setStatus('ready');
      })
      .catch((e) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Зертханаларды жүктеу мүмкін болмады');
      });
  };

  return (
    <LabShell
      subject="math"
      subjectIcon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16V4M4 4h8l-3 4 3 4H4" />
        </svg>
      }
      subjectTitle="Математика · Векторлар"
      subjectChip="Математика"
      tourSteps={LAB_TOUR_STEPS}
      formulas={CHALK_FORMULAS.map((f) => ({ ...f }))}
      games={cards}
      gamesExtra={
        status !== 'ready' ? (
          <div style={{ marginBottom: '12px' }}>
            {status === 'loading' && (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Жүктелуде…</div>
            )}
            {status === 'error' && (
              <div style={{ color: '#FCA5A5', fontSize: '13px' }}>
                {error ?? 'Қате шықты'}
                {subjectId && (
                  <button
                    type="button"
                    onClick={reload}
                    style={{
                      marginLeft: '10px',
                      height: '30px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    Қайталау
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null
      }
      calculator={<GeoGebraCalculator />}
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
          <p className="lab-instructions-desc">Координаталық жазықтықта екі нүкте бойынша вектор салыңыз.</p>

          <div className="lab-steps">
            <LabStep n={1} title="«Нүкте» құралын таңдаңыз" body="Құралдар тақтасындағы нүкте белгісі бар түймені басыңыз." />
            <LabStep n={2} title="A және B нүктелерін салыңыз" body="Екі нүктені орналастыру үшін жазықтықты шертіңіз." />
            <LabStep n={3} title="Вектормен қосыңыз" body="«Вектор» құралын таңдап, A → B нүктелерін қосыңыз." />
            <LabStep n={4} title="Координаталарды анықтаңыз" body="AB⃗ = (x₂−x₁, y₂−y₁) вектор координаталарын жазыңыз." inactive />
          </div>

          <LabHint label="Кеңес">AB⃗ = (3−1, −1−2) = (2, −3). Ұзындығы = √(4+9) ≈ 3.6</LabHint>
        </>
      }
    />
  );
}

const APPLET_MIN_HEIGHT = 520;

function GeoGebraCalculator() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GeoGebraApi | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Measure the host once to inject the applet at the right size, then keep it
  // in sync with container resizes via the GeoGebra setSize() API.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const width = Math.max(280, Math.floor(host.clientWidth));
      const height = Math.max(APPLET_MIN_HEIGHT, Math.floor(host.clientHeight));
      return { width, height };
    };

    setSize((prev) => prev ?? measure());

    const observer = new ResizeObserver(() => {
      const next = measure();
      setSize((prev) => {
        if (prev && prev.width === next.width && prev.height === next.height) return prev;
        return next;
      });
    });
    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  // Reflow the already-injected applet when the container size changes.
  useEffect(() => {
    if (apiRef.current && size) {
      try {
        apiRef.current.setSize(size.width, size.height);
      } catch {
        /* older builds may not expose setSize — the applet keeps its inject size */
      }
    }
  }, [size]);

  const handleReady = useCallback((api: GeoGebraApi) => {
    apiRef.current = api;
    const host = hostRef.current;
    if (host) {
      const width = Math.max(280, Math.floor(host.clientWidth));
      const height = Math.max(APPLET_MIN_HEIGHT, Math.floor(host.clientHeight));
      try {
        api.setSize(width, height);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // While fullscreen: lock page scroll and allow Esc to exit.
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

      <div ref={hostRef} className="lab-ggb-host">
        {size && (
          <GeoGebraApplet
            appName="graphing"
            width={size.width}
            height={size.height}
            showToolBar
            showAlgebraInput
            onReady={handleReady}
          />
        )}
      </div>
    </div>
  );
}
