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
      <h3>Түзету сұрауы (v{version})</h3>
      <p className="hint">
        Ойын кезінде не түзету керектігін сипаттаңыз — ойын жаңа нұсқамен қайта жинақталады.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Мысалы: Ом заңы туралы сұрақ қос, түймелерді үлкенірек жаса"
        rows={3}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !message.trim()}>
        {loading ? "Түзету қолданылуда…" : "Түзетуді жіберу"}
      </button>
    </form>
  );
}
