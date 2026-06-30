import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useGameStudio } from '../../hooks/useGameStudio';
import { Tour, type TourStep } from './Tour';

type StudioState = 'idle' | 'building' | 'ready' | 'error';

interface StudioPageProps {
  title: string;
  onBack: () => void;
  initialPrompt?: string;
  initialFiles?: File[];
}

type ChatMsg = { kind: 'user' | 'ai'; text: string; isError?: boolean; fileNames?: string[] };

interface UploadingFile { name: string; progress: number }

const TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="chat"]',   icon: 'chat',     title: 'Диалог с ассистентом',  body: 'Опишите, что нужно изменить — добавить вопрос, поменять тему или прикрепить файл. Ассистент пересоберёт игру.' },
  { target: '[data-tour="canvas"]', icon: 'canvas',   title: 'Живой предпросмотр',     body: 'Здесь игра обновляется в реальном времени. Можно открыть её в новой вкладке или обновить вручную.' },
  { target: '[data-tour="toggle"]', icon: 'phone',    title: 'Десктоп и мобильный',    body: 'Переключайтесь между предпросмотром на компьютере и телефоне.' },
  { target: '[data-tour="download"]', icon: 'download', title: 'Скачать игру',          body: 'Когда игра готова — скачайте HTML-файл и откройте его в любом браузере или поделитесь с учениками.' },
];

const CHIPS = ['5 класс', 'Математика', 'Урок 12 · Дроби'];

