import { useMemo, useState } from 'react';
import type { TourStep } from './Tour';
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabGameCard } from './LabShell';
import { LabFilters, LabGamesStatus, InlineGamePanel, labItemsToCards } from './LabGamesPanel';
import { useLabGames } from '@/presentation/hooks/useLabGames';

const CHALK_FORMULAS = [
  { text: 'H₂O', top: '8%', left: '4%' },
  { text: 'NaCl → Na⁺ + Cl⁻', top: '18%', right: '6%' },
  { text: 'pH = -log[H⁺]', top: '42%', left: '2%' },
  { text: '2H₂ + O₂ → 2H₂O', top: '55%', right: '3%' },
  { text: 'CO₂', top: '72%', left: '8%' },
  { text: 'n = m / M', top: '85%', right: '10%' },
  { text: 'HCl + NaOH → NaCl + H₂O', top: '32%', left: '48%' },
  { text: 'C₆H₁₂O₆', top: '65%', left: '45%' },
] as const;

const LAB_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="calculator"]',
    icon: 'grid',
    title: 'pH симуляторы',
    body: 'Реагенттерді араластырып немесе бегунокты жылжытып, ерітіндінің қышқылдығын өзгертіңіз.',
  },
  {
    target: '[data-tour="instructions"]',
    icon: 'help',
    title: 'Тапсырма нұсқаулығы',
    body: 'Қадам бойынша нұсқаулар — симуляторда не істеу керектігі.',
  },
  {
    target: '[data-tour="games"]',
    icon: 'grid',
    title: 'Ойындар мен зертханалар',
    body: 'Тақырып бойынша ойындар карточкалары.',
  },
];

function phColor(ph: number): string {
  if (ph <= 3) return '#ef4444';
  if (ph <= 6) return '#f97316';
  if (ph < 8) return '#22c55e';
  if (ph <= 11) return '#0ea5e9';
  return '#a78bfa';
}

function phVerdict(ph: number): { text: string; color: string; bg: string } {
  if (ph < 7) return { text: '🍋 Қышқыл (Acid)', color: '#9a3412', bg: '#ffedd5' };
  if (ph > 7) return { text: '🧼 Негіз (Base)', color: '#075985', bg: '#e0f2fe' };
  return { text: '✅ Бейтарап (Neutral)', color: '#166534', bg: '#dcfce7' };
}

interface Reagent {
  id: string;
  label: string;
  ph: number;
}

const REAGENTS: Reagent[] = [
  { id: 'lemon', label: '🍋 Лимон', ph: 2 },
  { id: 'water', label: '💧 Су', ph: 7 },
  { id: 'soap', label: '🧼 Сабын', ph: 10 },
  { id: 'bleach', label: '🧴 Хлор', ph: 13 },
];

const GAME_CARDS: LabGameCard[] = [
  {
    tone: 'accent',
    tag: 'СИМУЛЯТОР',
    name: 'pH-микс',
    desc: 'Реагенттерді араластырып, ерітіндінің қышқылдығын анықтаңыз.',
    icon: <span style={{ fontSize: '40px' }}>⚗️</span>,
  },
  {
    tone: 'amber',
    tag: 'ОЙЫН',
    name: 'Реакция балансы',
    desc: 'Химиялық теңдеулердің коэффициенттерін дұрыс қойыңыз. (жақында)',
    icon: <span style={{ fontSize: '40px' }}>🧪</span>,
    disabled: true,
  },
  {
    tone: 'amber',
    tag: 'ОЙЫН',
    name: 'Молекула құрастыру',
    desc: 'Атомдардан молекула жинаңыз да, атауын табыңыз. (жақында)',
    icon: <span style={{ fontSize: '40px' }}>🔬</span>,
    disabled: true,
  },
];

