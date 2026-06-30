import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CreateGameInput } from "@/domain/entities/GameContext";
import { formatLessonChips } from "@/domain/entities/GameContext";
import { prepareGameHtml } from "@/infrastructure/launchers/BlobGameLauncher";
import { createTemplate } from "@/infrastructure/templates/TemplatesApi";
import { useGameStudio } from "../../hooks/useGameStudio";
import { Tour, type TourStep } from "./Tour";

interface StudioPageProps {
  title: string;
  input: CreateGameInput;
  onBack: () => void;
}

type ChatMsg = { kind: "user" | "ai"; text: string; isError?: boolean };
type StudioState = "building" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

const TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="chat"]', icon: "chat", title: "Диалог", body: "Ойында не өзгерту керек екенін жазыңыз — көмекші қайта жасайды." },
  { target: '[data-tour="canvas"]', icon: "canvas", title: "Алдын ала қарау", body: "Жасалғаннан кейін ойынның соңғы нұсқасы осында көрсетіледі." },
  { target: '[data-tour="download"]', icon: "download", title: "Ойынды жүктеу", body: "Жасалғаннан кейін HTML немесе ZIP форматында жүктеп, компьютерде немесе проекторда ашыңыз." },
];

export function StudioPage({ title, input, onBack }: StudioPageProps) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [studioState, setStudioState] = useState<StudioState>("building");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { game, launchUrl, creating, fixing, downloading, create, download, downloadHtml, submitFix } = useGameStudio();
  const loading = creating || fixing;
  const chips = formatLessonChips(input);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

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
  }, [create, input]);

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

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 20px", borderBottom: "1px solid #E6E2D8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <button type="button" onClick={onBack}>←</button>
          <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title || "Новая игра"}</strong>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {chips.map((chip) => (
              <span key={chip} style={{ padding: "3px 8px", borderRadius: "8px", background: "#E4EFEA", fontSize: "12px" }}>
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
          <button type="button" onClick={() => setShowTour(true)}>?</button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <aside data-tour="chat" style={{ width: "360px", borderRight: "1px solid #E6E2D8", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "12px", whiteSpace: "pre-wrap", color: msg.isError ? "#B4533B" : "#1A1A17" }}>
                <b>{msg.kind === "user" ? "Сіз" : "Ustaz"}:</b> {msg.text}
              </div>
            ))}
            {loading && <div>Жасалуда...</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} style={{ borderTop: "1px solid #E6E2D8", padding: "12px" }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              disabled={loading || !game}
              placeholder={game ? "Ойында не өзгерту керек?" : "Ойын жасалуын күтудеміз..."}
              style={{ width: "100%", resize: "vertical" }}
            />
            <button type="submit" disabled={loading || !game || !inputText.trim()}>Жіберу</button>
          </form>
        </aside>

        <section data-tour="canvas" style={{ flex: 1, minHeight: 0 }}>
          {studioState === "ready" && launchUrl ? (
            <iframe
              title="Игра"
              src={launchUrl}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#6F6E66" }}>
              {studioState === "error" ? "Жасау қатесі" : "Ойын жасалуда..."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
