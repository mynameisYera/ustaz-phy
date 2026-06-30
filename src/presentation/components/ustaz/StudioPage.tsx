import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CreateGameInput } from "@/domain/entities/GameContext";
import { formatLessonChips } from "@/domain/entities/GameContext";
import { useGameStudio } from "../../hooks/useGameStudio";
import { Tour, type TourStep } from "./Tour";

interface StudioPageProps {
  title: string;
  input: CreateGameInput;
  onBack: () => void;
}

type ChatMsg = { kind: "user" | "ai"; text: string; isError?: boolean };
type StudioState = "building" | "ready" | "error";

const TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="chat"]', icon: "chat", title: "Диалог", body: "Пишите, что изменить в игре, и ассистент пересоберет ее." },
  { target: '[data-tour="canvas"]', icon: "canvas", title: "Предпросмотр", body: "Здесь показывается актуальная версия игры после генерации." },
];

export function StudioPage({ title, input, onBack }: StudioPageProps) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [studioState, setStudioState] = useState<StudioState>("building");
  const [showTour, setShowTour] = useState(false);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { game, launchUrl, creating, fixing, create, submitFix } = useGameStudio();
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
          `${input.grade} класс · ${input.subject} · ${input.lessonTopic}`,
          input.description,
          input.materialText ? `PDF материал: ${input.materialText.length.toLocaleString()} символов` : null,
        ].filter(Boolean).join("\n\n"),
      },
    ]);

    void (async () => {
      const result = await create(input);
      if (result.ok) {
        setStudioState("ready");
        setMessages((prev) => [...prev, { kind: "ai", text: "Готово! Игра создана." }]);
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
      setMessages((prev) => [...prev, { kind: "ai", text: `Изменения применены — v${result.game.version}.` }]);
    } else {
      setStudioState("error");
      setMessages((prev) => [...prev, { kind: "ai", text: result.error, isError: true }]);
    }
  }

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
        <button type="button" onClick={() => setShowTour(true)}>?</button>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <aside data-tour="chat" style={{ width: "360px", borderRight: "1px solid #E6E2D8", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "12px", whiteSpace: "pre-wrap", color: msg.isError ? "#B4533B" : "#1A1A17" }}>
                <b>{msg.kind === "user" ? "Вы" : "Ustaz"}:</b> {msg.text}
              </div>
            ))}
            {loading && <div>Генерация...</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} style={{ borderTop: "1px solid #E6E2D8", padding: "12px" }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              disabled={loading || !game}
              placeholder={game ? "Что изменить в игре?" : "Ожидаем создание игры..."}
              style={{ width: "100%", resize: "vertical" }}
            />
            <button type="submit" disabled={loading || !game || !inputText.trim()}>Отправить</button>
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
              {studioState === "error" ? "Ошибка генерации" : "Создаем игру..."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
