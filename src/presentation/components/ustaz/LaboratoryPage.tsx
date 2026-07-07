import { useState } from 'react';
import { Tour, type TourStep } from './Tour';
import '@/presentation/styles/laboratory.css';

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
    title: 'Графический калькулятор',
    body: 'Координатная плоскость для построения точек, векторов, отрезков и фигур. Используйте панель инструментов сверху. Кнопка «На весь экран» раскроет калькулятор на весь экран.',
  },
  {
    target: '[data-tour="instructions"]',
    icon: 'help',
    title: 'Инструкция к заданию',
    body: 'Пошаговые указания — что и как построить на калькуляторе. Следуйте шагам по порядку, подсказка внизу поможет проверить результат.',
  },
  {
    target: '[data-tour="games"]',
    icon: 'grid',
    title: 'Игры и симуляторы',
    body: 'Карточки с играми по теме. «Симулятор» работает поверх калькулятора и настраивается учителем, «Игра» — самостоятельная активность для учеников.',
  },
];

interface GameCard {
  tone: 'blue' | 'amber';
  tag: string;
  name: string;
  desc: string;
  icon: JSX.Element;
}

const GAME_CARDS: GameCard[] = [
  {
    tone: 'blue',
    tag: 'СИМУЛЯТОР',
    name: 'Построение графиков',
    desc: 'Интерактивное построение линейных и квадратичных функций с параметрами.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <line x1="4" y1="24" x2="44" y2="24" />
        <line x1="24" y1="4" x2="24" y2="44" />
        <polyline points="10,38 20,20 30,28 40,10" />
        <circle cx="20" cy="20" r="3" fill="#60A5FA" opacity="0.3" />
        <circle cx="30" cy="28" r="3" fill="#60A5FA" opacity="0.3" />
      </svg>
    ),
  },
  {
    tone: 'blue',
    tag: 'СИМУЛЯТОР',
    name: 'Геометрия фигур',
    desc: 'Построение и измерение треугольников, площади и периметра на плоскости.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <polygon points="12,38 24,10 36,38" />
        <line x1="16" y1="30" x2="32" y2="30" />
        <circle cx="24" cy="10" r="2.5" fill="#60A5FA" opacity="0.3" />
        <circle cx="12" cy="38" r="2.5" fill="#60A5FA" opacity="0.3" />
        <circle cx="36" cy="38" r="2.5" fill="#60A5FA" opacity="0.3" />
      </svg>
    ),
  },
  {
    tone: 'amber',
    tag: 'ИГРА',
    name: 'Координатный бой',
    desc: 'Найди точку по координатам быстрее соперника. Игра на скорость.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#FBBF24" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <rect x="8" y="8" width="32" height="32" rx="4" />
        <path d="M16 24h16M24 16v16" />
        <circle cx="18" cy="18" r="2" fill="#FBBF24" opacity="0.3" />
        <text x="30" y="36" fill="#FBBF24" fontSize="12" fontWeight="600" opacity="0.5">?</text>
      </svg>
    ),
  },
  {
    tone: 'amber',
    tag: 'ИГРА',
    name: 'Вектор-квест',
    desc: 'Перемести персонажа с помощью векторов. Каждый уровень — новая задача.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#FBBF24" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <path d="M8 40L24 8l16 32" />
        <line x1="14" y1="30" x2="34" y2="30" />
        <path d="M24 8v32" strokeDasharray="3,3" />
      </svg>
    ),
  },
];

const TOOLS = [
  { key: 'cursor', active: false, path: 'M3 2l3 12 2-5 5-2z', fill: false },
  { key: 'point', active: true, path: '', fill: true },
  { key: 'line', active: false, path: 'M3 13L13 3', fill: false },
  { key: 'vector', active: false, path: 'M3 13L13 3M13 3H8M13 3v5', fill: false },
  { key: 'segment', active: false, path: 'M3 13L13 3', fill: false, endpoints: true },
  { key: 'polygon', active: false, path: '', fill: false, polygon: true },
] as const;

