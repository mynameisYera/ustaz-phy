import { useState, useRef, useEffect, type FormEvent } from 'react';
import type { CreateGameInput } from '@/domain/entities/GameContext';
import { formatLessonChips } from '@/domain/entities/GameContext';
import { useGameStudio } from '../../hooks/useGameStudio';

type StudioState = 'idle' | 'building' | 'ready' | 'error';

interface StudioPageProps {
  title: string;
  input: CreateGameInput;
  onBack: () => void;
}

type ChatMsg = { kind: 'user' | 'ai'; text: string; isError?: boolean };

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

export function StudioPage({ title, input, onBack }: StudioPageProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [studioState, setStudioState] = useState<StudioState>('building');
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const { game, launchUrl, creating, fixing, create, submitFix } = useGameStudio();
  const chips = formatLessonChips(input);
  const loading = creating || fixing;

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
    setInputText('');
    setMessages((prev) => [...prev, { kind: 'user', text }]);
    setStudioState('building');

    if (!game) {
      const result = await create({ ...input, description: text });
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [...prev, { kind: 'ai', text: 'Готово! Игра создана и готова к предпросмотру.' }]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    } else {
      const result = await submitFix(text);
      if (result.ok) {
        setStudioState('ready');
        setMessages((prev) => [...prev, { kind: 'ai', text: `Изменения применены — v${result.game.version}.` }]);
      } else {
        setStudioState('error');
        setMessages((prev) => [...prev, { kind: 'ai', text: result.error, isError: true }]);
      }
    }
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
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ width: '28%', minWidth: '320px', borderRight: '1px solid #E6E2D8', display: 'flex', flexDirection: 'column', background: '#F7F5EF' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.kind === 'user' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ maxWidth: '88%', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
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
            <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '12px 12px 10px' }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Опишите, что нужно изменить…"
                rows={2}
                disabled={loading}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as FormEvent); } }}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.55', color: '#1A1A17', background: 'transparent' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" disabled={loading} style={{ width: '30px', height: '30px', border: 'none', borderRadius: '8px', background: loading ? '#A6C8C0' : '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3.5M3.5 8 8 3.5 12.5 8"/></svg>
                </button>
              </div>
            </form>
          </div>
        </aside>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: '#F7F5EF' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, width: '100%', background: '#FFFFFF', borderLeft: '1px solid #E6E2D8', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

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
    </div>
  );
}
