import { useState, useRef, type FormEvent } from 'react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import { QuizIcon, CardsIcon, CrosswordIcon, SortIcon, SimIcon } from './icons';

const HOME_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="prompt"]',    icon: 'canvas',   title: 'Опишите игру',         body: 'Введите тему, класс и формат — ассистент сгенерирует интерактивный HTML-файл прямо в браузере.' },
  { target: '[data-tour="attach"]',    icon: 'share',    title: 'Прикрепите материалы', body: 'Загрузите изображения или текстовые файлы — ассистент учтёт их содержимое при создании игры.' },
  { target: '[data-tour="templates"]', icon: 'chat',     title: 'Готовые шаблоны',      body: 'Начните с шаблона: викторина, карточки, кроссворд, сортировка или симулятор.' },
  { target: '[data-tour="library"]',   icon: 'download', title: 'Мои игры',             body: 'Ранее созданные игры хранятся здесь. Нажмите на строку, чтобы открыть игру в студии.' },
];

interface HomePageProps {
  onCreate: (desc: string, files: File[]) => void;
  onTemplates: () => void;
  onBlank: () => void;
}

const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

const TEMPLATE_TYPES = [
  { label: 'Викторина', icon: <QuizIcon /> },
  { label: 'Карточки', icon: <CardsIcon /> },
  { label: 'Кроссворд', icon: <CrosswordIcon /> },
  { label: 'Сортировка', icon: <SortIcon /> },
  { label: 'Симулятор', icon: <SimIcon /> },
];

const GAMES = [
  { name: 'Викторина: сравнение дробей', grade: 5, subject: 'Математика', topic: 'Дроби', modified: '6 часов назад', access: 'Открыт классу', color: '#EAF1ED' },
  { name: 'Исторические даты: карточки', grade: 8, subject: 'История', topic: 'Даты', modified: 'Вчера', access: 'Личный', color: '#F1ECE2' },
  { name: 'Казахский язык: части речи', grade: 6, subject: 'Казахский язык', topic: 'Части речи', modified: '2 дня назад', access: 'Открыт классу', color: '#EDEAF1' },
  { name: 'Симулятор Солнечной системы', grade: 7, subject: 'Естествознание', topic: 'Солнечная система', modified: '5 дней назад', access: 'По ссылке', color: '#EAEFF1' },
];