export function ChemistryLabPage() {
  const [ph, setPh] = useState(7);
  const [activeReagent, setActiveReagent] = useState<string | null>(null);

  const color = useMemo(() => phColor(ph), [ph]);
  const verdict = useMemo(() => phVerdict(ph), [ph]);

  const { status, error, subjectId, items, classId, search, setSearch, selectClass, activeGame, setActiveGame, reload } =
    useLabGames('chemistry', 'Химия пәні табылмады');

  const backendGames = status === 'ready' ? labItemsToCards(items, setActiveGame, activeGame?.id) : [];
  const games = [...GAME_CARDS, ...backendGames];

  const applyReagent = (r: Reagent) => {
    setActiveReagent(r.id);
    setPh(r.ph);
  };

  const reset = () => {
    setPh(7);
    setActiveReagent(null);
  };

  return (
    <LabShell
      subject="chemistry"
      subjectIcon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3h4M8.5 3v5l-4 8a1.5 1.5 0 0 0 1.3 2.2h8.4A1.5 1.5 0 0 0 15.5 16l-4-8V3" />
        </svg>
      }
      subjectTitle="Химия · pH"
      subjectChip="Химия"
      tourSteps={LAB_TOUR_STEPS}
      formulas={CHALK_FORMULAS.map((f) => ({ ...f }))}
      games={games}
      gamesExtra={
        <>
          <LabFilters classId={classId} onSelectClass={selectClass} search={search} onSearchChange={setSearch} />
          <LabGamesStatus status={status} error={error} onRetry={subjectId ? reload : undefined} />
        </>
      }
      calculator={
        activeGame ? (
          <InlineGamePanel game={activeGame} onBack={() => setActiveGame(null)} />
        ) : (
        <div className="lab-panel-body">
          <div style={{ flex: 1, minHeight: '460px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '24px', flexWrap: 'wrap' }}>
            <div
              aria-hidden
              style={{
                width: '120px',
                height: '220px',
                border: '3px solid #1a1a17',
                borderTop: 'none',
                borderRadius: '0 0 16px 16px',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.5)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: color,
                  height: `${58 + (ph / 14) * 8}%`,
                  transition: 'background 0.3s, height 0.3s',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '40px', fontWeight: 700, color: '#1a1a17', fontFamily: 'Spectral, serif' }}>{ph.toFixed(1)}</span>
                <span style={{ fontSize: '13px', color: '#6f6e66' }}>pH деңгейі</span>
              </div>

              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${verdict.color}`,
                  background: verdict.bg,
                  color: verdict.color,
                  fontSize: '13px',
                  fontWeight: 500,
                  width: 'fit-content',
                }}
              >
                {verdict.text}
              </div>

              <div>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#6f6e66' }}>Қышқылдықты реттеу: 0 (қышқыл) — 14 (негіз)</p>
                <input
                  type="range"
                  min={0}
                  max={14}
                  step={0.5}
                  value={ph}
                  onChange={(e) => {
                    setPh(Number(e.target.value));
                    setActiveReagent(null);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {REAGENTS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applyReagent(r)}
                    style={{
                      height: '34px',
                      padding: '0 14px',
                      border: `1px solid ${activeReagent === r.id ? 'var(--accent)' : '#e6e2d8'}`,
                      borderRadius: '8px',
                      background: activeReagent === r.id ? 'var(--accent-dim-2)' : '#ffffff',
                      color: '#1a1a17',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={reset}
                style={{
                  alignSelf: 'flex-start',
                  height: '34px',
                  padding: '0 16px',
                  border: '1px solid #e6e2d8',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#6f6e66',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🔄 Қайта бастау
              </button>
            </div>
          </div>
        </div>
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
          <p className="lab-instructions-desc">Ерітіндінің қышқылдығын өзгертіп, pH шкаласын зерттеңіз.</p>

          <div className="lab-steps">
            <LabStep n={1} title="Реагентті таңдаңыз" body="Лимон, су, сабын немесе хлорды таңдап көріңіз." />
            <LabStep n={2} title="Бегунокты жылжытыңыз" body="Қышқылдық деңгейін қолмен де реттей аласыз." />
            <LabStep n={3} title="Түс өзгерісін бақылаңыз" body="Ыдыстағы сұйықтық түсі pH мәніне байланысты өзгереді." />
            <LabStep n={4} title="Бейтарап деңгейге жеткізіңіз" body="pH = 7 мәніне жеткізіп, нәтижені тексеріңіз." inactive />
          </div>

          <LabHint label="Кеңес">pH = -log[H⁺]. pH &lt; 7 — қышқыл, pH = 7 — бейтарап, pH &gt; 7 — негіз.</LabHint>
        </>
      }
    />
  );
}
