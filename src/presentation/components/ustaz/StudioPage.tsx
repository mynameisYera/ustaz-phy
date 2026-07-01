import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CreateGameInput } from "@/domain/entities/GameContext";
import { formatLessonChips } from "@/domain/entities/GameContext";
import type { GameId } from "@/domain/entities/Game";
import { prepareGameHtml } from "@/infrastructure/launchers/BlobGameLauncher";
import { createTemplate } from "@/infrastructure/templates/TemplatesApi";
import { useGameStudio } from "../../hooks/useGameStudio";
import { Tour, type TourStep } from "./Tour";

type StudioPageProps =
  | { mode: "create"; title: string; input: CreateGameInput; onBack: () => void }
  | { mode: "resume"; gameId: GameId; onBack: () => void };

type ChatMsg = { kind: "user" | "ai"; text: string; isError?: boolean };
type StudioState = "building" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

const TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="chat"]', icon: "chat", title: "Диалог", body: "Ойында не өзгерту керек екенін жазыңыз — көмекші қайта жасайды." },
  { target: '[data-tour="canvas"]', icon: "canvas", title: "Алдын ала қарау", body: "Жасалғаннан кейін ойынның соңғы нұсқасы осында көрсетіледі." },
  { target: '[data-tour="download"]', icon: "download", title: "Ойынды жүктеу", body: "Жасалғаннан кейін HTML немесе ZIP форматында жүктеп, компьютерде немесе проекторда ашыңыз." },
];