export function HomePage({ onCreate, onTemplates, onBlank }: HomePageProps) {
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<'games' | 'templates'>('games');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showTour, setShowTour] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim()) onCreate(input.trim(), attachedFiles);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) setAttachedFiles((prev) => [...prev, ...picked]);
    e.target.value = '';
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      {showTour && <Tour steps={HOME_TOUR_STEPS} onClose={() => setShowTour(false)} />}
      <UstazHeader onHelp={() => setShowTour(true)} />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 24px 72px' }}>
        {chips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
            {chips.map((chip) => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 11px', background: '#E4EFEA', color: '#3B5A50', borderRadius: '8px', fontSize: '13px' }}>
                {chip}
              </span>
            ))}
          </div>
        )}

        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '44px', lineHeight: 1.1, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 32px' }}>
          Какую игру создадим сегодня?
        </h1>

        {/* Prompt card */}
        <input ref={fileInputRef} type="file" multiple accept="image/*,text/*,.txt,.csv,.md,.json" style={{ display: 'none' }} onChange={handleFileChange} />
        <form data-tour="prompt" onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '20px 20px 14px' }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите игру для урока — например: викторина с drag-and-drop по теме урока"
            rows={3}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '16px', lineHeight: '1.55', color: '#1A1A17', background: 'transparent' }}
          />
          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {attachedFiles.map((f, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#EAF1ED', border: '1px solid #C8DDD3', borderRadius: '6px', fontSize: '13px', color: '#3B5A50' }}>
                  {f.name}
                  <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1, color: '#6F9E8A', fontSize: '15px' }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <FilterBtn data-tour="attach" onClick={() => fileInputRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9"/></svg>
                {materialLoading ? 'Обработка PDF…' : materialFileName ? materialFileName.slice(0, 18) : 'Добавить материал'}
              </FilterBtn>

              <FieldSelect
                label="Класс"
                value={grade === '' ? '' : String(grade)}
                onChange={(v) => setGrade(v ? Number(v) : '')}
              >
                <option value="">Класс</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g} класс</option>
                ))}
              </FieldSelect>

              <FieldInput
                label="Предмет"
                value={subject}
                onChange={setSubject}
                placeholder="Предмет"
              />

              <FieldInput
                label="Тема урока"
                value={lessonTopic}
                onChange={setLessonTopic}
                placeholder="Тема урока"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="submit" disabled={materialLoading} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', background: materialLoading ? '#A6C8C0' : '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: materialLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3.5M3.5 8 8 3.5 12.5 8"/></svg>
              </button>
            </div>
          </div>
          {(formError || materialError) && (
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#B4533B' }}>
              {formError || materialError}
            </p>
          )}
          {materialText && !materialLoading && (
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#3B5A50' }}>
              Материал загружен — {materialText.length.toLocaleString()} символов для ИИ
            </p>
          )}
        </form>

        <p style={{ textAlign: 'center', color: '#6F6E66', fontSize: '14px', margin: '40px 0 18px' }}>
          Начните с шаблона…
        </p>
        <div data-tour="templates" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {TEMPLATE_TYPES.map((t) => (
            <button key={t.label} type="button" onClick={onTemplates} className="u365-template-card">
              {t.icon}
              <span style={{ fontSize: '13px', color: '#1A1A17' }}>{t.label}</span>
            </button>
          ))}
        </div>
        <p style={{ textAlign: 'center', margin: '18px 0 0' }}>
          <button type="button" onClick={onBlank} style={{ background: 'none', border: 'none', color: '#1E6E5C', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
            …или начните с чистого листа →
          </button>
        </p>
      </main>

      {/* Library */}
      <section data-tour="library" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E6E2D8', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {(['games', 'templates'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{ background: 'none', border: 'none', padding: '0 0 12px', fontFamily: 'inherit', fontSize: '15px', color: tab === t ? '#1A1A17' : '#6F6E66', fontWeight: tab === t ? 500 : 400, borderBottom: tab === t ? '2px solid #1E6E5C' : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px' }}
              >
                {t === 'games' ? 'Мои игры' : 'Шаблоны'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 150px 130px', gap: '16px', padding: '0 14px 10px', fontSize: '12px', color: '#6F6E66' }}>
          <span>Название</span>
          <span>Класс · Предмет</span>
          <span>Изменено</span>
          <span>Доступ</span>
        </div>

        <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
          {GAMES.map((g, i) => (
            <div
              key={g.name}
              className="u365-table-row"
              onClick={() => onCreate(g.name, [])}
              style={{ display: 'grid', gridTemplateColumns: '1fr 200px 150px 130px', gap: '16px', alignItems: 'center', padding: '14px', borderBottom: i < GAMES.length - 1 ? '1px solid #EEEAE0' : 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '64px', height: '42px', borderRadius: '6px', border: '1px solid #E6E2D8', background: g.color, flexShrink: 0 }} />
                <span style={{ fontSize: '14px' }}>{g.name}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#6F6E66' }}>{g.grade} класс · {g.subject}</span>
              <span style={{ fontSize: '13px', color: '#6F6E66' }}>{g.modified}</span>
              <span style={{ fontSize: '13px', color: '#6F6E66' }}>{g.access}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterBtn({ children, onClick, 'data-tour': dataTour }: { children: React.ReactNode; onClick?: () => void; 'data-tour'?: string }) {
  return (
    <button type="button" onClick={onClick} data-tour={dataTour} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', color: '#1A1A17', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}>
      {children}
    </button>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 28px 0 12px',
          background: value ? '#E4EFEA' : '#FFFFFF',
          border: '1px solid #E6E2D8',
          borderRadius: '8px',
          color: '#1A1A17',
          fontFamily: 'inherit',
          fontSize: '13px',
          cursor: 'pointer',
          appearance: 'none',
        }}
      >
        {children}
      </select>
      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <ChevronDown />
      </span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      style={{
        height: '34px',
        width: '130px',
        padding: '0 12px',
        background: value.trim() ? '#E4EFEA' : '#FFFFFF',
        border: '1px solid #E6E2D8',
        borderRadius: '8px',
        color: '#1A1A17',
        fontFamily: 'inherit',
        fontSize: '13px',
      }}
    />
  );
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5 6 7.5 9 4.5"/>
    </svg>
  );
}
