import { useMemo, useState } from 'react';
import '@/presentation/styles/chem-lab.css';

const CHALK_FORMULAS = [
  { text: 'H₂O', top: '8%', left: '4%', rot: '-12deg', delay: '0s' },
  { text: 'NaCl → Na⁺ + Cl⁻', top: '18%', right: '6%', rot: '8deg', delay: '1.2s' },
  { text: 'pH = -log[H⁺]', top: '42%', left: '2%', rot: '6deg', delay: '0.6s' },
  { text: '2H₂ + O₂ → 2H₂O', top: '55%', right: '3%', rot: '-10deg', delay: '1.8s' },
  { text: 'CO₂', top: '72%', left: '8%', rot: '-6deg', delay: '2.4s' },
  { text: 'n = m / M', top: '85%', right: '10%', rot: '14deg', delay: '0.3s' },
  { text: 'HCl + NaOH → NaCl + H₂O', top: '32%', left: '48%', rot: '-4deg', delay: '1s' },
  { text: 'C₆H₁₂O₆', top: '65%', left: '45%', rot: '5deg', delay: '2s' },
] as const;

/** A pH color for the liquid, from acidic (0) to basic (14). */
function phColor(ph: number): string {
  if (ph <= 3) return '#ef4444'; // strong acid — red
  if (ph <= 6) return '#f97316'; // weak acid — orange
  if (ph < 8) return '#22c55e'; // neutral — green
  if (ph <= 11) return '#0ea5e9'; // weak base — blue
  return '#7c3aed'; // strong base — violet
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

/** Static sample games — placeholder until a chemistry backend exists. */
const SAMPLE_GAMES = [
  { id: 1, icon: '⚗️', name: 'pH-микс', desc: 'Реагенттерді араластырып, ерітіндінің қышқылдығын анықтаңыз.' },
  { id: 2, icon: '🧪', name: 'Реакция балансы', desc: 'Химиялық теңдеулердің коэффициенттерін дұрыс қойыңыз. (жақында)' },
  { id: 3, icon: '🔬', name: 'Молекула құрастыру', desc: 'Атомдардан молекула жинаңыз да, атауын табыңыз. (жақында)' },
] as const;

export function ChemistryLabPage() {
  const [ph, setPh] = useState(7);
  const [activeReagent, setActiveReagent] = useState<string | null>(null);

  const color = useMemo(() => phColor(ph), [ph]);
  const verdict = useMemo(() => phVerdict(ph), [ph]);

  const applyReagent = (r: Reagent) => {
    setActiveReagent(r.id);
    setPh(r.ph);
  };

  const reset = () => {
    setPh(7);
    setActiveReagent(null);
  };

  return (
    <div className="chem-lab">
      <div className="chem-lab-formulas" aria-hidden>
        {CHALK_FORMULAS.map((f) => (
          <span
            key={f.text}
            className="chem-lab-formula"
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

      <nav className="chem-lab-nav">
        <div className="chem-lab-brand">
          <div className="chem-lab-logo" aria-hidden>
            ⚗️
          </div>
          <div>
            <p className="chem-lab-brand-title">Химия зертханасы</p>
            <p className="chem-lab-brand-sub">Ойнап үйренеміз!</p>
          </div>
        </div>
        <button type="button" className="chem-lab-back-btn" onClick={() => window.location.assign('/')}>
          ← Басты бет
        </button>
      </nav>

      <section className="chem-lab-hero">
        <div className="chem-lab-hero-inner">
          <div className="chem-lab-dot" />
          <h1 className="chem-lab-hero-title">
            <span>pH</span> симуляторы
          </h1>
          <span className="chem-lab-chip">Интерактивті</span>
        </div>
        <p className="chem-lab-hero-desc">
          Реагенттерді араластырып, ерітіндінің түсі мен қышқылдығын бақылаңыз — химияны қызықты тәжірибе ретінде көріңіз!
        </p>
      </section>

      <section className="chem-lab-sim-wrap">
        <div className="chem-lab-sim-frame">
          <div className="chem-lab-sim-label">
            <span>Интерактивті зертхана</span>
          </div>
          <div className="chem-lab-sim-body">
            <div className="chem-lab-task">
              <p className="chem-lab-task-label">Тапсырма</p>
              <p className="chem-lab-task-text">
                Реагентті таңдап немесе бегунокты жылжытып, ерітіндіні бейтарап (pH = 7) күйге келтіріңіз.
              </p>
            </div>

            <div className="chem-lab-mixer">
              <div className="chem-lab-beaker" aria-hidden>
                <div
                  className="chem-lab-liquid"
                  style={{ background: color, height: `${58 + (ph / 14) * 8}%` }}
                >
                  <span className="chem-lab-bubble" style={{ left: '25%', animationDelay: '0s' }} />
                  <span className="chem-lab-bubble" style={{ left: '55%', animationDelay: '0.8s' }} />
                  <span className="chem-lab-bubble" style={{ left: '75%', animationDelay: '1.6s' }} />
                </div>
              </div>

              <div className="chem-lab-controls">
                <div className="chem-lab-ph-display">
                  <span className="chem-lab-ph-value">{ph.toFixed(1)}</span>
                  <span className="chem-lab-ph-label">pH деңгейі</span>
                </div>

                <div
                  className="chem-lab-verdict"
                  style={{ color: verdict.color, background: verdict.bg, borderColor: verdict.color }}
                >
                  {verdict.text}
                </div>

                <div className="chem-lab-slider-row">
                  <span>Қышқылдықты реттеу: 0 (қышқыл) — 14 (негіз)</span>
                  <input
                    className="chem-lab-slider"
                    type="range"
                    min={0}
                    max={14}
                    step={0.5}
                    value={ph}
                    onChange={(e) => {
                      setPh(Number(e.target.value));
                      setActiveReagent(null);
                    }}
                  />
                </div>

                <div className="chem-lab-reagents">
                  {REAGENTS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`chem-lab-reagent${activeReagent === r.id ? ' chem-lab-reagent--active' : ''}`}
                      onClick={() => applyReagent(r)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <button type="button" className="chem-lab-reset" onClick={reset}>
                  🔄 Қайта бастау
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="chem-lab-games">
        <div className="chem-lab-games-head">
          <div className="chem-lab-games-icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="16" height="10" rx="3" />
              <circle cx="6.5" cy="11" r="1.5" />
              <circle cx="13.5" cy="11" r="1.5" />
              <path d="M8 4h4" />
            </svg>
          </div>
          <div>
            <h2 className="chem-lab-games-title">Ойын таңдаңыз</h2>
            <p className="chem-lab-games-sub">Қызықты зертханалар мен ойындар</p>
          </div>
        </div>

        <div className="chem-lab-games-grid">
          {SAMPLE_GAMES.map((game) => (
            <div key={game.id} className="chem-lab-game-card">
              <div className="chem-lab-game-thumb" aria-hidden>
                {game.icon}
              </div>
              <div className="chem-lab-game-body">
                <p className="chem-lab-game-name">{game.name}</p>
                <p className="chem-lab-game-desc">{game.desc}</p>
                <span className="chem-lab-game-cta">
                  {game.id === 1 ? 'Жоғарыда ойнаңыз ↑' : 'Жақында ⏳'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="chem-lab-footer">
        Химия зертханасы · Ustaz Chemistry · {new Date().getFullYear()} ✨
      </footer>
    </div>
  );
}
