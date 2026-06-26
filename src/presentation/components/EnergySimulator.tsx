import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ARENA_GROUND_BOTTOM,
  ARENA_ORIGIN_X,
  BASE_PPM,
  computeArenaView,
  computePhysics,
  computeTrajectory,
  createCube,
  rulerTicks,
  stepDrop,
  stepProjectile,
  type InteractionMode,
  type PhysicsResult,
  type TrajectoryPoint,
} from "@/domain/physics/energy";
import {
  checkGameAnswer,
  distanceSymbol,
  generateGameChallenge,
  getGameHint,
  getModeLabel,
  showsAfterExperiment,
  type GameChallenge,
  type HiddenParam,
} from "@/domain/physics/gameChallenge";
import { FRICTION_COEFF, GRAVITY } from "@/domain/physics/energy";
import { SimObjectVisual } from "./SimObjectVisual";
import { TrajectoryOverlay } from "./TrajectoryOverlay";

type Phase = "idle" | "animating" | "done";

const MODES: { id: InteractionMode; label: string }[] = [
  { id: "push", label: "Толкнуть" },
  { id: "throw", label: "Бросить" },
  { id: "drop", label: "Уронить" },
];

const MIN_MASS = 0.5;
const MAX_MASS = 100;

type AppMode = "learn" | "game";