export function LaboratoryPage() {
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="lab-page">
      {showTour && <Tour steps={LAB_TOUR_STEPS} onClose={() => setShowTour(false)} />}

      <div className="lab-formulas" aria-hidden>
        {CHALK_FORMULAS.map((f) => (
          <span
            key={f.text}
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

      <div className="lab-content">
        <header className="lab-nav">
          <div className="lab-nav-left">
            <button type="button" className="lab-brand" onClick={() => window.location.assign('/')}>
              <span className="lab-brand-title">Ustaz Лаборатории</span>
            </button>
            <div className="lab-divider" />
            <div className="lab-subject-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16V4M4 4h8l-3 4 3 4H4" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="lab-subject-title">Математика · Векторы</span>
              <span className="lab-subject-chip">Математика</span>
            </div>
          </div>
          <div className="lab-nav-right">
            <button type="button" title="Как пользоваться" className="lab-icon-btn" onClick={() => setShowTour(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" className="lab-back-link" onClick={() => window.location.assign('/')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3 5 8l5 5" />
              </svg>
              На главную
            </button>
          </div>
        </header>

        <main className="lab-main">
          <div className="lab-top-row">
            <div data-tour="calculator" className="lab-calc">
              <div className="lab-toolbar">
                {TOOLS.map((tool) => (
                  <button key={tool.key} type="button" className={`lab-tool-btn${tool.active ? ' active' : ''}`}>
                    <ToolIcon tool={tool} />
                  </button>
                ))}

                <div className="lab-toolbar-divider" />

                <button type="button" className="lab-tool-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 14h8M3.5 10.5l7-7 3 3-7 7-3.5.5z" />
                  </svg>
                </button>
                <button type="button" className="lab-tool-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h6a3 3 0 0 1 0 6H8M4 6l2-2M4 6l2 2" />
                  </svg>
                </button>

                <div className="lab-toolbar-spacer" />

                <div className="lab-zoom">
                  <button type="button" className="lab-zoom-btn">−</button>
                  <span className="lab-zoom-label">100%</span>
                  <button type="button" className="lab-zoom-btn">+</button>
                </div>
                <div className="lab-toolbar-divider" />
                <button type="button" title="На весь экран" className="lab-fullscreen-btn">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
                  </svg>
                </button>
              </div>

              <div className="lab-plane">
                <CoordinatePlane />
              </div>
            </div>

            <div data-tour="instructions" className="lab-instructions">
              <div className="lab-instructions-head">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 6v5M10 14h0" />
                </svg>
                <h2 className="lab-instructions-title">Инструкция</h2>
              </div>
              <p className="lab-instructions-desc">Постройте вектор по двум точкам на координатной плоскости.</p>

              <div className="lab-steps">
                <Step n={1} title="Выберите инструмент «Точка»" body="Нажмите на кнопку с точкой на панели инструментов." />
                <Step n={2} title="Постройте точки A и B" body="Кликните на плоскости, чтобы разместить две точки." />
                <Step n={3} title="Соедините вектором" body="Выберите инструмент «Вектор» и соедините точки A → B." />
                <Step n={4} title="Определите координаты" body="Запишите координаты вектора AB⃗ = (x₂−x₁, y₂−y₁)." inactive />
              </div>

              <div className="lab-hint">
                <div className="lab-hint-label">Подсказка</div>
                <div className="lab-hint-body">Вектор AB⃗ = (3−1, −1−2) = (2, −3). Длина = √(4+9) ≈ 3.6</div>
              </div>
            </div>
          </div>

          <section data-tour="games">
            <div className="lab-games-head">
              <h2 className="lab-games-title">Выберите игру</h2>
              <span className="lab-games-count">{GAME_CARDS.length} игры</span>
            </div>

            <div className="lab-games-grid">
              {GAME_CARDS.map((card) => (
                <button key={card.name} type="button" className={`lab-card tone-${card.tone}`}>
                  <div className={`lab-card-thumb tone-${card.tone}`}>
                    {card.icon}
                    <span className={`lab-card-tag tone-${card.tone}`}>{card.tag}</span>
                  </div>
                  <div className="lab-card-body">
                    <div className="lab-card-name">{card.name}</div>
                    <div className="lab-card-desc">{card.desc}</div>
                    <span className={`lab-card-cta tone-${card.tone}`}>
                      Открыть игру <span>→</span>
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

function Step({ n, title, body, inactive }: { n: number; title: string; body: string; inactive?: boolean }) {
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

function ToolIcon({ tool }: { tool: (typeof TOOLS)[number] }) {
  if (tool.key === 'point') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="#2563EB" stroke="none">
        <circle cx="8" cy="8" r="4" />
      </svg>
    );
  }
  if (tool.key === 'segment') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.6" strokeLinecap="round">
        <path d="M3 13L13 3" />
        <circle cx="3" cy="13" r="1.5" fill="#6F6E66" />
        <circle cx="13" cy="3" r="1.5" fill="#6F6E66" />
      </svg>
    );
  }
  if (tool.key === 'polygon') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="8,2 14,12 2,12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth={tool.key === 'cursor' ? 1.4 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d={tool.path} />
    </svg>
  );
}

function CoordinatePlane() {
  return (
    <svg viewBox="0 0 800 460" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="smallGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E6E2D8" strokeWidth="0.5" />
        </pattern>
        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="url(#smallGrid)" />
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#D8D3C6" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <line x1="400" y1="0" x2="400" y2="460" stroke="#1A1A17" strokeWidth="1.2" />
      <line x1="0" y1="230" x2="800" y2="230" stroke="#1A1A17" strokeWidth="1.2" />

      <polygon points="400,4 396,14 404,14" fill="#1A1A17" />
      <polygon points="796,230 786,226 786,234" fill="#1A1A17" />

      <text x="408" y="16" fill="#6F6E66" fontSize="13" fontFamily="Inter,sans-serif">y</text>
      <text x="784" y="248" fill="#6F6E66" fontSize="13" fontFamily="Inter,sans-serif">x</text>

      <text x="240" y="248" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle">−2</text>
      <text x="320" y="248" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle">−1</text>
      <text x="480" y="248" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle">1</text>
      <text x="560" y="248" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle">2</text>
      <text x="640" y="248" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle">3</text>
      <text x="720" y="248" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="middle">4</text>

      <text x="388" y="154" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="end">1</text>
      <text x="388" y="74" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="end">2</text>
      <text x="388" y="314" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="end">−1</text>
      <text x="388" y="394" fill="#A6A498" fontSize="11" fontFamily="Inter,sans-serif" textAnchor="end">−2</text>

      <circle cx="480" cy="70" r="6" fill="#2563EB" />
      <text x="492" y="66" fill="#2563EB" fontSize="14" fontWeight="600" fontFamily="Inter,sans-serif">A (1, 2)</text>

      <circle cx="640" cy="310" r="6" fill="#2563EB" />
      <text x="652" y="306" fill="#2563EB" fontSize="14" fontWeight="600" fontFamily="Inter,sans-serif">B (3, −1)</text>

      <line x1="480" y1="70" x2="640" y2="310" stroke="#2563EB" strokeWidth="2.2" />
      <polygon points="640,310 624,298 630,314" fill="#2563EB" />

      <text x="570" y="178" fill="#2563EB" fontSize="13" fontWeight="500" fontFamily="Inter,sans-serif" transform="rotate(56.3, 570, 178)">AB⃗</text>

      <circle cx="320" cy="150" r="5" fill="#DC2626" />
      <text x="296" y="142" fill="#DC2626" fontSize="13" fontWeight="600" fontFamily="Inter,sans-serif">C (−1, 1)</text>

      <text x="408" y="246" fill="#6F6E66" fontSize="12" fontFamily="Inter,sans-serif">0</text>
    </svg>
  );
}
