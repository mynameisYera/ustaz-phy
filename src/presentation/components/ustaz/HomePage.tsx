import { useEffect, useState, useRef, type FormEvent } from 'react';
import type { CreateGameInput, OutputFormat } from '@/domain/entities/GameContext';
import { formatLessonChips } from '@/domain/entities/GameContext';
import type { Game, GameId } from '@/domain/entities/Game';
import { SUBJECTS, GRADES } from '@/domain/entities/Subjects';
import { extractPdfMaterial } from '@/infrastructure/pdf/extractPdfMaterial';
// TODO: re-enable once GET /api/simulators exists on the backend.
// import { fetchSimulators, type SimulatorListItem } from '@/infrastructure/simulators/SimulatorsApi';
import { useServices } from '../../context/ServicesContext';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import type { SimulatorId } from './UstazApp';

// TODO: re-enable once GET /api/simulators exists on the backend.
// const SIMULATOR_ICONS: Record<string, ReactNode> = {
//   energy: <path d="M4 20h16M6 20V10M12 20V4M18 20v-7" />,
//   buoyancy: <path d="M3 15c1.5 1.5 3 1.5 4.5 0S10.5 13.5 12 15s3 1.5 4.5 0S19.5 13.5 21 15M6 11l6-7 6 7" />,
//   circuit: <path d="M3 12h4l2-5 4 10 2-5h6" />,
//   lens: <><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
// };
//
// const DEFAULT_SIMULATOR_ICON = <circle cx="12" cy="12" r="8" />;
//
// function isSimulatorId(id: string): id is SimulatorId {
//   return id === 'energy' || id === 'buoyancy' || id === 'circuit' || id === 'lens';
// }

const HOME_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="prompt"]', icon: 'canvas', title: 'Ойынды сипаттаңыз',  body: 'Тақырыпты, сыныпты және форматты енгізіңіз — көмекші браузерде интерактивті HTML-файл жасайды.' },
  { target: '[data-tour="attach"]', icon: 'share',  title: 'PDF тіркеңіз',       body: 'Оқулық материалды PDF-пен жүктеңіз — сканерленген болса да. Мәтін шығарылып, ойын жасауда пайдаланылады.' },
  { target: '[data-tour="library"]', icon: 'grid',  title: 'Соңғы ойындар',      body: 'Осында бұрын жасалған ойындарыңыз сақталады — қайта ашу үшін жолды басыңыз.' },
];

interface HomePageProps {
  onCreate: (input: CreateGameInput) => void;
  onOpenGame: (gameId: GameId) => void;
  onNavTemplates: () => void;
  onOpenSimulator: (sim: SimulatorId) => void;
  onOpenJeopardy: () => void;
}

