import { useEffect, useState } from "react";
import { EnergySimulator } from "@/presentation/components/EnergySimulator";
import {
  fetchLabGames,
  fetchLabRoute,
  fetchLabSubjects,
  type LabItem,
} from "@/infrastructure/labs/LabsApi";
import "@/presentation/styles/physics-lab.css";

type LoadStatus = "loading" | "ready" | "error";

const FORMULAS = [
  { text: "Ep = mgh", top: "5%", left: "4%" },
  { text: "E = ½mv²", top: "8%", right: "12%" },
  { text: "F = ma", top: "18%", left: "15%" },
  { text: "W = F·s", top: "25%", right: "6%" },
  { text: "p = mv", top: "38%", left: "3%" },
  { text: "Ek + Ep = const", top: "45%", right: "18%" },
  { text: "g ≈ 9.8 м/с²", top: "55%", left: "10%" },
  { text: "v = v₀ + at", top: "65%", right: "8%" },
  { text: "s = v₀t + ½at²", top: "75%", left: "5%" },
  { text: "F = -kx", top: "82%", right: "15%" },
  { text: "T = 2π√(l/g)", top: "92%", left: "18%" },
];

const TOPIC_TABS = ["Зерттеу", "Энергия", "Ойын"] as const;
const MODES = ["Итеру", "Лақтыру", "Түсіру"] as const;
const BODIES = ["Болат куб", "Теннис доп", "Ағаш блок"] as const;

const GAME_ICONS = ["🧪", "🚀", "⚡", "🔬", "🪐", "💡"];

function gameIcon(id: number): string {
  return GAME_ICONS[id % GAME_ICONS.length];
}

