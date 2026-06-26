import { useState, type FormEvent } from "react";
import { FixRequestForm } from "./FixRequestForm";
import { GamePlayer } from "./GamePlayer";
import { useGameStudio } from "../hooks/useGameStudio";

export function GameStudio() {
  const [description, setDescription] = useState(
    "Викторина по кинематике: скорость, ускорение, графики движения"
  );

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
  } = useGameStudio();

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    create(description);
  }

  return (
    <div className="studio">
      <header className="studio-header">
        <h1>Game Studio</h1>
        <p>Генерация игр через</p>
        {creating && (
          <p className="ai-status">ИИ создаёт интерактивную игру обычно 10–30 сек</p>
        )}
        {fixing && (
          <p className="ai-status">ИИ применяет ваш фикс и пересобирает игру…</p>
        )}
      </header>

      <form className="create-form" onSubmit={handleCreate}>
        <label htmlFor="description">Описание игры</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={creating}
        />
        <button type="submit" disabled={creating || !description.trim()}>
          {creating ? "ИИ генерирует…" : "1. Создать и запустить игру"}
        </button>
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