export function HomePage({ onCreate, onOpenGame, onNavTemplates, onOpenJeopardy }: HomePageProps) {
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

  const { listRecentGames } = useServices();
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // TODO: re-enable once GET /api/simulators exists on the backend.
  // const [simulators, setSimulators] = useState<SimulatorListItem[]>([]);
  // const [simulatorsLoading, setSimulatorsLoading] = useState(true);
  // const [simulatorsError, setSimulatorsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const games = await listRecentGames.execute();
      if (!cancelled) {
        setRecentGames(games);
        setGamesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listRecentGames]);

  // TODO: re-enable once GET /api/simulators exists on the backend.
  // useEffect(() => {
  //   let cancelled = false;
  //   void (async () => {
  //     setSimulatorsLoading(true);
  //     setSimulatorsError(null);
  //     try {
  //       const { items } = await fetchSimulators();
  //       if (!cancelled) setSimulators(items);
  //     } catch (err) {
  //       if (!cancelled) {
  //         setSimulatorsError(err instanceof Error ? err.message : 'Симуляторлар тізімін жүктеу мүмкін болмады');
  //       }
  //     } finally {
  //       if (!cancelled) setSimulatorsLoading(false);
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, []);

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
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

            <FieldSelect value={subject} onChange={setSubject}>
              <option value="">Пән</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FieldSelect>

            <FieldInput
              label="Сабақ тақырыбы"
              value={lessonTopic}
              onChange={setLessonTopic}
              placeholder="Сабақ тақырыбы"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '10px' }}>
            <FormatToggle value={outputFormat} onChange={setOutputFormat} />

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

      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', borderBottom: '1px solid #E6E2D8', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '20px', margin: 0, color: '#1A1A17' }}>Ойындар</h2>
          <span style={{ fontSize: '13px', color: '#6F6E66' }}>сыныпта өткізуге дайын</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          <button
            type="button"
            onClick={onOpenJeopardy}
            className="u365-template-card"
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              textAlign: 'left',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', border: '1px solid #C8DDD3', background: '#EAF1ED', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" /><path d="M16.75 13.6v6.3M13.6 16.75h6.3" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', color: '#1A1A17', fontWeight: 500 }}>Өз ойының</div>
              <div style={{ fontSize: '13px', color: '#6F6E66' }}>Викторина · командалық ойын</div>
            </div>
          </button>
        </div>
      </section>

      {/* TODO: re-enable once GET /api/simulators exists on the backend.
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', borderBottom: '1px solid #E6E2D8', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '20px', margin: 0, color: '#1A1A17' }}>Симуляторлар</h2>
          <span style={{ fontSize: '13px', color: '#6F6E66' }}>интерактивті тәжірибелер</span>
        </div>

        {simulatorsLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF' }}>
                <div className="u365-skeleton-line" style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#EEEAE0' }} />
                <div className="u365-skeleton-line-d1" style={{ height: '14px', width: '60%', borderRadius: '4px', background: '#EEEAE0' }} />
              </div>
            ))}
          </div>
        )}

        {!simulatorsLoading && simulatorsError && (
          <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '32px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#6F6E66' }}>{simulatorsError}</p>
          </div>
        )}

        {!simulatorsLoading && !simulatorsError && simulators.length === 0 && (
          <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '32px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6F6E66' }}>Әзірше симуляторлар жоқ.</p>
          </div>
        )}

        {!simulatorsLoading && !simulatorsError && simulators.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {simulators.filter((sim) => isSimulatorId(sim.id)).map((sim) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => onOpenSimulator(sim.id as SimulatorId)}
                className="u365-template-card"
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', border: '1px solid #C8DDD3', background: '#EAF1ED', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {SIMULATOR_ICONS[sim.icon] ?? DEFAULT_SIMULATOR_ICON}
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: '#1A1A17', fontWeight: 500 }}>{sim.title}</div>
                  <div style={{ fontSize: '13px', color: '#6F6E66' }}>{sim.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      */}

      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div data-tour="library" style={{ display: 'flex', alignItems: 'baseline', gap: '12px', borderBottom: '1px solid #E6E2D8', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '20px', margin: 0, color: '#1A1A17' }}>Менің ойындарым</h2>
          <span style={{ fontSize: '13px', color: '#6F6E66' }}>соңғылар</span>
        </div>

        {gamesLoading && (
          <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderBottom: i < 2 ? '1px solid #EEEAE0' : 'none' }}>
                <div className="u365-skeleton-line" style={{ width: '64px', height: '42px', borderRadius: '6px', background: '#EEEAE0' }} />
                <div className="u365-skeleton-line-d1" style={{ height: '14px', width: '40%', borderRadius: '4px', background: '#EEEAE0' }} />
              </div>
            ))}
          </div>
        )}

        {!gamesLoading && recentGames.length === 0 && (
          <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '32px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6F6E66' }}>Әзірше ойындар жоқ — жоғарыда біреуін жасаңыз.</p>
          </div>
        )}

        {!gamesLoading && recentGames.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 150px', gap: '16px', padding: '0 14px 10px', fontSize: '12px', color: '#6F6E66' }}>
              <span>Атауы</span><span>Сынып · Пән</span><span>Өзгертілді</span>
            </div>
            <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
              {recentGames.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onOpenGame(g.id)}
                  className="u365-table-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 220px 150px',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '14px',
                    borderBottom: i < recentGames.length - 1 ? '1px solid #EEEAE0' : 'none',
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{ width: '64px', height: '42px', borderRadius: '6px', border: '1px solid #E6E2D8', background: '#EAF1ED', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#1A1A17', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {g.description || 'Атаусыз ойын'}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#6F6E66' }}>
                    {formatLessonChips({ grade: g.context.grade, subject: g.context.subject, lessonTopic: g.context.lessonTopic }).slice(0, 2).join(' · ')}
                  </span>
                  <span style={{ fontSize: '13px', color: '#6F6E66' }}>{formatRelativeTime(g.updatedAt)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'дәл қазір';
  if (diffMin < 60) return `${diffMin} мин бұрын`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} сағат бұрын`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'кеше';
  if (diffDays < 7) return `${diffDays} күн бұрын`;

  return date.toLocaleDateString('kk');
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
        className="u365-field-select"
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
