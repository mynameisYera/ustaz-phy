import { useEffect, useState } from 'react';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabGameCard } from './LabShell';
import { KzHistoryCityMapGame } from './kz-history/KzHistoryCityMapGame';
import { useLabGamesCards } from '@/presentation/hooks/useLabGamesCards';

const FORMULAS = [
  { text: 'VII ғ. — Қазақ хандығы', top: '8%', left: '4%' },
  { text: '1991 — Тәуелсіздік', top: '18%', right: '6%' },
  { text: 'Абылай хан', top: '42%', left: '2%' },
  { text: 'Қазақ 3 жүз', top: '55%', right: '3%' },
  { text: 'Алтын Орда', top: '72%', left: '8%' },
  { text: 'Қараханидтер', top: '85%', right: '10%' },
];

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="calculator"]',
    icon: 'grid',
    title: 'Тарихи қалалар картасы',
    body: 'Қала атауларын картадағы дөңгелектерге сүйреп апарыңыз.',
  },
  {
    target: '[data-tour="instructions"]',
    icon: 'help',
    title: 'Нұсқаулық',
    body: 'Қадам бойынша тапсырманы орындаңыз.',
  },
  {
    target: '[data-tour="games"]',
    icon: 'grid',
    title: 'Ойындар',
    body: 'Серверден жүктелетін қосымша ойындар.',
  },
];

export function KzHistoryLabPage() {
  const { status, cards, error, subjectId, reload } = useLabGamesCards('kz', 'Қазақстан тарихы пәні табылмады');

  const staticGames: LabGameCard[] = [
    {
      tone: 'accent',
      tag: 'ОЙЫН',
      name: 'Тарихи қалалар',
      desc: 'VIII–XII ғғ. қалаларын картада дұрыс орналастырыңыз.',
      icon: <span style={{ fontSize: '40px' }}>🗺️</span>,
    },
  ];

  const games = status === 'ready' ? [...staticGames, ...cards] : staticGames;

  return (
    <LabShell
      subject="math"
      subjectIcon={<span style={{ fontSize: '18px' }}>🏛️</span>}
      subjectTitle="Қазақстан тарихы"
      subjectChip="Тарих"
      tourSteps={TOUR_STEPS}
      formulas={FORMULAS}
      games={games}
      gamesExtra={
        <>
          {status === 'loading' && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '16px' }}>Жүктелуде…</p>
          )}
          {status === 'error' && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(244,63,94,0.12)',
                border: '1px solid rgba(244,63,94,0.3)',
                color: '#fda4af',
                fontSize: '14px',
              }}
            >
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Жүктеу мүмкін болмады</p>
              <p style={{ margin: 0 }}>{error}</p>
              {subjectId && (
                <button
                  type="button"
                  onClick={reload}
                  style={{
                    marginTop: '12px',
                    height: '34px',
                    padding: '0 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Қайталау 🔄
                </button>
              )}
            </div>
          )}
        </>
      }
      calculator={<KzHistoryMapPanel />}
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
          <p className="lab-instructions-desc">Тарихи қалаларды картада дұрыс орындарға орналастырыңыз.</p>
          <div className="lab-steps">
            <LabStep n={1} title="Қала таңдаңыз" body="Сол жақтағы түсті атаулардан біреуін мышкамен ұстаңыз." />
            <LabStep n={2} title="Картаға апарыңыз" body="Атауды картадағы ақ дөңгелекке сүйреп апарыңыз." />
            <LabStep n={3} title="Барлығын орналастырыңыз" body="8 тарихи қаланың барлығын дұрыс нүктелерге қойыңыз." />
            <LabStep n={4} title="Жауап жіберіңіз" body="«Жауаптарды жіберу» батырмасын басып, нәтижені қараңыз." inactive />
          </div>
          <LabHint label="Кеңес">Тараз, Отырар, Түркістан — оңтүстік өңірдегі ежелгі қалалар; Сарайшық пен Имақия — солтүстік-шығыс бағытта.</LabHint>
        </>
      }
    />
  );
}

function KzHistoryMapPanel() {
  const [fullscreen, setFullscreen] = useState(false);

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

      <div className="lab-panel-body">
        {!fullscreen && (
          <div className="lab-panel-task">
            <strong>Тапсырма:</strong> VIII–XII ғасырлардағы тарихи қалаларды картада дұрыс орындарға орналастырыңыз.
          </div>
        )}
        <div className="lab-ggb-host">
          <KzHistoryCityMapGame fullscreen={fullscreen} />
        </div>
      </div>
    </div>
  );
}
