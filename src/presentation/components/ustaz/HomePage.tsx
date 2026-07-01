import { useState, useRef, type FormEvent } from 'react';
import type { CreateGameInput, OutputFormat } from '@/domain/entities/GameContext';
import { extractPdfMaterial } from '@/infrastructure/pdf/extractPdfMaterial';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';

const HOME_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="prompt"]', icon: 'canvas', title: 'Ойынды сипаттаңыз',  body: 'Тақырыпты, сыныпты және форматты енгізіңіз — көмекші браузерде интерактивті HTML-файл жасайды.' },
  { target: '[data-tour="attach"]', icon: 'share',  title: 'PDF тіркеңіз',       body: 'Оқулық материалды PDF-пен жүктеңіз — сканерленген болса да. Мәтін шығарылып, ойын жасауда пайдаланылады.' },
];

interface HomePageProps {
  onCreate: (input: CreateGameInput) => void;
  onNavTemplates: () => void;
}

const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

export function HomePage({ onCreate, onNavTemplates }: HomePageProps) {
  const [input, setInput] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [subject, setSubject] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialText, setMaterialText] = useState<string | undefined>();
  const [materialLoading, setMaterialLoading] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('html');
  const [showTour, setShowTour] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || materialLoading) return;
    if (grade === '' || !subject.trim() || !lessonTopic.trim()) return;

    onCreate({
      grade,
      subject: subject.trim(),
      lessonTopic: lessonTopic.trim(),
      description: input.trim(),
      materialText,
      outputFormat,
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setMaterialFile(file);
    setMaterialText(undefined);
    setMaterialError(null);
    setMaterialLoading(true);

    try {
      const text = await extractPdfMaterial(file);
      setMaterialText(text);
    } catch (err) {
      setMaterialFile(null);
      setMaterialError(err instanceof Error ? err.message : 'Не удалось прочитать PDF');
    } finally {
      setMaterialLoading(false);
    }
  }

  function removeMaterial() {
    setMaterialFile(null);
    setMaterialText(undefined);
    setMaterialError(null);
  }

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      {showTour && <Tour steps={HOME_TOUR_STEPS} onClose={() => setShowTour(false)} />}
      <UstazHeader
        onHelp={() => setShowTour(true)}
        activePage="home"
        onNavHome={() => {}}
        onNavTemplates={onNavTemplates}
      />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 24px 80px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '44px', lineHeight: 1.1, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 32px' }}>
          Бүгін қандай ойын жасаймыз?
        </h1>

        <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
        <form data-tour="prompt" onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', padding: '20px 20px 14px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сабақ үшін ойынды сипаттаңыз — мысалы: drag-and-drop арқылы тақырып бойынша викторина"
            rows={3}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '16px', lineHeight: '1.55', color: '#1A1A17', background: 'transparent' }}
          />

          {materialFile && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#EAF1ED', border: '1px solid #C8DDD3', borderRadius: '6px', fontSize: '13px', color: '#3B5A50' }}>
                {materialLoading ? 'PDF өңделуде…' : materialFile.name}
                {!materialLoading && (
                  <button type="button" onClick={removeMaterial} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1, color: '#6F9E8A', fontSize: '15px' }}>×</button>
                )}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <FilterBtn data-tour="attach" onClick={() => !materialLoading && fileInputRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round"><path d="M7 2.5v9M2.5 7h9"/></svg>
                {materialLoading ? 'PDF өңделуде…' : materialFile ? 'PDF ауыстыру' : 'PDF қосу'}
              </FilterBtn>

              <FieldSelect
                value={grade === '' ? '' : String(grade)}
                onChange={(v) => setGrade(v ? Number(v) : '')}
              >
                <option value="">Сынып</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g} сынып</option>
                ))}
              </FieldSelect>

              <FieldInput
                label="Пән"
                value={subject}
                onChange={setSubject}
                placeholder="Пән"
              />

              <FieldInput
                label="Сабақ тақырыбы"
                value={lessonTopic}
                onChange={setLessonTopic}
                placeholder="Сабақ тақырыбы"
              />

              <FormatToggle value={outputFormat} onChange={setOutputFormat} />
            </div>

            <button
              type="submit"
              disabled={materialLoading}
              style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', background: materialLoading ? '#A6C8C0' : '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: materialLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3.5M3.5 8 8 3.5 12.5 8"/></svg>
            </button>
          </div>

          {materialError && (
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#B4533B' }}>{materialError}</p>
          )}
          {materialText && !materialLoading && (
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#3B5A50' }}>
              PDF материалы жүктелді — ЖИ үшін {materialText.length.toLocaleString()} таңба
            </p>
          )}
        </form>
      </main>
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

function FormatToggle({ value, onChange }: { value: OutputFormat; onChange: (value: OutputFormat) => void }) {
  const options: { id: OutputFormat; label: string }[] = [
    { id: 'html', label: 'HTML' },
    { id: 'react', label: 'React' },
  ];
  return (
    <div role="group" aria-label="Формат" style={{ display: 'inline-flex', height: '34px', border: '1px solid #E6E2D8', borderRadius: '8px', overflow: 'hidden' }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              height: '100%',
              padding: '0 14px',
              border: 'none',
              background: active ? '#1E6E5C' : '#FFFFFF',
              color: active ? '#FFFFFF' : '#6F6E66',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: active ? 500 : 400,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FieldSelect({
  value,
  onChange,
  children,
}: {
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
          color: value ? '#1A1A17' : '#A6A498',
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
    </label>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
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
