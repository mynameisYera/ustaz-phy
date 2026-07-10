import { useState, type ReactNode } from 'react';
import { Tour, type TourStep } from './Tour';
import '@/presentation/styles/laboratory.css';

export type LabSubject = 'math' | 'physics' | 'geography' | 'chemistry' | 'history';

export interface LabGameCard {
  tone: 'accent' | 'amber';
  tag: string;
  name: string;
  desc: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

interface LabShellProps {
  subject: LabSubject;
  subjectIcon: ReactNode;
  subjectTitle: string;
  subjectChip: string;
  tourSteps: TourStep[];
  formulas: { text: string; top: string; left?: string; right?: string }[];
  topBar?: ReactNode;
  calculator: ReactNode;
  instructions: ReactNode;
  games: LabGameCard[];
  gamesExtra?: ReactNode;
}

export function LabShell({
  subject,
  subjectIcon,
  subjectTitle,
  subjectChip,
  tourSteps,
  formulas,
  topBar,
  calculator,
  instructions,
  games,
  gamesExtra,
}: LabShellProps) {
  const [showTour, setShowTour] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);

  return (
    <div className="lab-page" data-subject={subject}>
      {showTour && (
        <Tour
          steps={tourSteps}
          onClose={() => setShowTour(false)}
          accentColor="var(--accent)"
          accentBg="var(--accent-dim)"
        />
      )}

      <div className="lab-formulas" aria-hidden>
        {formulas.map((f) => (
          <span key={f.text} style={{ top: f.top, left: f.left, right: f.right }}>
            {f.text}
          </span>
        ))}
      </div>

      <div className="lab-content">
        <header className="lab-nav">
          <div className="lab-nav-left">
            <button type="button" className="lab-brand" onClick={() => window.location.assign('/')}>
              <span className="lab-brand-title">Ustaz Зертханалары</span>
            </button>
            <div className="lab-divider" />
            <div className="lab-subject-icon">{subjectIcon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="lab-subject-title">{subjectTitle}</span>
              <span className="lab-subject-chip">{subjectChip}</span>
            </div>
          </div>
          <div className="lab-nav-right">
            <button type="button" title="Қалай пайдалану керек" className="lab-icon-btn" onClick={() => setShowTour(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" className="lab-back-link" onClick={() => window.location.assign('/')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3 5 8l5 5" />
              </svg>
              Басты бетке
            </button>
          </div>
        </header>

        {topBar && <div className="lab-topbar">{topBar}</div>}

        <main className="lab-main">
          <div className={`lab-top-row${instructionsOpen ? '' : ' lab-top-row--collapsed'}`}>
            <div data-tour="calculator" className="lab-calc">
              {calculator}
            </div>

            <div data-tour="instructions" className={`lab-instructions${instructionsOpen ? '' : ' lab-instructions--collapsed'}`}>
              {instructionsOpen ? (
                instructions
              ) : (
                <button
                  type="button"
                  className="lab-instructions-reopen"
                  onClick={() => setInstructionsOpen(true)}
                  title="Нұсқаулықты ашу"
                  aria-label="Нұсқаулықты ашу"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="10" r="8" />
                    <path d="M10 6v5M10 14h0" />
                  </svg>
                  <span>Нұсқаулық</span>
                </button>
              )}
              {instructionsOpen && (
                <button
                  type="button"
                  className="lab-instructions-collapse"
                  onClick={() => setInstructionsOpen(false)}
                  title="Нұсқаулықты жасыру"
                  aria-label="Нұсқаулықты жасыру"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3 5 8l5 5" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <section data-tour="games">
            <div className="lab-games-head">
              <h2 className="lab-games-title">Ойынды таңдаңыз</h2>
              <span className="lab-games-count">{games.length} ойын</span>
            </div>

            {gamesExtra}

            <div className="lab-games-grid">
              {games.map((card) => (
                <button
                  key={card.name}
                  type="button"
                  className={`lab-card tone-${card.tone}`}
                  onClick={card.onClick}
                  disabled={card.disabled}
                >
                  <div className={`lab-card-thumb tone-${card.tone}`}>
                    {card.icon}
                    <span className={`lab-card-tag tone-${card.tone}`}>{card.tag}</span>
                  </div>
                  <div className="lab-card-body">
                    <div className="lab-card-name">{card.name}</div>
                    <div className="lab-card-desc">{card.desc}</div>
                    <span className={`lab-card-cta tone-${card.tone}`}>
                      Ойынды ашу <span>→</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export function LabInstructionsHead({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="lab-instructions-head">
      {icon}
      <h2 className="lab-instructions-title">{title}</h2>
    </div>
  );
}

export function LabStep({ n, title, body, inactive }: { n: number; title: string; body: string; inactive?: boolean }) {
  return (
    <div className="lab-step">
      <div className={`lab-step-num${inactive ? ' inactive' : ''}`}>{n}</div>
      <div>
        <div className={`lab-step-title${inactive ? ' inactive' : ''}`}>{title}</div>
        <div className={`lab-step-body${inactive ? ' inactive' : ''}`}>{body}</div>
      </div>
    </div>
  );
}

export function LabHint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="lab-hint">
      <div className="lab-hint-label">{label}</div>
      <div className="lab-hint-body">{children}</div>
    </div>
  );
}