export function PhysicsLabPage() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const [activeTopic, setActiveTopic] = useState<(typeof TOPIC_TABS)[number]>("Энергия");
  const [activeMode, setActiveMode] = useState<(typeof MODES)[number]>("Итеру");
  const [activeBody, setActiveBody] = useState<(typeof BODIES)[number]>("Болат куб");

  const loadLabs = (id: number) => {
    setStatus("loading");
    setError(null);
    void fetchLabGames(id)
      .then(({ items }) => {
        setLabs(items);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Зертханаларды жүктеу мүмкін болмады");
        setStatus("error");
      });
  };

  useEffect(() => {
    void fetchLabSubjects()
      .then((items) => {
        const physics =
          items.find((s) => s.name.toLowerCase() === "physics") ??
          items.find((s) => s.name.toLowerCase().includes("physics")) ??
          null;
        if (!physics) {
          setStatus("error");
          setError("Физика пәні табылмады");
          return;
        }
        setSubjectId(physics.subjectId);
        loadLabs(physics.subjectId);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Пәндерді жүктеу мүмкін болмады");
        setStatus("error");
      });
  }, []);

  const handleOpenLab = async (labId: number) => {
    if (!subjectId) return;
    setOpeningId(labId);
    setOpenError(null);
    try {
      const { route } = await fetchLabRoute(subjectId);
      window.open(route, "_blank", "noopener,noreferrer");
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : "Зертхананы ашу мүмкін болмады");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="physics-lab">
      <div className="physics-lab-formulas" aria-hidden>
        {FORMULAS.map((f) => (
          <span
            key={f.text}
            className="physics-lab-formula"
            style={{ top: f.top, left: f.left, right: f.right }}
          >
            {f.text}
          </span>
        ))}
      </div>

      {/* Header */}
      <header className="physics-lab-nav">
        <div className="physics-lab-brand">
          <div className="physics-lab-logo" aria-hidden>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <p className="physics-lab-brand-title">Физика зертханасы</p>
            <p className="physics-lab-brand-sub">Ойнап үйренеміз!</p>
          </div>
        </div>

        <div className="physics-lab-nav-right">
          <nav className="physics-lab-tabs">
            {TOPIC_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`physics-lab-tab${activeTopic === tab ? " physics-lab-tab--active" : ""}`}
                onClick={() => setActiveTopic(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="physics-lab-back-btn"
            onClick={() => window.location.assign("/")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 3 5 8l5 5" />
            </svg>
            Басты бет
          </button>
        </div>
      </header>

      {/* Simulation hero */}
      <div className="physics-lab-sim-section">
        <div className="physics-lab-sim-header">
          <div className="physics-lab-sim-title-group">
            <div className="physics-lab-sim-title-inner">
              <div className="physics-lab-dot" />
              <h1 className="physics-lab-sim-title">
                <span>Энергия</span> симуляторы
              </h1>
            </div>
            <span className="physics-lab-chip">Интерактивті</span>
          </div>
          <div className="physics-lab-sim-meta">
            <div className="physics-lab-meta-pill">
              <span>Режим:</span>
              <strong>{activeMode}</strong>
            </div>
            <div className="physics-lab-meta-pill">
              <span>Дене:</span>
              <strong>{activeBody}</strong>
            </div>
          </div>
        </div>

        <div className="physics-lab-sim-frame">
          <div className="physics-lab-sim-topbar">
            <div className="physics-lab-topbar-left">
              <span>Тәжірибе экраны</span>
              <span aria-hidden />
              <span>Интерактивті зертхана</span>
            </div>
            <div className="physics-lab-topbar-right">
              <button type="button" className="physics-lab-mini-btn">
                Қалпына келтіру
              </button>
            </div>
          </div>

          <div className="physics-lab-sim-inner">
            <EnergySimulator />
          </div>
        </div>

        {/* Mode selector strip */}
        <div className="physics-lab-modes">
          <span className="physics-lab-modes-label">Режим:</span>
          <div className="physics-lab-mode-group">
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`physics-lab-mode-btn${activeMode === mode ? " physics-lab-mode-btn--active" : ""}`}
                onClick={() => setActiveMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="physics-lab-modes-divider" />
          <span className="physics-lab-modes-label">Дене:</span>
          <div className="physics-lab-mode-group">
            {BODIES.map((body) => (
              <button
                key={body}
                type="button"
                className={`physics-lab-mode-btn${activeBody === body ? " physics-lab-mode-btn--active-blue" : ""}`}
                onClick={() => setActiveBody(body)}
              >
                {body}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games section */}
      <section className="physics-lab-games">
        <div className="physics-lab-games-head">
          <div className="physics-lab-games-icon" aria-hidden>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="16" height="10" rx="3" />
              <circle cx="6.5" cy="11" r="1.5" />
              <circle cx="13.5" cy="11" r="1.5" />
              <path d="M8 4h4" />
            </svg>
          </div>
          <div>
            <h2 className="physics-lab-games-title">Ойын таңдаңыз</h2>
            <p className="physics-lab-games-sub">Қызықты зертханалар мен ойындар</p>
          </div>
        </div>

        {openError && <div className="physics-lab-alert">{openError}</div>}

        <div className="physics-lab-games-grid">
          {status === "loading" &&
            [0, 1, 2, 3].map((i) => <div key={i} className="physics-lab-skeleton" />)}

          {status === "error" && (
            <div className="physics-lab-error-box">
              <p>Жүктеу мүмкін болмады</p>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{error}</p>
              {subjectId && (
                <button
                  type="button"
                  className="physics-lab-retry-btn"
                  onClick={() => loadLabs(subjectId)}
                >
                  Қайталау 🔄
                </button>
              )}
            </div>
          )}

          {status === "ready" && labs.length === 0 && (
            <div className="physics-lab-empty">
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#fff" }}>
                Ойындар әлі жоқ 🌱
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                Кейінірек қайта көріңіз
              </p>
            </div>
          )}

          {status === "ready" &&
            labs.map((lab) => (
              <button
                key={lab.id}
                type="button"
                className="physics-lab-game-card"
                onClick={() => void handleOpenLab(lab.id)}
                disabled={openingId === lab.id}
              >
                <div className="physics-lab-game-thumb" aria-hidden>
                  {gameIcon(lab.id)}
                </div>
                <div className="physics-lab-game-body">
                  <p className="physics-lab-game-name">{lab.name}</p>
                  <p className="physics-lab-game-desc">{lab.content}</p>
                  <span className="physics-lab-game-cta">
                    {openingId === lab.id ? "Ашылуда… ⏳" : "Ойынды ашу →"}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </section>

      <footer className="physics-lab-footer">
        Физика зертханасы · Ustaz Physics · {new Date().getFullYear()} ✨
      </footer>
    </div>
  );
}
