import { useEffect, useState, type FormEvent } from "react";
import {
  loadGrokApiKey,
  saveGrokApiKey,
} from "@/infrastructure/storage/grokApiKeyStorage";
import { FixRequestForm } from "./FixRequestForm";
import { GamePlayer } from "./GamePlayer";
import { useGameStudio } from "../hooks/useGameStudio";

export function GameStudio() {
  const [description, setDescription] = useState(
    "Викторина по кинематике: скорость, ускорение, графики движения"
  );
  const [apiKey, setApiKey] = useState(loadGrokApiKey);

  useEffect(() => {
    saveGrokApiKey(apiKey);
  }, [apiKey]);

  const {
    game,
    launchUrl,
    creating,
    fixing,
    downloading,
    error,
    create,
    download,
    submitFix,
  } = useGameStudio(apiKey);

  const canGenerate = Boolean(apiKey.trim()) && !creating;

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    create(description);
  }

  return (
    <div className="studio">
      <header className="studio-header">
        <h1>Game Studio</h1>
        <p>
          Генерация игр через Groq (Llama) или xAI Grok — ключ вводите сами, он
          хранится только в браузере.
        </p>
        {creating && (
          <p className="ai-status">ИИ создаёт интерактивную игру обычно 10–30 сек</p>
        )}
        {fixing && (
          <p className="ai-status">ИИ применяет ваш фикс и пересобирает игру…</p>
        )}
      </header>

      <form className="create-form" onSubmit={handleCreate}>
        <label htmlFor="api-key">API-ключ Groq / xAI</label>
        <input
          id="api-key"
          type="password"
          className="api-key-input"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="gsk_... (Groq) или xai-... (xAI)"
          autoComplete="off"
          spellCheck={false}
          disabled={creating || fixing}
        />
        <p className="field-hint">
          Получить ключ:{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            Groq
          </a>
          {" · "}
          <a href="https://console.x.ai" target="_blank" rel="noreferrer">
            xAI
          </a>
        </p>

        <label htmlFor="description">Описание игры</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={creating}
        />
        <button type="submit" disabled={!canGenerate || !description.trim()}>
          {creating ? "ИИ генерирует…" : "1. Создать и запустить игру"}
        </button>
        {!apiKey.trim() && (
          <p className="field-hint field-hint--warn">
            Введите API-ключ, чтобы создавать и править игры.
          </p>
        )}
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {game && (
        <div className="actions">
          <span className="version">Версия: v{game.version}</span>
          <button type="button" onClick={download} disabled={downloading}>
            {downloading ? "Собираем архив…" : "2. Скачать файлы (ZIP)"}
          </button>
        </div>
      )}

      <div className="workspace">
        <GamePlayer launchUrl={launchUrl} />
        {game && (
          <FixRequestForm
            version={game.version}
            loading={fixing}
            onSubmit={submitFix}
          />
        )}
      </div>

      {game && game.fixHistory.length > 0 && (
        <aside className="fix-history">
          <h3>История фиксов</h3>
          <ul>
            {game.fixHistory.map((fix) => (
              <li key={fix.id}>
                <time>{fix.createdAt.toLocaleTimeString()}</time> — {fix.message}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
