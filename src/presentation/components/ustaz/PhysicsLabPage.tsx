import { useEffect, useState } from 'react';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint } from './LabShell';
import { LabFilters, LabGamesStatus, LabGamesEmpty, InlineGamePanel, labItemsToCards } from './LabGamesPanel';
import { EnergySimulator } from '@/presentation/components/EnergySimulator';
import { useLabGames } from '@/presentation/hooks/useLabGames';

const CHALK_FORMULAS = [
  { text: 'Ep = mgh', top: '5%', left: '4%' },
  { text: 'E = ½mv²', top: '8%', right: '12%' },
  { text: 'F = ma', top: '18%', left: '15%' },
  { text: 'W = F·s', top: '25%', right: '6%' },
  { text: 'p = mv', top: '38%', left: '3%' },
  { text: 'Ek + Ep = const', top: '45%', right: '18%' },
  { text: 'g ≈ 9.8 м/с²', top: '55%', left: '10%' },
  { text: 'v = v₀ + at', top: '65%', right: '8%' },
  { text: 's = v₀t + ½at²', top: '75%', left: '5%' },
  { text: 'F = -kx', top: '82%', right: '15%' },
  { text: 'T = 2π√(l/g)', top: '92%', left: '18%' },
] as const;

const LAB_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="calculator"]',
    icon: 'grid',
    title: 'Энергия симуляторы',
    body: 'Интерактивті физикалық симулятор — денені итеріп, лақтырып немесе түсіріп, энергияның сақталу заңын бақылаңыз.',
  },
  {
    target: '[data-tour="instructions"]',
    icon: 'help',
    title: 'Тапсырма нұсқаулығы',
    body: 'Қадам бойынша нұсқаулар — симуляторда не істеу керектігі. Төмендегі кеңес нәтижені тексеруге көмектеседі.',
  },
  {
    target: '[data-tour="games"]',
    icon: 'grid',
    title: 'Ойындар мен зертханалар',
    body: 'Тақырып бойынша ойындар карточкалары. Серверден жүктеледі.',
  },
];

export function PhysicsLabPage() {
  const { status, error, subjectId, items, classId, search, setSearch, selectClass, activeGame, setActiveGame, reload } =
    useLabGames('physics', 'Физика пәні табылмады');

  const games = status === 'ready' ? labItemsToCards(items, setActiveGame, activeGame?.id) : [];

  return (
    <LabShell
      subject="physics"
      subjectIcon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="3" />
          <path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.5 4.5l2 2M13.5 13.5l2 2M4.5 15.5l2-2M13.5 6.5l2-2" />
        </svg>
      }
      subjectTitle="Физика · Энергия"
      subjectChip="Физика"
      tourSteps={LAB_TOUR_STEPS}
      formulas={CHALK_FORMULAS.map((f) => ({ ...f }))}
      games={games}
      gamesExtra={
        <>
          <LabFilters classId={classId} onSelectClass={selectClass} search={search} onSearchChange={setSearch} />
          <LabGamesStatus status={status} error={error} onRetry={subjectId ? reload : undefined} />
          {status === 'ready' && games.length === 0 && <LabGamesEmpty search={search} />}
        </>
      }
      calculator={
        activeGame ? (
          <InlineGamePanel game={activeGame} onBack={() => setActiveGame(null)} />
        ) : (
          <PhysicsSimulatorPanel />
        )
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
          <p className="lab-instructions-desc">Энергияның сақталу заңын тәжірибе арқылы зерттеңіз.</p>

          <div className="lab-steps">
            <LabStep n={1} title="Дене мен режимді таңдаңыз" body="Болат куб, теннис доп немесе ағаш блокты таңдаңыз." />
            <LabStep n={2} title="Әрекетті бастаңыз" body="Итеру, лақтыру немесе түсіру режимін іске қосыңыз." />
            <LabStep n={3} title="Энергия графигін бақылаңыз" body="Ek және Ep мәндерінің уақыт бойынша өзгеруін көріңіз." />
            <LabStep n={4} title="Қорытынды жасаңыз" body="Ek + Ep қосындысы тұрақты қалатынын тексеріңіз." inactive />
          </div>

          <LabHint label="Кеңес">Толық механикалық энергия сақталады: Ek + Ep = const (үйкеліс болмаған жағдайда).</LabHint>
        </>
      }
    />
  );
}

function PhysicsSimulatorPanel() {
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
            <strong>Тапсырма:</strong> Денені итеріп, лақтырып немесе түсіріп, потенциалдық және кинетикалық энергияның бір-біріне айналуын бақылаңыз.
          </div>
        )}
        <div className="lab-ggb-host">
          <EnergySimulator />
        </div>
      </div>
    </div>
  );
}
