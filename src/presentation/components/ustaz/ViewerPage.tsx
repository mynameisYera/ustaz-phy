import { useState } from 'react';
import { Tour, type TourStep } from './Tour';

interface ViewerPageProps {
  title: string;
  onBack: () => void;
  onUse: (title: string) => void;
}

const VIEWER_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="frame"]', icon: 'open', title: 'Просмотр шаблона', body: 'Сетка викторины открывается в формате большого экрана с категориями и стоимостью вопросов.' },
  { target: '[data-tour="use"]', icon: 'edit', title: 'Используйте как основу', body: 'Откройте этот шаблон в студии и адаптируйте вопросы под свой урок.' },
];

type QuizQuestion = {
  id: string;
  category: string;
  value: number;
  question: string;
  answer: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
};

const SAMPLE_QUESTIONS: QuizQuestion[] = [
  { id: 'm-100', category: 'Механика', value: 100, question: 'Как называется сила, с которой Земля притягивает тело?', answer: 'Сила тяжести.' },
  { id: 'm-200', category: 'Механика', value: 200, question: 'Какой прибор измеряет силу?', answer: 'Динамометр.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Dynamometer.jpg/640px-Dynamometer.jpg' },
  { id: 'm-300', category: 'Механика', value: 300, question: 'Почему в машине важно пристегиваться ремнем?', answer: 'Из-за инерции при резком торможении.' },
  { id: 'm-400', category: 'Механика', value: 400, question: 'Как меняется сила трения при увеличении силы прижатия?', answer: 'Сила трения увеличивается.' },
  { id: 'm-500', category: 'Механика', value: 500, question: 'Видео-вопрос: определите тип движения тела.', answer: 'Равноускоренное движение.', videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  { id: 't-100', category: 'Термодинамика', value: 100, question: 'Как называется процесс перехода жидкости в пар?', answer: 'Испарение.' },
  { id: 't-200', category: 'Термодинамика', value: 200, question: 'Что происходит с температурой воды во время кипения?', answer: 'Она остается постоянной при одном давлении.' },
  { id: 't-300', category: 'Термодинамика', value: 300, question: 'Аудио-вопрос: какое явление часто вызывает щелчки в батареях?', answer: 'Тепловое расширение и сжатие материалов.', audioUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' },
  { id: 't-400', category: 'Термодинамика', value: 400, question: 'Почему металлическая ложка в горячем чае быстро нагревается?', answer: 'Из-за высокой теплопроводности металла.' },
  { id: 't-500', category: 'Термодинамика', value: 500, question: 'Назовите три вида теплопередачи.', answer: 'Теплопроводность, конвекция, излучение.' },
];

export function ViewerPage({ title, onBack, onUse }: ViewerPageProps) {
  const [showTour, setShowTour] = useState(false);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const categories = Array.from(new Set(SAMPLE_QUESTIONS.map((q) => q.category)));
  const values = Array.from(new Set(SAMPLE_QUESTIONS.map((q) => q.value))).sort((a, b) => a - b);
  const allCompleted = usedIds.length === SAMPLE_QUESTIONS.length;

  const getQuestion = (category: string, value: number) =>
    SAMPLE_QUESTIONS.find((q) => q.category === category && q.value === value);

  function openQuestion(question: QuizQuestion) {
    if (usedIds.includes(question.id)) return;
    setActiveQuestion(question);
    setShowAnswer(false);
  }

  function closeQuestion() {
    if (!activeQuestion) return;
    if (!usedIds.includes(activeQuestion.id)) {
      setUsedIds((prev) => [...prev, activeQuestion.id]);
    }
    setActiveQuestion(null);
    setShowAnswer(false);
  }

  return (
    <div className="u365-studio-full">
      {showTour && <Tour steps={VIEWER_TOUR_STEPS} onClose={() => setShowTour(false)} />}

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '13px 28px', borderBottom: '1px solid #E6E2D8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#6F6E66', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5"/></svg>
            Вернуться к шаблонам
          </button>
          <span style={{ width: '1px', height: '20px', background: '#E6E2D8', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Spectral, serif', fontSize: '18px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button type="button" title="Показать подсказки" onClick={() => setShowTour(true)} style={{ width: '34px', height: '34px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0"/></svg>
          </button>
          <button data-tour="use" type="button" onClick={() => onUse(title)} style={{ height: '34px', padding: '0 16px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>
            Использовать как основу
          </button>
        </div>
      </header>

      <div data-tour="frame" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: 0, background: 'radial-gradient(circle at top, #1f2937, #0b1220 70%)' }}>
        <div style={{ width: '100%', maxWidth: '1200px', height: '100%', borderRadius: '18px', overflow: 'hidden', border: '1px solid #253045', boxShadow: '0 20px 40px rgba(0,0,0,.35)', background: '#091225', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '16px 20px 10px', borderBottom: '1px solid #1d2a41' }}>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '24px', fontFamily: 'Spectral, serif', letterSpacing: '.02em' }}>Шаблон «Викторина»</h2>
            <p style={{ margin: '6px 0 0', color: '#93a4c1', fontSize: '13px' }}>Телевизионный формат для урока: выберите карточку, покажите ответ, закройте вопрос.</p>
          </div>

          {!allCompleted && (
            <div style={{ flex: 1, padding: '18px', display: 'grid', gridTemplateColumns: `repeat(${categories.length}, minmax(170px, 1fr))`, gap: '12px', alignContent: 'start', overflowY: 'auto' }}>
              {categories.map((category) => (
                <div key={category} style={{ display: 'grid', gridTemplateRows: `64px repeat(${values.length}, 1fr)`, gap: '10px', minHeight: 0 }}>
                  <div style={{ borderRadius: '12px', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#f8fafc', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '8px', fontSize: '14px', fontWeight: 700, letterSpacing: '.03em' }}>
                    {category}
                  </div>
                  {values.map((value) => {
                    const q = getQuestion(category, value);
                    if (!q) return <div key={`${category}-${value}`} />;
                    const disabled = usedIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => openQuestion(q)}
                        disabled={disabled}
                        style={{
                          minHeight: '78px',
                          border: '1px solid #29416a',
                          borderRadius: '12px',
                          background: disabled ? '#0f172a' : 'linear-gradient(135deg,#0f2b5b,#1d4ed8)',
                          color: disabled ? '#42567d' : '#facc15',
                          fontSize: '34px',
                          fontWeight: 800,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {allCompleted && (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px', textAlign: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontFamily: 'Spectral, serif', fontSize: '44px' }}>Игра окончена</h3>
                <p style={{ margin: '10px 0 18px', color: '#9fb0cd', fontSize: '16px' }}>Все карточки открыты. Можно сыграть снова или использовать шаблон как основу.</p>
                <button
                  type="button"
                  onClick={() => {
                    setUsedIds([]);
                    setActiveQuestion(null);
                    setShowAnswer(false);
                  }}
                  style={{ height: '44px', padding: '0 20px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Сыграть снова
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeQuestion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 8, 23, .86)', backdropFilter: 'blur(2px)', zIndex: 30, display: 'flex', flexDirection: 'column', padding: '28px' }}>
          <div style={{ flex: 1, borderRadius: '18px', background: 'linear-gradient(160deg,#0b1730,#14294d)', border: '1px solid #27416f', padding: '30px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#93a4c1', fontSize: '14px' }}>{activeQuestion.category} · {activeQuestion.value}</span>
              <span style={{ color: '#facc15', fontSize: '14px', fontWeight: 700 }}>Вопрос открыт</span>
            </div>
            <h3 style={{ margin: '0 0 18px', color: '#f8fafc', fontSize: '40px', lineHeight: 1.2, fontFamily: 'Spectral, serif' }}>{activeQuestion.question}</h3>

            <div style={{ display: 'grid', gap: '12px', maxWidth: '900px' }}>
              {activeQuestion.imageUrl && <img src={activeQuestion.imageUrl} alt="Иллюстрация вопроса" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #345180' }} />}
              {activeQuestion.videoUrl && <video src={activeQuestion.videoUrl} controls style={{ width: '100%', borderRadius: '12px', border: '1px solid #345180' }} />}
              {activeQuestion.audioUrl && <audio src={activeQuestion.audioUrl} controls style={{ width: '100%' }} />}
            </div>

            <div style={{ marginTop: '22px', minHeight: '70px', borderRadius: '12px', border: '1px solid #345180', background: 'rgba(7, 18, 38, .55)', display: 'flex', alignItems: 'center', padding: '16px 18px' }}>
              {showAnswer ? (
                <p style={{ margin: 0, color: '#86efac', fontSize: '28px', lineHeight: 1.25, fontWeight: 700 }}>Ответ: {activeQuestion.answer}</p>
              ) : (
                <p style={{ margin: 0, color: '#93a4c1', fontSize: '18px' }}>Нажмите «Показать ответ», чтобы открыть правильный вариант.</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button type="button" onClick={() => setShowAnswer(true)} style={{ height: '64px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontSize: '22px', fontWeight: 800, cursor: 'pointer' }}>
              Показать ответ
            </button>
            <button type="button" onClick={closeQuestion} style={{ height: '64px', border: 'none', borderRadius: '14px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '22px', fontWeight: 800, cursor: 'pointer' }}>
              Закрыть вопрос
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