export function EnergySimulator() {
  const [appMode, setAppMode] = useState<AppMode>("learn");
  const [challenge, setChallenge] = useState<GameChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [checkResult, setCheckResult] = useState<"correct" | "wrong" | null>(null);
  const [mass, setMass] = useState(2);
  const [energy, setEnergy] = useState(5);
  const [mode, setMode] = useState<InteractionMode>("push");
  const [angle, setAngle] = useState(40);
  const [result, setResult] = useState<PhysicsResult | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [arenaSize, setArenaSize] = useState({ w: 800, h: 420 });
  const [aimEnd, setAimEnd] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [bodyFaded, setBodyFaded] = useState(false);
  const [playgroundExpanded, setPlaygroundExpanded] = useState(false);
  const [panelWidth, setPanelWidth] = useState(380);

  const animRef = useRef<number>(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);

  const activeMass = appMode === "game" && challenge ? challenge.mass : mass;
  const activeEnergy = appMode === "game" && challenge ? challenge.energy : energy;
  const activeMode = appMode === "game" && challenge ? challenge.mode : mode;
  const activeAngle = appMode === "game" && challenge ? challenge.angle : angle;

  const object = useMemo(() => createCube(activeMass), [activeMass]);

  const previewPhysics = useMemo(
    () => (phase === "idle" ? computePhysics(object, activeEnergy, activeMode, activeAngle) : null),
    [activeAngle, activeEnergy, activeMode, object, phase]
  );

  const activePhysics = result ?? previewPhysics;

  const finishExperiment = useCallback((physics: PhysicsResult, finalX: number) => {
    const startX = physics.mode === "drop" ? 1.5 : 0;
    setTrajectory(computeTrajectory(physics, startX));
    setPos((p) => ({ ...p, x: finalX }));
    setPhase("done");
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    setPhase("idle");
    setPos({ x: 0, y: 0 });
    setLiveSpeed(0);
    setResult(null);
    setTrajectory([]);
    setAimEnd(null);
    setBreakdownOpen(false);
    setBodyFaded(false);
    setAnswer("");
    setCheckResult(null);
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const next = generateGameChallenge();
    setChallenge(next);
    setMass(next.mass);
    setEnergy(next.energy);
    setMode(next.mode);
    setAngle(next.angle);
    setPhase("idle");
    setPos({ x: 0, y: 0 });
    setLiveSpeed(0);
    setResult(null);
    setTrajectory([]);
    setAimEnd(null);
    setBreakdownOpen(false);
    setBodyFaded(false);
    setAnswer("");
    setCheckResult(null);
    setAppMode("game");
    setPlaygroundExpanded(false);
  }, []);

  const exitGame = useCallback(() => {
    setAppMode("learn");
    setChallenge(null);
    reset();
  }, [reset]);

  const newChallenge = useCallback(() => {
    const next = generateGameChallenge();
    setChallenge(next);
    setMass(next.mass);
    setEnergy(next.energy);
    setMode(next.mode);
    setAngle(next.angle);
    cancelAnimationFrame(animRef.current);
    setPhase("idle");
    setPos({ x: 0, y: 0 });
    setLiveSpeed(0);
    setResult(null);
    setTrajectory([]);
    setAimEnd(null);
    setBodyFaded(false);
    setAnswer("");
    setCheckResult(null);
  }, []);

  const handleCheckAnswer = useCallback(() => {
    if (!challenge) return;
    setCheckResult(checkGameAnswer(challenge, answer) ? "correct" : "wrong");
  }, [answer, challenge]);

  const isHidden = useCallback(
    (param: HiddenParam) => appMode === "game" && challenge?.hidden === param,
    [appMode, challenge]
  );

  const formatValue = (param: HiddenParam, value: string) =>
    isHidden(param) ? "???" : value;

  const runPushAnimation = useCallback(
    (physics: PhysicsResult) => {
      const maxDist = physics.distanceM;
      const v0 = physics.velocity;
      const duration = Math.max(1800, (maxDist / Math.max(v0, 0.1)) * 1600);
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = t < 0.15 ? t / 0.15 : 1 - Math.pow(1 - (t - 0.15) / 0.85, 2);
        setPos({ x: maxDist * ease, y: 0 });
        setLiveSpeed(v0 * (1 - t * 0.9));
        if (t < 1) animRef.current = requestAnimationFrame(tick);
        else {
          setLiveSpeed(0);
          finishExperiment(physics, maxDist);
        }
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [finishExperiment]
  );

  const runThrowAnimation = useCallback(
    (physics: PhysicsResult) => {
      const rad = ((physics.angleDeg ?? angle) * Math.PI) / 180;
      const v = physics.velocity;
      let state = { x: 0, y: 0.05, vx: v * Math.cos(rad), vy: v * Math.sin(rad), speed: v };
      let last = performance.now();

      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;
        state = stepProjectile(state, dt);
        if (state.y < 0) {
          setPos({ x: state.x, y: 0 });
          setLiveSpeed(0);
          finishExperiment(physics, state.x);
          return;
        }
        setPos({ x: state.x, y: state.y });
        setLiveSpeed(state.speed);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [angle, finishExperiment]
  );

  const runDropAnimation = useCallback(
    (physics: PhysicsResult) => {
      const h = physics.heightM ?? 0;
      let state = { x: 1.5, y: h, vx: 0, vy: 0, speed: 0 };
      let last = performance.now();

      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;
        state = stepDrop(state, dt);
        if (state.y <= 0) {
          setPos({ x: state.x, y: 0 });
          setLiveSpeed(physics.velocity);
          finishExperiment(physics, state.x);
          return;
        }
        setPos({ x: state.x, y: state.y });
        setLiveSpeed(state.speed);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [finishExperiment]
  );

  const launch = useCallback(
    (throwAngle = angle) => {
      cancelAnimationFrame(animRef.current);
      setTrajectory([]);
      setAimEnd(null);
      setLiveSpeed(0);
      setBreakdownOpen(false);
      setBodyFaded(false);

      const physics = computePhysics(object, activeEnergy, activeMode, throwAngle);
      setResult(physics);
      setPhase("animating");

      if (activeMode === "drop") {
        setPos({ x: 1.5, y: physics.heightM ?? 0 });
        runDropAnimation(physics);
      } else if (activeMode === "throw") {
        runThrowAnimation(physics);
      } else {
        runPushAnimation(physics);
      }
    },
    [activeAngle, activeEnergy, activeMode, object, runDropAnimation, runPushAnimation, runThrowAnimation]
  );

  const idleY = activeMode === "drop" && phase === "idle" ? activeEnergy / (object.mass * GRAVITY) : 0;
  const displayX = phase === "idle" && activeMode === "drop" ? 1.5 : pos.x;
  const displayY = phase === "idle" ? idleY : pos.y;

  const viewPosX = displayX;
  const viewPosY = displayY;

  const { ppm, widthM, heightM } = computeArenaView({
    arenaWidth: arenaSize.w,
    arenaHeight: arenaSize.h,
    posX: viewPosX,
    posY: viewPosY,
    physics: activePhysics,
    trajectory,
  });

  const viewScale = ppm / BASE_PPM;
  const xTicks = rulerTicks(widthM, ppm);
  const yTicks = rulerTicks(heightM, ppm);

  const getArenaPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = arenaRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const px = clientX - rect.left - ARENA_ORIGIN_X;
      const py = rect.bottom - ARENA_GROUND_BOTTOM - (clientY - rect.top);
      return { x: px / ppm, y: Math.max(0, py / ppm) };
    },
    [ppm]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase === "animating" || activeMode !== "throw" || appMode === "game") return;
    const p = getArenaPoint(e.clientX, e.clientY);
    dragStart.current = { x: 0, y: 0 };
    setAimEnd(p);
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const p = getArenaPoint(e.clientX, e.clientY);
    setAimEnd(p);
    const dx = p.x - dragStart.current.x;
    const dy = p.y - dragStart.current.y;
    if (dx > 0.05) {
      setAngle(Math.min(80, Math.max(10, Math.round((Math.atan2(dy, dx) * 180) / Math.PI))));
    }
  };

  const handlePointerUp = () => {
    if (dragging && activeMode === "throw" && appMode !== "game") launch(angle);
    setDragging(false);
    dragStart.current = null;
    setAimEnd(null);
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    resizeRef.current = { startX: e.clientX, startW: panelWidth };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const next = resizeRef.current.startW + (e.clientX - resizeRef.current.startX);
    setPanelWidth(Math.min(520, Math.max(300, next)));
  };

  const handleResizeUp = () => {
    resizeRef.current = null;
  };

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setArenaSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setArenaSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const showTrajectory = phase === "done" && trajectory.length > 1;

  const modeLabel =
    appMode === "game" && challenge
      ? getModeLabel(challenge.mode)
      : activeMode === "push"
        ? "Толкнуть"
        : activeMode === "throw"
          ? "Бросить"
          : "Уронить";

  const formatTick = (m: number) => String(m);

  return (
    <div
      className={`sim-layout ${appMode === "game" ? "sim-layout--game" : ""} ${playgroundExpanded ? "sim-layout--playground-expanded" : ""}`}
      style={appMode === "learn" && !playgroundExpanded ? { ["--sim-panel-width" as string]: `${panelWidth}px` } : undefined}
    >
      {appMode === "learn" && !playgroundExpanded && (
      <aside className="sim-panel">
        <div className="sim-panel-scroll">
          <header className="sim-panel-header">
            <h1>Симулятор энергии</h1>
            <p>Стальной куб · траектория · решение задачи</p>
          </header>

          <section className="sim-section">
            <button type="button" className="sim-expand-panel-btn" onClick={() => setPlaygroundExpanded(true)}>
              ⛶ Развернуть площадку
            </button>
          </section>

          <section className="sim-section">
            <button type="button" className="sim-game-start-btn" onClick={startGame}>
              🎯 Игра: Угадай
            </button>
          </section>

          <section className="sim-section">
            <h2>1. Режим</h2>
            <div className="sim-modes">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`sim-mode-btn ${mode === m.id ? "active" : ""}`}
                  onClick={() => { setMode(m.id); reset(); }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <section className="sim-section">
            <h2>2. Тело</h2>
            <div className="sim-cube-card">
              <SimObjectVisual material="steel-cube" size="md" />
              <span>Стальной куб</span>
            </div>
            <label className="sim-energy-label">
              Масса: <strong>{mass} кг</strong>
            </label>
            <input
              type="range"
              min={MIN_MASS}
              max={MAX_MASS}
              step={0.5}
              value={mass}
              onChange={(e) => { setMass(Number(e.target.value)); reset(); }}
            />
            <input
              type="number"
              className="sim-energy-input"
              min={MIN_MASS}
              max={MAX_MASS}
              step={0.1}
              value={mass}
              onChange={(e) => {
                const v = Math.min(MAX_MASS, Math.max(MIN_MASS, Number(e.target.value) || MIN_MASS));
                setMass(v);
                reset();
              }}
            />
          </section>

          <section className="sim-section">
            <h2>3. Энергия</h2>
            <label className="sim-energy-label">
              {mode === "drop" ? "Ep" : "Ek"}: <strong>{energy} Дж</strong>
            </label>
            <input
              type="range"
              min={1}
              max={50}
              step={0.5}
              value={energy}
              onChange={(e) => { setEnergy(Number(e.target.value)); reset(); }}
            />
          </section>

          {mode === "throw" && (
            <section className="sim-section">
              <h2>4. Угол броска</h2>
              <label className="sim-energy-label">θ = <strong>{angle}°</strong></label>
              <input
                type="range"
                min={10}
                max={80}
                value={angle}
                onChange={(e) => { setAngle(Number(e.target.value)); reset(); }}
              />
            </section>
          )}

          <section className="sim-section sim-section-last">
            <button
              type="button"
              className="sim-apply-btn"
              onClick={() => launch()}
              disabled={phase === "animating"}
            >
              {phase === "animating" ? "Эксперимент…" : "Запустить"}
            </button>
            {phase !== "idle" && (
              <button type="button" className="sim-reset-btn" onClick={reset}>Сбросить</button>
            )}
          </section>

          {result && (
            <section className="sim-metrics">
              <h2>Показатели</h2>
              <dl>
                <div><dt>E</dt><dd>{result.energyJ.toFixed(1)} Дж</dd></div>
                <div><dt>F</dt><dd>{result.forceN.toFixed(1)} Н</dd></div>
                <div><dt>m</dt><dd>{result.massKg} кг</dd></div>
                <div><dt>a</dt><dd>{result.acceleration.toFixed(2)} м/с²</dd></div>
                <div><dt>v</dt><dd>{(phase === "animating" ? liveSpeed : result.velocity).toFixed(2)} м/с</dd></div>
                {result.heightM !== undefined && result.heightM > 0 && (
                  <div><dt>h</dt><dd>{result.heightM.toFixed(2)} м</dd></div>
                )}
                <div><dt>L</dt><dd>{(mode === "drop" ? result.heightM : result.distanceM)?.toFixed(2)} м</dd></div>
              </dl>
            </section>
          )}

          {result && phase === "done" && (
            <section className="sim-breakdown">
              <button
                type="button"
                className={`sim-breakdown-btn ${breakdownOpen ? "open" : ""}`}
                onClick={() => setBreakdownOpen((v) => !v)}
                aria-expanded={breakdownOpen}
              >
                Разбор
                <span className="sim-breakdown-chevron" aria-hidden>▾</span>
              </button>
              {breakdownOpen && (
                <div className="sim-breakdown-content">
                  <section className="sim-solution">
                    <h2>Решение задачи</h2>
                    <ol>
                      {result.solutionSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </section>
                  <section className="sim-explanation">
                    <h2>Вывод</h2>
                    <p>{result.explanation}</p>
                  </section>
                </div>
              )}
            </section>
          )}

          {result && phase !== "done" && (
            <section className="sim-explanation sim-explanation--pending">
              <p>Дождитесь окончания эксперимента, чтобы открыть разбор.</p>
            </section>
          )}

          {!result && (
            <p className="sim-scroll-placeholder">
              После запуска здесь появятся показатели. Кнопка «Разбор» откроет пошаговое решение.
            </p>
          )}
        </div>
      </aside>
      )}

      {appMode === "learn" && !playgroundExpanded && (
        <div
          className="sim-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Изменить ширину панели"
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerLeave={handleResizeUp}
        />
      )}

      <section className="sim-playground">
        {appMode === "learn" && playgroundExpanded && (
          <button
            type="button"
            className="sim-playground-restore"
            onClick={() => setPlaygroundExpanded(false)}
          >
            ← Панель управления
          </button>
        )}

        {appMode === "game" && challenge && (
          <div className="sim-game-task">
            <div className="sim-game-task-head">
              <h2>🎯 Угадай величину</h2>
              <button type="button" className="sim-game-exit-btn" onClick={exitGame}>
                ← Учебный режим
              </button>
            </div>
            <p className="sim-game-question">{challenge.question}</p>
            <div className="sim-game-known">
              <span>Режим: <strong>{modeLabel}</strong></span>
              <span>g = <strong>{GRAVITY} м/с²</strong></span>
              {challenge.mode === "drop" && (
                <span>v₀ = <strong>0 м/с</strong></span>
              )}
              {challenge.mode === "push" && (
                <span>μ = <strong>{FRICTION_COEFF}</strong></span>
              )}
              <span>m = <strong>{formatValue("mass", `${challenge.mass} кг`)}</strong></span>
              <span>
                {challenge.mode === "drop" ? "Ep" : "Ek"} ={" "}
                <strong>{formatValue("energy", `${challenge.energy} Дж`)}</strong>
              </span>
              {challenge.mode === "throw" && (
                <span>θ = <strong>{formatValue("angle", `${challenge.angle}°`)}</strong></span>
              )}
            </div>
            {result && (showsAfterExperiment(challenge, "velocity") || showsAfterExperiment(challenge, "distance")) && (
              <div className="sim-game-known sim-game-known--after">
                {showsAfterExperiment(challenge, "velocity") && (
                  <span>v = <strong>{result.velocity.toFixed(2)} м/с</strong></span>
                )}
                {showsAfterExperiment(challenge, "distance") && (
                  <span>
                    {distanceSymbol(challenge.mode)} ={" "}
                    <strong>
                      {(challenge.mode === "drop" ? result.heightM : result.distanceM)?.toFixed(2)} м
                    </strong>
                  </span>
                )}
              </div>
            )}
            <div className="sim-game-answer-row">
              <input
                type="text"
                className="sim-game-answer-input"
                placeholder={`Ответ (${challenge.unit})`}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setCheckResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCheckAnswer()}
              />
              <button
                type="button"
                className="sim-game-check-btn"
                onClick={handleCheckAnswer}
                disabled={!answer.trim()}
              >
                Проверить
              </button>
            </div>
            {checkResult === "correct" && (
              <p className="sim-game-feedback sim-game-feedback--ok">✓ Правильно!</p>
            )}
            {checkResult === "wrong" && (
              <p className="sim-game-feedback sim-game-feedback--bad">✗ Неправильно. Попробуйте ещё раз.</p>
            )}
            <div className="sim-game-actions">
              <button
                type="button"
                className="sim-apply-btn"
                onClick={() => launch()}
                disabled={phase === "animating"}
              >
                {phase === "animating" ? "Эксперимент…" : "Запустить эксперимент"}
              </button>
              <button type="button" className="sim-reset-btn" onClick={newChallenge}>
                Новая задача
              </button>
            </div>
            <p className="sim-game-hint">{getGameHint(challenge)}</p>
          </div>
        )}

        <div className="sim-screen">
        <div className="sim-screen-header">
          <span>Экран эксперимента</span>
          <div className="sim-screen-header-actions">
          {viewScale !== 1 && (
            <span className="sim-scale-label">
              {viewScale < 1
                ? `масштаб ×${(1 / viewScale).toFixed(1)} · ${widthM.toFixed(1)}×${heightM.toFixed(1)} м`
                : `приближение ×${viewScale.toFixed(1)} · ${widthM.toFixed(1)}×${heightM.toFixed(1)} м`}
            </span>
          )}
          {showTrajectory && <span className="sim-traj-label">— траектория нарисована</span>}
          {phase === "done" && (
            <button
              type="button"
              className="sim-fade-body-btn"
              onClick={() => setBodyFaded((v) => !v)}
            >
              {bodyFaded ? "Показать куб" : "Скрыть куб"}
            </button>
          )}
          {appMode === "learn" && (
            <button
              type="button"
              className="sim-expand-btn"
              onClick={() => setPlaygroundExpanded((v) => !v)}
            >
              {playgroundExpanded ? "Свернуть" : "Развернуть площадку"}
            </button>
          )}
          </div>
        </div>

        <div
          ref={arenaRef}
          className={`sim-arena ${activeMode === "throw" && appMode !== "game" ? "sim-arena-aim" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={() => {
            if (appMode === "game") return;
            if (phase === "idle" && activeMode === "push") launch();
            if (phase === "idle" && activeMode === "drop") launch();
          }}
          role="presentation"
        >
          <div className="sim-sky" />
          <svg className="sim-grid" aria-hidden>
            {yTicks.map((m, i) => {
              if (m === 0) return null;
              const y = arenaSize.h - ARENA_GROUND_BOTTOM - m * ppm;
              return (
                <line
                  key={`grid-${i}-${m}`}
                  x1={ARENA_ORIGIN_X}
                  y1={y}
                  x2={arenaSize.w}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.22)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              );
            })}
          </svg>
          <div className="sim-height-ruler">
            {yTicks.map((m, i) => (
              <span
                key={`y-${i}-${m}`}
                style={{ bottom: `${ARENA_GROUND_BOTTOM + m * ppm}px` }}
              >
                {formatTick(m)} м
              </span>
            ))}
          </div>
          <div className="sim-ground" />
          <div className="sim-ground-texture" />
          <div className="sim-ruler">
            {xTicks.map((m, i) => (
              <span
                key={`x-${i}-${m}`}
                style={{ left: `${m * ppm}px` }}
              >
                {formatTick(m)} м
              </span>
            ))}
          </div>

          <TrajectoryOverlay
            points={trajectory}
            ppm={ppm}
            arenaHeight={arenaSize.h}
            visible={showTrajectory}
          />

          {activeMode === "drop" && idleY > 0 && phase !== "animating" && !isHidden("energy") && (
            <svg className="sim-height-dim" aria-hidden>
              {(() => {
                const objX = ARENA_ORIGIN_X + displayX * ppm;
                const lineX = objX - 58 * viewScale;
                const yGround = arenaSize.h - ARENA_GROUND_BOTTOM;
                const yTop = arenaSize.h - ARENA_GROUND_BOTTOM - idleY * ppm;
                const yMid = (yGround + yTop) / 2;
                return (
                  <>
                    <line
                      x1={lineX}
                      y1={yGround}
                      x2={lineX}
                      y2={yTop}
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                    <line x1={lineX - 6} y1={yGround} x2={lineX + 6} y2={yGround} stroke="#fbbf24" strokeWidth="2" />
                    <line x1={lineX - 6} y1={yTop} x2={lineX + 6} y2={yTop} stroke="#fbbf24" strokeWidth="2" />
                    <rect
                      x={lineX - 72}
                      y={yMid - 12}
                      width={64}
                      height={24}
                      rx={6}
                      fill="#0f172a"
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                    />
                    <text
                      x={lineX - 40}
                      y={yMid + 5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="700"
                    >
                      h = {idleY.toFixed(2)} м
                    </text>
                  </>
                );
              })()}
            </svg>
          )}

          {dragging && aimEnd && activeMode === "throw" && (
            <svg className="sim-aim-line" aria-hidden>
              <line
                x1={ARENA_ORIGIN_X}
                y1={arenaSize.h - ARENA_GROUND_BOTTOM}
                x2={ARENA_ORIGIN_X + aimEnd.x * ppm}
                y2={arenaSize.h - ARENA_GROUND_BOTTOM - aimEnd.y * ppm}
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            </svg>
          )}

          <div
            className={`sim-body-wrap ${phase === "animating" ? "flying" : ""} ${phase === "done" && bodyFaded ? "faded" : ""} ${phase === "done" ? "sim-body-wrap--done" : ""}`}
            style={{
              left: ARENA_ORIGIN_X + displayX * ppm,
              bottom: ARENA_GROUND_BOTTOM + displayY * ppm,
              transform: `translateX(-50%) scale(${viewScale})`,
            }}
            onClick={(e) => {
              if (phase === "done") {
                e.stopPropagation();
                setBodyFaded((v) => !v);
              }
            }}
            role={phase === "done" ? "button" : undefined}
            aria-label={phase === "done" ? (bodyFaded ? "Показать куб" : "Скрыть куб для просмотра траектории") : undefined}
            tabIndex={phase === "done" ? 0 : undefined}
            onKeyDown={(e) => {
              if (phase === "done" && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setBodyFaded((v) => !v);
              }
            }}
          >
            <SimObjectVisual material="steel-cube" size="lg" />
          </div>

          {phase === "animating" && !isHidden("energy") && (
            <div
              className="sim-energy-burst"
              style={{
                left: ARENA_ORIGIN_X + displayX * ppm,
                bottom: ARENA_GROUND_BOTTOM + displayY * ppm + 60 * viewScale,
                fontSize: `${0.9 * Math.max(viewScale, 0.6)}rem`,
              }}
            >
              {activeEnergy} Дж
            </div>
          )}
        </div>

        <div className="sim-formula-bar">
          <code>Ep = mgh</code>
          <code>Ek = ½mv²</code>
          <code>W = F·s</code>
        </div>
        </div>
      </section>
    </div>
  );
}
