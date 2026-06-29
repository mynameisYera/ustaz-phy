import { useCallback, useEffect, useState, type FormEvent } from "react";

interface RagFile {
  id: string;
  filename: string;
  status: string;
  bytes: number;
  lastError?: string;
  chunkCount?: number;
  hasText?: boolean;
  chunkSample?: string[];
  isWatermarkOnly?: boolean;
}

interface RagStatus {
  configured: boolean;
  vectorStoreId?: string;
  name?: string;
  fileCounts?: {
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
  };
  files?: RagFile[];
}

type QueryMsg = { kind: "user" | "ai"; text: string; isError?: boolean };

export function RagPlayground() {
  const [status, setStatus] = useState<RagStatus>({ configured: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("7 сынып физика: 1-параграф атауы");
  const [querying, setQuerying] = useState(false);
  const [messages, setMessages] = useState<QueryMsg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rag/status");
      const data = (await res.json()) as RagStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Статус алу қатесі");
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreateStore() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/rag/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mektep kitaptary" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Vector Store қатесі");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/rag/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Жүктеу қатесі");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (deletingId) return;
    setDeletingId(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/rag/files/${encodeURIComponent(fileId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Жою қатесі");
      setStatus((prev) => ({
        ...prev,
        files: prev.files?.filter((f) => f.id !== fileId),
        fileCounts: prev.fileCounts
          ? {
              ...prev.fileCounts,
              total: Math.max(0, prev.fileCounts.total - 1),
              completed: Math.max(0, prev.fileCounts.completed - 1),
            }
          : prev.fileCounts,
      }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleQuery(e: FormEvent) {
    e.preventDefault();
    const text = query.trim();
    if (!text || querying) return;

    setQuery("");
    setMessages((prev) => [...prev, { kind: "user", text }]);
    setQuerying(true);
    setError(null);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Сұрау қатесі");
      let answer = data.answer as string;
      if (data.sources?.length) {
        answer += `\n\n📎 Content sources: ${data.sources.map((s: { filename: string; preview: string }) => `${s.filename} — «${s.preview.slice(0, 80)}…»`).join("; ")}`;
      }
      setMessages((prev) => [...prev, { kind: "ai", text: answer }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Қате";
      setMessages((prev) => [...prev, { kind: "ai", text: msg, isError: true }]);
    } finally {
      setQuerying(false);
    }
  }

  function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function statusLabel(s: string) {
    if (s === "completed") return "✓ дайын";
    if (s === "in_progress") return "⏳ өңделуде";
    if (s === "failed") return "✗ қате";
    return s;
  }

  return (
    <div className="rag-playground">
      <header className="rag-header">
        <div>
          <h1>RAG Playground</h1>
          <p>OpenAI File Search — мектеп оқулықтарын PDF ретінде жүктеңіз</p>
        </div>
        <button type="button" className="rag-btn-ghost" onClick={refresh} disabled={loading}>
          Жаңарту
        </button>
      </header>

      {error && <p className="rag-error">{error}</p>}

      <div className="rag-grid">
        <section className="rag-card">
          <h2>1. Vector Store</h2>
          {status.configured ? (
            <>
              <dl className="rag-meta">
                <div><dt>ID</dt><dd><code>{status.vectorStoreId}</code></dd></div>
                <div><dt>Атауы</dt><dd>{status.name}</dd></div>
                {status.fileCounts && (
                  <div>
                    <dt>Файлдар</dt>
                    <dd>
                      {status.fileCounts.completed} дайын / {status.fileCounts.total} барлығы
                      {status.fileCounts.in_progress > 0 && ` · ${status.fileCounts.in_progress} өңделуде`}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <>
              <p className="rag-hint">Vector Store әлі жоқ. Алдымен жасаңыз, содан кейін PDF жүктеңіз.</p>
              <button type="button" className="rag-btn-primary" onClick={handleCreateStore} disabled={creating}>
                {creating ? "Жасалуда…" : "Vector Store жасау"}
              </button>
            </>
          )}
        </section>

        <section className="rag-card">
          <h2>2. PDF жүктеу</h2>
          <p className="rag-hint">
            OpenAI автоматты түрде мәтінді шығарып, chunk-тарға бөледі.
            <strong> Маңызды:</strong> OKULYK сканерленген PDF тек водяной знак береді — RAG жұмыс істемейді.
            Мұндай PDF үшін: <code>npm run rag:ocr -- kitap.pdf</code> → <code>npm run rag:index</code>
          </p>
          <label className="rag-upload">
            <input
              type="file"
              accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? "Жүктелуде…" : "PDF немесе MD/TXT (OCR) таңдау"}
          </label>
        </section>

        <section className="rag-card rag-card-wide">
          <h2>3. Жүктелген kitapтар</h2>
          {!status.files?.length ? (
            <p className="rag-hint">Әлі PDF жоқ</p>
          ) : (
            <ul className="rag-files">
              {status.files.map((f) => (
                <li key={f.id}>
                  <div>
                    <strong>{f.filename}</strong>
                    <span className={`rag-status rag-status--${f.status}`}>{statusLabel(f.status)}</span>
                    <span className="rag-bytes">{formatBytes(f.bytes)}</span>
                    {f.lastError && <span className="rag-file-error">{f.lastError}</span>}
                    {f.status === "completed" && f.isWatermarkOnly && (
                      <span className="rag-file-error">
                        ⚠ Тек OKULYK водяной знағы — kitap мазмұны жоқ. PDF-ті OCR арқылы .txt-ке айналдырыңыз.
                      </span>
                    )}
                    {f.status === "completed" && f.hasText === false && !f.isWatermarkOnly && (
                      <span className="rag-file-error">⚠ Мәтін табылмады — сканерленген PDF болуы мүмкін</span>
                    )}
                    {f.chunkSample && f.chunkSample.length > 0 && (
                      <details className="rag-chunk-preview">
                        <summary>Chunk үлгісі ({f.chunkSample.length})</summary>
                        {f.chunkSample.map((c, i) => (
                          <p key={i}>{c.slice(0, 180)}{c.length > 180 ? "…" : ""}</p>
                        ))}
                      </details>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rag-btn-danger"
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId === f.id}
                  >
                    {deletingId === f.id ? "Жойылуда…" : "Жою"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rag-card rag-card-wide">
          <h2>4. File Search сынағы</h2>
          <p className="rag-hint">Kitapтардан сұрақ қойып, RAG жұмысын тексеріңіз</p>
          <div className="rag-chat">
            {messages.length === 0 && (
              <p className="rag-hint">Сұрақ жазыңыз — жауап kitap материалынан ізделеді</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`rag-msg rag-msg--${m.kind}${m.isError ? " rag-msg--error" : ""}`}>
                {m.text}
              </div>
            ))}
            {querying && <div className="rag-msg rag-msg--ai">Іздеу…</div>}
          </div>
          <form className="rag-query-form" onSubmit={handleQuery}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              placeholder="Сұрақ…"
              disabled={querying}
            />
            <button type="submit" className="rag-btn-primary" disabled={querying || !query.trim()}>
              {querying ? "Іздеу…" : "Сұрау"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
