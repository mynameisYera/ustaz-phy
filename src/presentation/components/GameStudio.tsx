import { useState, useRef, useEffect, type FormEvent } from "react";
import type { OutputFormat } from "@/domain/entities/GameContext";
import { GamePlayer } from "./GamePlayer";
import { useGameStudio } from "../hooks/useGameStudio";
type ChatMsg = {
  kind: "user" | "ai";
  text: string;
  isError?: boolean;
};

export function GameStudio() {
  const [input, setInput] = useState(
    "Кинематика бойынша викторина: жылдамдық, үдеу, қозғалыс   графиктері"
  );
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("html");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { game, launchUrl, creating, fixing, downloading, create, download, submitFix } =
    useGameStudio();

  const loading = creating || fixing;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { kind: "user", text }]);

    if (!game) {
      const result = await create({
        grade: 9,
        subject: "Физика",
        lessonTopic: "Кинематика",
        description: text,
        outputFormat,
      });
      setMessages((prev) => [
        ...prev,
        result.ok
          ? { kind: "ai", text: "Ойын жасалып, іске қосылды." }
          : { kind: "ai", text: result.error, isError: true },
      ]);
    } else {
      const result = await submitFix(text);
      setMessages((prev) => [
        ...prev,
        result.ok
          ? { kind: "ai", text: `Дайын — v${result.game.version} нұсқасына жаңартылды.` }
          : { kind: "ai", text: result.error, isError: true },
      ]);
    }

    textareaRef.current?.focus();
  }

  const hasGame = Boolean(game);

  return (
    <div className="studio">
      <div className="studio-left">
        <header className="studio-header">
          <h1>Game Studio</h1>
          
        </header>

        <div className="chat-history">
          {messages.length === 0 && (
            <p className="chat-empty">
              Сабақ ойынын сипаттап, «Жасау» батырмасын басыңыз.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg chat-msg--${msg.kind}${msg.isError ? " chat-msg--error" : ""}`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-msg--ai chat-msg--loading">
              {creating ? "Ойын жасалып жатыр…" : "Түзету қолданылуда…"}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
          {!hasGame && (
            <div className="format-toggle" role="group" aria-label="Формат">
              <button
                type="button"
                className={`format-pill${outputFormat === "html" ? " format-pill--active" : ""}`}
                onClick={() => setOutputFormat("html")}
                disabled={loading}
              >
                HTML
              </button>
              <button
                type="button"
                className={`format-pill${outputFormat === "react" ? " format-pill--active" : ""}`}
                onClick={() => setOutputFormat("react")}
                disabled={loading}
              >
                React
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              hasGame
                ? "Не түзету керек? (Enter — жіберу, Shift+Enter — жаңа жол)"
                : "Ойын сипаты…"
            }
            rows={3}
            disabled={loading}
          />
          <div className="chat-actions">
            {hasGame && (
              <button
                type="button"
                className="btn-secondary"
                onClick={download}
                disabled={downloading}
              >
                {downloading ? "Жинақталып жатыр…" : "ZIP жүктеу"}
              </button>
            )}
            <button type="submit" disabled={loading || !input.trim()}>
              {loading
                ? creating
                  ? "Жасалып жатыр…"
                  : "Түзету қолданылуда…"
                : hasGame
                ? "Түзетуді жіберу"
                : "Ойынды жасап іске қосу"}
            </button>
          </div>
        </form>
      </div>

      <div className="studio-right">
        <GamePlayer launchUrl={launchUrl} />
      </div>
    </div>
  );
}
