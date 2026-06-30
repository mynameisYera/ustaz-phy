import { useState, useRef, useEffect, type FormEvent } from 'react';
import type { CreateGameInput } from '@/domain/entities/GameContext';
import { formatLessonChips } from '@/domain/entities/GameContext';
import { useGameStudio } from '../../hooks/useGameStudio';
import { Tour, type TourStep } from './Tour';

type StudioState = 'idle' | 'building' | 'ready' | 'error';

interface StudioPageProps {
  title: string;
  input: CreateGameInput;
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

function buildInitialMessage(input: CreateGameInput): string {
  const parts = [
    `${input.grade} класс · ${input.subject} · ${input.lessonTopic}`,
    input.description,
  ];
  if (input.materialText) {
    parts.push(`PDF материал: ${input.materialText.length.toLocaleString()} символов`);
  }
  return parts.join('\n\n');
}

export function StudioPage({ title, onBack }: StudioPageProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [studioState, setStudioState] = useState<StudioState>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { game, launchUrl, creating, fixing, create, submitFix } = useGameStudio();
  const chips = formatLessonChips(input);
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

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const initialMessage = buildInitialMessage(input);
    setMessages([{ kind: 'user', text: initialMessage }]);
    setStudioState('building');

    void (async () => {
      const result = await create(input);
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [
          ...prev,
          { kind: 'ai', text: 'Готово! Игра создана с учётом класса, предмета, темы и материала.' },
        ]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    })();
  }, [create, input]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { kind: 'user', text }]);
    setStudioState('building');

    if (!game) {
      const result = await create(text);
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
    setStudioState('building');
    setMessages((prev) => [...prev, { kind: 'user', text: 'Повторить генерацию' }]);

    void (async () => {
      const result = await create(input);
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [...prev, { kind: 'ai', text: 'Готово! Игра создана.' }]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    })();
  }

  return (
    <div className="u365-studio-full">
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
            {chips.map((c) => (
              <span key={c} style={{ padding: '4px 9px', background: '#E4EFEA', color: '#3B5A50', borderRadius: '8px', fontSize: '12px' }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', padding: '2px' }}>
            <button type="button" style={{ height: '28px', padding: '0 12px', border: 'none', borderRadius: '6px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>Предпросмотр</button>
          </div>
          <button type="button" style={{ height: '32px', padding: '0 14px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: '#1A1A17', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>Поделиться</button>
          <button type="button" style={{ height: '32px', padding: '0 14px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>Опубликовать</button>
          <button type="button" style={{ width: '32px', height: '32px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#6F6E66"><circle cx="4" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="12" cy="8" r="1.4"/></svg>
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Chat panel */}
        <aside style={{ width: '28%', minWidth: '320px', borderRight: '1px solid #E6E2D8', display: 'flex', flexDirection: 'column', background: '#F7F5EF' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.kind === 'user' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ maxWidth: '88%', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
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
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: msg.isError ? '#6F6E66' : '#33322C', whiteSpace: 'pre-wrap' }}>
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
                  Игра создаётся…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

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
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Опишите, что нужно изменить…"
                rows={2}
                disabled={loading}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as FormEvent); } }}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.55', color: '#1A1A17', background: 'transparent' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <button type="button" title="Прикрепить файл" style={{ width: '30px', height: '30px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#F7F5EF' }}>
          {/* Canvas toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #E6E2D8', flexShrink: 0 }}>
            <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', padding: '2px' }}>
              <button type="button" style={{ width: '30px', height: '26px', border: 'none', borderRadius: '6px', background: '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.4"><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M6 13.5h4" strokeLinecap="round"/></svg>
              </button>
              <button type="button" style={{ width: '30px', height: '26px', border: 'none', borderRadius: '6px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.4"><rect x="5" y="2" width="6" height="12" rx="1.2"/></svg>
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
            <div style={{ width: '100%', maxWidth: '720px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', height: '100%', maxHeight: '560px', display: 'flex', flexDirection: 'column' }}>

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
                  <div style={{ flex: 1, padding: '34px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#6F6E66', fontSize: '14px', margin: 0 }}>
                      ИИ учитывает {input.grade} класс, предмет «{input.subject}», тему «{input.lessonTopic}»
                      {input.materialText ? ' и загруженный PDF' : ''}…
                    </p>
                  </div>
                </>
              )}

              {studioState === 'ready' && (
                <iframe
                  title="Игра"
                  src={launchUrl ?? undefined}
                  sandbox="allow-scripts allow-same-origin"
                  style={{ flex: 1, border: 'none', width: '100%', height: '100%', minHeight: 0, display: 'block' }}
                />
              )}

              {studioState === 'error' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '22px', margin: 0 }}>Произошла ошибка при создании игры</h3>
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
