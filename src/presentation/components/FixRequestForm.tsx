import { useState, type FormEvent } from "react";

interface Props {
  onSubmit: (message: string) => void;
  loading: boolean;
  version: number;
}

export function FixRequestForm({ onSubmit, loading, version }: Props) {
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(message);
    setMessage("");
  }

  return (
    <form className="fix-form" onSubmit={handleSubmit}>
      <h3>Запрос на фикс (v{version})</h3>
      <p className="hint">
        Опишите, что исправить прямо во время игры — игра пересоберётся с новой версией.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Например: добавь вопрос про закон Ома, сделай кнопки крупнее"
        rows={3}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !message.trim()}>
        {loading ? "Применяем фикс…" : "Отправить фикс"}
      </button>
    </form>
  );
}
