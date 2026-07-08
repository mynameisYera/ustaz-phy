import { useEffect, useState } from 'react';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabGameCard } from './LabShell';
import { EnergySimulator } from '@/presentation/components/EnergySimulator';
import { fetchLabGames, fetchLabRoute, fetchLabSubjects, type LabItem } from '@/infrastructure/labs/LabsApi';

type LoadStatus = 'loading' | 'ready' | 'error';

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

const GAME_ICONS = ['🧪', '🚀', '⚡', '🔬', '🪐', '💡'];

function gameIcon(id: number): string {
  return GAME_ICONS[id % GAME_ICONS.length];
}

export function PhysicsLabPage() {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const loadLabs = (id: number) => {
    setStatus('loading');
    setError(null);
    void fetchLabGames(id)
      .then(({ items }) => {
        setLabs(items);
        setStatus('ready');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Зертханаларды жүктеу мүмкін болмады');
        setStatus('error');
      });
  };

  useEffect(() => {
    void fetchLabSubjects()
      .then((items) => {
        const physics =
          items.find((s) => s.name.toLowerCase() === 'physics') ??
          items.find((s) => s.name.toLowerCase().includes('physics')) ??
          null;
        if (!physics) {
          setStatus('error');
          setError('Физика пәні табылмады');
          return;
        }
        setSubjectId(physics.subjectId);
        loadLabs(physics.subjectId);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Пәндерді жүктеу мүмкін болмады');
        setStatus('error');
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

  const games: LabGameCard[] =
    status === 'ready'
      ? labs.map((lab) => ({
          tone: 'accent',
          tag: 'ЗЕРТХАНА',
          name: lab.name,
          desc: lab.content,
          icon: <span style={{ fontSize: '40px' }}>{gameIcon(lab.id)}</span>,
          onClick: () => void handleOpenLab(lab.id),
          disabled: openingId === lab.id,
        }))
      : [];

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
          {status === 'loading' && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '16px' }}>Жүктелуде…</p>}
          {status === 'error' && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', fontSize: '14px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Жүктеу мүмкін болмады</p>
              <p style={{ margin: 0 }}>{error}</p>
              {subjectId && (
                <button
                  type="button"
                  onClick={() => loadLabs(subjectId)}
                  style={{ marginTop: '12px', height: '34px', padding: '0 16px', border: 'none', borderRadius: '8px', background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}
                >
                  Қайталау 🔄
                </button>
              )}
            </div>
          )}
          {openError && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', fontSize: '14px' }}>
              {openError}
            </div>
          )}
        </>
      }
      calculator={
        <div className="lab-panel-body">
          <div className="lab-panel-task">
            <strong>Тапсырма:</strong> Денені итеріп, лақтырып немесе түсіріп, потенциалдық және кинетикалық энергияның бір-біріне айналуын бақылаңыз.
          </div>
          <div style={{ flex: 1, minHeight: '460px', position: 'relative' }}>
            <EnergySimulator />
          </div>
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