export function StudioPage(props: StudioPageProps) {
  const { onBack } = props;
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [studioState, setStudioState] = useState<StudioState>("building");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasCardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { game, launchUrl, creating, fixing, downloading, create, resume, download, downloadHtml, submitFix } = useGameStudio();
  const loading = creating || fixing;
  const chips = game ? formatLessonChips(game.context) : props.mode === "create" ? formatLessonChips(props.input) : [];
  const title = props.mode === "create" ? props.title : game?.description || "Ойын";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === canvasCardRef.current);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void canvasCardRef.current?.requestFullscreen();
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (props.mode === "resume") {
      setMessages([{ kind: "ai", text: "Бұрын жасалған ойын жүктелуде…" }]);
      void (async () => {
        const result = await resume(props.gameId);
        if (result.ok) {
          setStudioState("ready");
          setMessages([{ kind: "ai", text: "Ойын жүктелді." }]);
        } else {
          setStudioState("error");
          setMessages([{ kind: "ai", text: result.error, isError: true }]);
        }
      })();
      return;
    }

    const input = props.input;
    setMessages([
      {
        kind: "user",
        text: [
          `${input.grade} сынып · ${input.subject} · ${input.lessonTopic}`,
          input.description,
          input.materialText ? `PDF материал: ${input.materialText.length.toLocaleString()} таңба` : null,
        ].filter(Boolean).join("\n\n"),
      },
    ]);

    void (async () => {
      const result = await create(input);
      if (result.ok) {
        setStudioState("ready");
        setMessages((prev) => [...prev, { kind: "ai", text: "Дайын! Ойын жасалды." }]);
      } else {
        setStudioState("error");
        setMessages((prev) => [...prev, { kind: "ai", text: result.error, isError: true }]);
      }
    })();
  }, [create, resume, props]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !game || loading) return;

    setInputText("");
    setMessages((prev) => [...prev, { kind: "user", text }]);
    setStudioState("building");

    const result = await submitFix(text);
    if (result.ok) {
      setStudioState("ready");
      setMessages((prev) => [...prev, { kind: "ai", text: `Өзгерістер қолданылды — v${result.game.version}.` }]);
    } else {
      setStudioState("error");
      setMessages((prev) => [...prev, { kind: "ai", text: result.error, isError: true }]);
    }
  }

  async function handleRetry() {
    if (loading) return;
    setStudioState("building");

    const result = props.mode === "resume" ? await resume(props.gameId) : await create(props.input);
    if (result.ok) {
      setStudioState("ready");
      setMessages((prev) => [...prev, { kind: "ai", text: "Дайын! Ойын жасалды." }]);
    } else {
      setStudioState("error");
      setMessages((prev) => [...prev, { kind: "ai", text: result.error, isError: true }]);
    }
  }

  async function handleSaveTemplate() {
    if (!game || saveState === "saving") return;

    setSaveState("saving");
    setSaveError(null);

    try {
      const content = prepareGameHtml(game);
      await createTemplate(title || "Игра", content);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Не удалось сохранить шаблон");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  }

  const saveLabel =
    saveState === "saving" ? "Сақталуда…" :
    saveState === "saved" ? "Сақталды ✓" :
    saveState === "error" ? "Қате — қайталау" :
    "Үлгі ретінде сақтау";

  return (
    <div className="u365-studio-full">
      {showTour && <Tour steps={TOUR_STEPS} onClose={() => setShowTour(false)} />}

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 20px", borderBottom: "1px solid #E6E2D8", background: "#F7F5EF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ width: "32px", height: "32px", flexShrink: 0, border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#1A1A17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 8h-9M7 3.5 3.5 8 7 12.5"/></svg>
          </button>
          <span style={{ fontFamily: "Spectral, serif", fontSize: "18px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title || "Жаңа ойын"}</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {chips.map((chip) => (
              <span key={chip} style={{ padding: "4px 10px", borderRadius: "8px", background: "#E4EFEA", color: "#3B5A50", fontSize: "12px" }}>
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {game && (
            <div data-tour="download" style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={downloadHtml}
                disabled={downloading}
                style={{ height: "34px", padding: "0 14px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", color: "#1A1A17", fontFamily: "inherit", fontSize: "13px", cursor: downloading ? "not-allowed" : "pointer" }}
              >
                {downloading ? "Дайындалуда…" : "HTML жүктеу"}
              </button>
              <button
                type="button"
                onClick={() => void download()}
                disabled={downloading}
                style={{ height: "34px", padding: "0 14px", border: "none", borderRadius: "8px", background: downloading ? "#A6C8C0" : "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "13px", cursor: downloading ? "not-allowed" : "pointer" }}
              >
                {downloading ? "Дайындалуда…" : "ZIP жүктеу"}
              </button>
            </div>
          )}
          {game && (
            <button
              type="button"
              onClick={() => void handleSaveTemplate()}
              disabled={saveState === "saving"}
              title={saveError ?? "Бұл ойынды үлгі ретінде сақтау"}
              style={{
                height: "34px",
                padding: "0 14px",
                border: "1px solid #E6E2D8",
                borderRadius: "8px",
                background: saveState === "saved" ? "#E4EFEA" : "#FFFFFF",
                color: saveState === "error" ? "#B4533B" : saveState === "saved" ? "#1E6E5C" : "#1A1A17",
                fontFamily: "inherit",
                fontSize: "13px",
                cursor: saveState === "saving" ? "not-allowed" : "pointer",
              }}
            >
              {saveLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowTour(true)}
            style={{ width: "32px", height: "32px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", color: "#1A1A17", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px" }}
          >
            ?
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <aside data-tour="chat" style={{ width: "28%", minWidth: "320px", flexShrink: 0, borderRight: "1px solid #E6E2D8", display: "flex", flexDirection: "column", minHeight: 0, background: "#F7F5EF" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 20px", display: "flex", flexDirection: "column", gap: "22px" }}>
            {messages.map((msg, i) =>
              msg.kind === "user" ? (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <div style={{ maxWidth: "88%", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: msg.isError ? "#F3E3DE" : "#E4EFEA", color: msg.isError ? "#B4533B" : "#1E6E5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>
                    U
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.6, color: msg.isError ? "#6F6E66" : "#33322C", whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </div>
                </div>
              )
            )}
            {loading && (
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#E4EFEA", color: "#1E6E5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>
                  U
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#6F6E66", fontSize: "14px" }}>
                  <span style={{ display: "inline-flex", gap: "4px" }}>
                    <span className="u365-dot-1" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E6E5C" }} />
                    <span className="u365-dot-2" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E6E5C" }} />
                    <span className="u365-dot-3" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E6E5C" }} />
                  </span>
                  Ойын жасалуда…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} style={{ borderTop: "1px solid #E6E2D8", padding: "14px", background: "#F7F5EF" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: "12px", padding: "12px 12px 10px" }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={2}
                disabled={loading || !game}
                placeholder={game ? "Ойында не өзгерту керек?" : "Ойын жасалуын күтудеміз..."}
                style={{
                  width: "100%",
                  minHeight: "38px",
                  resize: "vertical",
                  border: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  color: "#1A1A17",
                  background: "transparent",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "6px" }}>
                <button
                  type="submit"
                  disabled={loading || !game || !inputText.trim()}
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "none",
                    borderRadius: "8px",
                    background: loading || !game || !inputText.trim() ? "#DCD8CC" : "#1E6E5C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: loading || !game || !inputText.trim() ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3.5M3.5 8 8 3.5 12.5 8" /></svg>
                </button>
              </div>
            </div>
          </form>
        </aside>

        <section data-tour="canvas" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#F7F5EF" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px", minHeight: 0 }}>
            <div ref={canvasCardRef} style={{ position: "relative", width: "100%", maxWidth: "960px", background: "#FFFFFF", border: "1px solid #E6E2D8", borderRadius: isFullscreen ? 0 : "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
              {studioState === "ready" && launchUrl && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Толық экраннан шығу" : "Толық экранда көру"}
                  style={{ position: "absolute", top: "12px", right: "12px", zIndex: 1, width: "30px", height: "30px", border: "1px solid #E6E2D8", borderRadius: "8px", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  {isFullscreen ? (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 9.5 2 14M6.5 9.5v3.5M6.5 9.5H3M9.5 6.5 14 2M9.5 6.5V3M9.5 6.5H13" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6V3a1 1 0 0 1 1-1h3M14 6V3a1 1 0 0 0-1-1h-3M2 10v3a1 1 0 0 0 1 1h3M14 10v3a1 1 0 0 1-1 1h-3" /></svg>
                  )}
                </button>
              )}
              {studioState === "building" && (
                <>
                  <div className="u365-bar-progress" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: "34px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="u365-skeleton-line" style={{ height: "26px", width: "55%", background: "#F0EDE4", borderRadius: "6px" }} />
                    <div className="u365-skeleton-line-d1" style={{ height: "14px", width: "80%", background: "#F0EDE4", borderRadius: "6px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
                      <div className="u365-skeleton-line-d2" style={{ height: "120px", background: "#F4F1EA", borderRadius: "10px" }} />
                      <div className="u365-skeleton-line-d3" style={{ height: "120px", background: "#F4F1EA", borderRadius: "10px" }} />
                    </div>
                    <div className="u365-skeleton-line-d4" style={{ height: "14px", width: "60%", background: "#F0EDE4", borderRadius: "6px" }} />
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", color: "#6F6E66", fontSize: "14px" }}>
                      <span style={{ display: "inline-flex", gap: "4px" }}>
                        <span className="u365-dot-1" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E6E5C" }} />
                        <span className="u365-dot-2" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E6E5C" }} />
                        <span className="u365-dot-3" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E6E5C" }} />
                      </span>
                      Ойын жасалуда…
                    </div>
                  </div>
                </>
              )}

              {studioState === "ready" && launchUrl && (
                <iframe
                  title="Игра"
                  src={launchUrl}
                  sandbox="allow-scripts allow-same-origin"
                  style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
                />
              )}

              {studioState === "error" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "40px", textAlign: "center" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1.5px solid #B4533B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B4533B" strokeWidth="1.6" strokeLinecap="round"><path d="M12 7.5v5.5M12 16.5h0" /></svg>
                  </div>
                  <h3 style={{ fontFamily: "Spectral, serif", fontWeight: 500, fontSize: "22px", margin: 0 }}>Ойынды жасау кезінде қате пайда болды</h3>
                  <p style={{ fontSize: "14px", color: "#6F6E66", maxWidth: "340px", margin: 0, lineHeight: 1.55 }}>
                    Генерация кезінде бір нәрсе дұрыс болмады. Сипаттаманы тексеріп, қайталап көріңіз.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleRetry()}
                    style={{ marginTop: "4px", height: "38px", padding: "0 20px", border: "none", borderRadius: "8px", background: "#1E6E5C", color: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}
                  >
                    Қайталау
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
