import { useState, useRef, useEffect, type FormEvent } from "react";
import { GamePlayer } from "./GamePlayer";
import { useGameStudio } from "../hooks/useGameStudio";
type ChatMsg = {
  kind: "user" | "ai";
  text: string;
  isError?: boolean;
};

export function GameStudio() {
  const [input, setInput] = useState(
    "Викторина по кинематике: скорость, ускорение, графики движения"
  );
  const [messages, setMessages] = useState<ChatMsg[]>([]);
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
      const result = await create(text);
      setMessages((prev) => [
        ...prev,
        result.ok
          ? { kind: "ai", text: "Игра создана и запущена." }
          : { kind: "ai", text: result.error, isError: true },
      ]);
    } else {
      const result = await submitFix(text);
      setMessages((prev) => [
        ...prev,
        result.ok
          ? { kind: "ai", text: `Готово — обновлено до v${result.game.version}.` }
          : { kind: "ai", text: result.error, isError: true },
      ]);
    }

    textareaRef.current?.focus();
  }

  const hasGame = Boolean(game);

  return (
    <div className="studio">
      {/* LEFT: Chat panel */}
      <div className="studio-left">
        <header className="studio-header">
          <h1>Game Studio</h1>
          <p>Генерация учебных игр для уроков через OpenAI — ключ задаётся в .env на сервере.</p>
        </header>

        <div className="chat-history">
          {messages.length === 0 && (
            <p className="chat-empty">
              Опишите учебную игру для урока и нажмите «Создать» — здесь появится история.
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
              {creating ? "Генерирую игру…" : "Применяю фикс…"}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
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
                ? "Что исправить? (Enter — отправить, Shift+Enter — новая строка)"
                : "Описание игры…"
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
                {downloading ? "Собираем…" : "Скачать ZIP"}
              </button>
            )}
            <button type="submit" disabled={loading || !input.trim()}>
              {loading
                ? creating
                  ? "Генерирую…"
                  : "Применяю фикс…"
                : hasGame
                ? "Отправить фикс"
                : "Создать и запустить игру"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT: Preview */}
      <div className="studio-right">
        <GamePlayer launchUrl={launchUrl} />
      </div>
    </div>
  );
}
