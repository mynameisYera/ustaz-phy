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

const CHALK_FORMULAS = [
  { text: "F = ma", top: "8%", left: "4%", rot: "-12deg", delay: "0s" },
  { text: "E = ½mv²", top: "18%", right: "6%", rot: "8deg", delay: "1.2s" },
  { text: "Ep = mgh", top: "42%", left: "2%", rot: "6deg", delay: "0.6s" },
  { text: "W = F·s", top: "55%", right: "3%", rot: "-10deg", delay: "1.8s" },
  { text: "p = mv", top: "72%", left: "8%", rot: "-6deg", delay: "2.4s" },
  { text: "v = s/t", top: "85%", right: "10%", rot: "14deg", delay: "0.3s" },
  { text: "Ek + Ep = const", top: "32%", left: "50%", rot: "-4deg", delay: "1s" },
  { text: "g ≈ 9.8 m/s²", top: "65%", left: "45%", rot: "5deg", delay: "2s" },
];

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
        {CHALK_FORMULAS.map((f) => (
          <span
            key={f.text}
            className="physics-lab-formula"
            style={{
              top: f.top,
              left: f.left,
              right: f.right,
              ["--rot" as string]: f.rot,
              ["--delay" as string]: f.delay,
            }}
          >
            {f.text}
          </span>
        ))}
      </div>

      <span className="physics-lab-sticker physics-lab-sticker--1" aria-hidden>⚛️</span>
      <span className="physics-lab-sticker physics-lab-sticker--2" aria-hidden>🌟</span>
      <span className="physics-lab-sticker physics-lab-sticker--3" aria-hidden>🔭</span>
      <span className="physics-lab-sticker physics-lab-sticker--4" aria-hidden>⚡</span>

      <nav className="physics-lab-nav">
        <div className="physics-lab-brand">
          <div className="physics-lab-logo" aria-hidden>
            ⚛️
          </div>
          <div>
            <p className="physics-lab-brand-title">Физика зертханасы</p>
            <p className="physics-lab-brand-sub">Ойнап үйренеміз!</p>
          </div>
        </div>
        <button type="button" className="physics-lab-back-btn" onClick={() => window.location.assign("/")}>
          ← Басты бет
        </button>
      </nav>

      <section className="physics-lab-hero">
        <div className="physics-lab-badges">
          <span className="physics-lab-badge physics-lab-badge--mint">🔬 Зерттеу</span>
          <span className="physics-lab-badge physics-lab-badge--sun">⚡ Энергия</span>
          <span className="physics-lab-badge physics-lab-badge--sky">🎯 Ойын</span>
        </div>
        <h1 className="physics-lab-hero-title">
          <span>Энергия</span> симуляторы
        </h1>
        <p className="physics-lab-hero-desc">
          Итеру, лақтыру және түсіру — кубты қозғалысқа келтіріп, физиканы қызықты тәжірибе ретінде көріңіз!
        </p>
      </section>

      <section className="physics-lab-sim-wrap">
        <div className="physics-lab-sim-frame">
          <div className="physics-lab-sim-label">
            <span>🧲</span>
            <span>Интерактивті зертхана</span>
            <span>🧲</span>
          </div>
          <div className="physics-lab-sim-inner">
            <EnergySimulator />
          </div>
        </div>
      </section>

      <section className="physics-lab-games">
        <div className="physics-lab-games-inner">
          <h2 className="physics-lab-games-title">🎮 Ойын таңдаңыз</h2>
          <p className="physics-lab-games-sub">Қызықты зертханалар мен ойындар</p>

          {openError && <div className="physics-lab-alert">{openError}</div>}

          {status === "loading" && (
            <div className="physics-lab-games-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="physics-lab-skeleton" />
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="physics-lab-error-box">
              <p>Жүктеу мүмкін болмады</p>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#6f6e66" }}>{error}</p>
              {subjectId && (
                <button type="button" className="physics-lab-retry-btn" onClick={() => loadLabs(subjectId)}>
                  Қайталау 🔄
                </button>
              )}
            </div>
          )}

          {status === "ready" && labs.length === 0 && (
            <div className="physics-lab-empty">
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Ойындар әлі жоқ 🌱</p>
              <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: "#6f6e66" }}>
                Кейінірек қайта көріңіз
              </p>
            </div>
          )}

          {status === "ready" && labs.length > 0 && (
            <div className="physics-lab-games-grid">
              {labs.map((lab) => (
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
          )}
        </div>
      </section>

      <footer className="physics-lab-footer">
        Физика зертханасы · Ustaz Physics · {new Date().getFullYear()} ✨
      </footer>
    </div>
  );
}