export function StudioPage({ title, onBack, initialPrompt, initialFiles }: StudioPageProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>(initialFiles ?? []);
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [studioState, setStudioState] = useState<StudioState>('idle');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showTour, setShowTour] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSubmitted = useRef(false);

  const { game, launchUrl, creating, fixing, create, submitFix } = useGameStudio();

  const loading = creating || fixing;

  useEffect(() => {
    if (!initialPrompt || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    const filesToSend = initialFiles ?? [];
    const fileNames = filesToSend.map((f) => f.name);
    setAttachedFiles([]);
    setMessages([{ kind: 'user', text: initialPrompt, fileNames: fileNames.length > 0 ? fileNames : undefined }]);
    setStudioState('building');
    create(initialPrompt, filesToSend).then((result) => {
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [...prev, { kind: 'ai', text: 'Готово! Игра создана и готова к предпросмотру.' }]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    });
  }, [create, initialPrompt, initialFiles]);

  useEffect(() => {
    if (creating || fixing) setStudioState('building');
  }, [creating, fixing]);

  useEffect(() => {
    if (game) setStudioState('ready');
  }, [game]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const filesToSend = attachedFiles;
    setAttachedFiles([]);
    const fileNames = filesToSend.map((f) => f.name);
    setMessages((prev) => [...prev, { kind: 'user', text, fileNames: fileNames.length > 0 ? fileNames : undefined }]);
    setStudioState('building');

    if (!game) {
      const result = await create(text, filesToSend);
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [...prev, { kind: 'ai', text: 'Готово! Игра создана и готова к предпросмотру.' }]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    } else {
      const result = await submitFix(text, filesToSend);
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [...prev, { kind: 'ai', text: `Изменения применены — v${result.game.version}.` }]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;

    // Read files one by one, showing progress for each
    let idx = 0;
    function readNext() {
      if (idx >= picked.length) { setUploadingFile(null); return; }
      const file = picked[idx++];
      setUploadingFile({ name: file.name, progress: 0 });
      const reader = new FileReader();
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadingFile({ name: file.name, progress: Math.round(ev.loaded / ev.total * 100) });
      };
      reader.onload = () => {
        setUploadingFile({ name: file.name, progress: 100 });
        setAttachedFiles((prev) => [...prev, file]);
        setTimeout(readNext, 120);
      };
      reader.onerror = readNext;
      reader.readAsDataURL(file);
    }
    readNext();
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRetry() {
    setStudioState('idle');
  }

  return (
    <div className="u365-studio-full">
      {/* Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '11px 20px', borderBottom: '1px solid #E6E2D8', background: '#F7F5EF', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ width: '32px', height: '32px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#1A1A17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span style={{ fontFamily: 'Spectral, serif', fontSize: '18px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title || 'Новая игра'}
            </span>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#A6A498" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 2.5 11.5 5 5 11.5 2.5 12l.5-2.5z"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {CHIPS.map((c) => (
              <span key={c} style={{ padding: '4px 9px', background: '#E4EFEA', color: '#3B5A50', borderRadius: '8px', fontSize: '12px' }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div data-tour="toggle" style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', padding: '2px' }}>
            <button type="button" style={{ height: '28px', padding: '0 12px', border: 'none', borderRadius: '6px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>Предпросмотр</button>
          </div>
          <button
            data-tour="download"
            type="button"
            disabled={!game}
            onClick={() => {
              const html = game?.files.find((f) => f.path === 'index.html')?.content;
              if (!html) return;
              const blob = new Blob([html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `game-v${game!.version}.html`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ height: '32px', padding: '0 14px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: game ? '#1A1A17' : '#A6A498', fontFamily: 'inherit', fontSize: '13px', cursor: game ? 'pointer' : 'default' }}
          >
            Скачать
          </button>
          <button type="button" title="Показать подсказки" onClick={() => setShowTour(true)} style={{ width: '32px', height: '32px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0"/></svg>
          </button>
        </div>
      </header>

      {/* Split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Chat panel */}
        <aside data-tour="chat" style={{ width: '28%', minWidth: '320px', borderRight: '1px solid #E6E2D8', display: 'flex', flexDirection: 'column', background: '#F7F5EF' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {messages.length === 0 && (
              <div style={{ color: '#A6A498', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                Опишите игру, чтобы начать…
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.kind === 'user' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ maxWidth: '88%', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', lineHeight: '1.55' }}>
                      {msg.text}
                    </div>
                    {msg.fileNames && msg.fileNames.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                        {msg.fileNames.map((name, fi) => (
                          <span key={fi} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 9px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', fontSize: '12px', color: '#6F6E66' }}>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#6F6E66" strokeWidth="1.3" strokeLinecap="round"><rect x="2.5" y="1.5" width="9" height="11" rx="1.5"/><path d="M5 5h4M5 7.5h4"/></svg>
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: msg.isError ? '#F3E3DE' : '#E4EFEA', color: msg.isError ? '#B4533B' : '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>
                      U
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: msg.isError ? '#6F6E66' : '#33322C' }}>
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {studioState === 'building' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E4EFEA', color: '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>U</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6F6E66', fontSize: '14px' }}>
                  <span style={{ display: 'inline-flex', gap: '4px' }}>
                    <span className="u365-dot-1" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E6E5C' }} />
                    <span className="u365-dot-2" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E6E5C' }} />
                    <span className="u365-dot-3" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E6E5C' }} />
                  </span>
                  Игра создаётся…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div style={{ borderTop: '1px solid #E6E2D8', padding: '14px', background: '#F7F5EF', flexShrink: 0 }}>
            <input ref={fileInputRef} type="file" multiple accept="image/*,text/*,.txt,.csv,.md,.json,.pdf,.pptx,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
            <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '12px 12px 10px' }}>
              {uploadingFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FBFAF6', border: '1px solid #E6E2D8', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#E4EFEA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="#1E6E5C" strokeWidth="1.3" strokeLinecap="round"><rect x="2.5" y="1.5" width="9" height="11" rx="1.5"/><path d="M5 5h4M5 7.5h4"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#1A1A17', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadingFile.name}</span>
                      <span style={{ fontSize: '12px', color: '#6F6E66', flexShrink: 0 }}>{uploadingFile.progress}%</span>
                    </div>
                    <div style={{ height: '3px', background: '#EEEAE0', borderRadius: '99px', overflow: 'hidden', marginTop: '6px' }}>
                      <div style={{ width: `${uploadingFile.progress}%`, height: '100%', background: '#1E6E5C', transition: 'width .1s', animation: uploadingFile.progress < 100 ? 'u365pulse 1.4s infinite' : 'none' }} />
                    </div>
                  </div>
                  <button type="button" onClick={() => setUploadingFile(null)} style={{ width: '22px', height: '22px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#A6A498" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>
                  </button>
                </div>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Опишите, что нужно изменить…"
                rows={2}
                disabled={loading}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as FormEvent); } }}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.55', color: '#1A1A17', background: 'transparent' }}
              />
              {attachedFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {attachedFiles.map((f, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', background: '#EAF1ED', border: '1px solid #C8DDD3', borderRadius: '6px', fontSize: '12px', color: '#3B5A50' }}>
                      {f.name}
                      <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1, color: '#6F9E8A' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <button type="button" title="Прикрепить файл" onClick={() => fileInputRef.current?.click()} style={{ width: '30px', height: '30px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9"/></svg>
                </button>
                <button type="submit" disabled={loading} style={{ width: '30px', height: '30px', border: 'none', borderRadius: '8px', background: loading ? '#A6C8C0' : '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3.5M3.5 8 8 3.5 12.5 8"/></svg>
                </button>
              </div>
            </form>
          </div>
        </aside>

        {/* Canvas */}
        <section data-tour="canvas" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#F7F5EF' }}>
          {/* Canvas toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #E6E2D8', flexShrink: 0 }}>
            <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', padding: '2px' }}>
              <button type="button" onClick={() => setViewMode('desktop')} style={{ width: '30px', height: '26px', border: 'none', borderRadius: '6px', background: viewMode === 'desktop' ? '#1E6E5C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={viewMode === 'desktop' ? '#fff' : '#6F6E66'} strokeWidth="1.4"><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M6 13.5h4" strokeLinecap="round"/></svg>
              </button>
              <button type="button" onClick={() => setViewMode('mobile')} style={{ width: '30px', height: '26px', border: 'none', borderRadius: '6px', background: viewMode === 'mobile' ? '#1E6E5C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={viewMode === 'mobile' ? '#fff' : '#6F6E66'} strokeWidth="1.4"><rect x="5" y="2" width="6" height="12" rx="1.2"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" style={{ width: '30px', height: '30px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3"/></svg>
              </button>
              <button type="button" style={{ width: '30px', height: '30px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5"/></svg>
              </button>
            </div>
          </div>

          {/* Canvas body */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', minHeight: 0 }}>
            <div style={viewMode === 'mobile' ? { width: '390px', flexShrink: 0, background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '40px', overflow: 'hidden', height: '100%', maxHeight: '680px', display: 'flex', flexDirection: 'column', boxShadow: '0 0 0 8px #E6E2D8, 0 0 0 10px #D4CFBF' } : { width: '100%', maxWidth: '720px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', height: '100%', maxHeight: '560px', display: 'flex', flexDirection: 'column' }}>

              {/* IDLE */}
              {studioState === 'idle' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '40px', textAlign: 'center', color: '#A6A498' }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#D8D3C6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="8" width="32" height="32" rx="6"/>
                    <path d="M18 24h12M24 18v12"/>
                  </svg>
                  <p style={{ fontSize: '14px', margin: 0 }}>Опишите игру в чате слева, чтобы начать генерацию</p>
                </div>
              )}

              {/* BUILDING */}
              {studioState === 'building' && (
                <>
                  <div className="u365-bar-progress" />
                  <div style={{ flex: 1, padding: '34px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="u365-skeleton-line" style={{ height: '26px', width: '55%', background: '#F0EDE4', borderRadius: '6px' }} />
                    <div className="u365-skeleton-line-d1" style={{ height: '14px', width: '80%', background: '#F0EDE4', borderRadius: '6px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                      <div className="u365-skeleton-line-d2" style={{ height: '120px', background: '#F4F1EA', borderRadius: '10px' }} />
                      <div className="u365-skeleton-line-d3" style={{ height: '120px', background: '#F4F1EA', borderRadius: '10px' }} />
                    </div>
                    <div className="u365-skeleton-line-d4" style={{ height: '14px', width: '60%', background: '#F0EDE4', borderRadius: '6px' }} />
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', color: '#6F6E66', fontSize: '14px' }}>
                      <span style={{ display: 'inline-flex', gap: '4px' }}>
                        <span className="u365-dot-1" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E6E5C' }} />
                        <span className="u365-dot-2" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E6E5C' }} />
                        <span className="u365-dot-3" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E6E5C' }} />
                      </span>
                      Игра создаётся…
                    </div>
                  </div>
                </>
              )}

              {/* READY */}
              {studioState === 'ready' && (
                <iframe
                  title="Игра"
                  src={launchUrl ?? undefined}
                  sandbox="allow-scripts allow-same-origin"
                  style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
                />
              )}

              {/* ERROR */}
              {studioState === 'error' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '1.5px solid #B4533B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B4533B" strokeWidth="1.6" strokeLinecap="round"><path d="M12 7.5v5.5M12 16.5h0"/></svg>
                  </div>
                  <h3 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '22px', margin: 0 }}>Произошла ошибка при создании игры</h3>
                  <p style={{ fontSize: '14px', color: '#6F6E66', maxWidth: '340px', margin: 0, lineHeight: '1.55' }}>
                    Что-то пошло не так во время генерации. Проверьте описание и попробуйте ещё раз.
                  </p>
                  <button type="button" onClick={handleRetry} style={{ marginTop: '4px', height: '38px', padding: '0 20px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>
                    Повторить
                  </button>
                </div>
              )}

            </div>
          </div>
        </section>
      </div>
      {showTour && <Tour steps={TOUR_STEPS} onClose={() => setShowTour(false)} />}
    </div>
  );
}
