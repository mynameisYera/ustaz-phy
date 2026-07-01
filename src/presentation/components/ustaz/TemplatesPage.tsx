import { useCallback, useEffect, useState } from 'react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import {
  fetchClasses,
  fetchSubjects,
  fetchTopics,
  type CatalogItem,
} from '@/infrastructure/templates/CatalogApi';
import {
  fetchAllTemplates,
  type AllTemplatesFilters,
  type TextTemplate,
} from '@/infrastructure/templates/TemplatesApi';

const TEMPLATES_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="grid"]', icon: 'grid', title: 'Үлгілер каталогы', body: 'Сақталған ойындар осында сақталады. Үлгіні ашу үшін картаны басыңыз.' },
];

interface TemplatesPageProps {
  onBack: () => void;
  onOpen: (template: TextTemplate) => void;
}

type LoadStatus = 'loading' | 'ready' | 'error';

export function TemplatesPage({ onBack, onOpen }: TemplatesPageProps) {
  const [showTour, setShowTour] = useState(false);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [items, setItems] = useState<TextTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<CatalogItem[]>([]);
  const [subjects, setSubjects] = useState<CatalogItem[]>([]);
  const [topics, setTopics] = useState<CatalogItem[]>([]);

  const [classId, setClassId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [topicId, setTopicId] = useState<number | ''>('');
  const [searchQ, setSearchQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(searchQ.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQ]);

  useEffect(() => {
    void fetchClasses()
      .then(({ items }) => setClasses(items))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (classId === '') {
      setSubjects([]);
      setSubjectId('');
      return;
    }
    let cancelled = false;
    void fetchSubjects(classId)
      .then(({ items }) => {
        if (!cancelled) {
          setSubjects(items);
          setSubjectId('');
          setTopicId('');
          setTopics([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubjects([]);
          setSubjectId('');
          setTopicId('');
          setTopics([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (subjectId === '') {
      setTopics([]);
      setTopicId('');
      return;
    }
    let cancelled = false;
    void fetchTopics(subjectId)
      .then(({ items }) => {
        if (!cancelled) {
          setTopics(items);
          setTopicId('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTopics([]);
          setTopicId('');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    const filters: AllTemplatesFilters = {};
    if (classId !== '') filters.classId = classId;
    if (subjectId !== '') filters.subjectId = subjectId;
    if (topicId !== '') filters.topicId = topicId;
    if (debouncedQ) filters.q = debouncedQ;

    try {
      const { items } = await fetchAllTemplates(filters);
      setItems(items);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Үлгілерді жүктеу мүмкін болмады');
      setStatus('error');
    }
  }, [classId, subjectId, topicId, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = classId !== '' || subjectId !== '' || topicId !== '' || debouncedQ !== '';

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      {showTour && <Tour steps={TEMPLATES_TOUR_STEPS} onClose={() => setShowTour(false)} />}
      <UstazHeader
        onLogoClick={onBack}
        onHelp={() => setShowTour(true)}
        helpLabel="Нұсқаулар"
        activePage="templates"
        onNavHome={onBack}
        onNavTemplates={() => {}}
      />

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 40px 80px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '34px', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
          Үлгілер кітапханасы
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 28px' }}>
          Сақталған ойындар сабақта көрсетуге дайын. Үлгіні ашу үшін басыңыз.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '0 0 16px' }}>
          <FilterSelect
            label="Сынып"
            value={classId === '' ? '' : String(classId)}
            onChange={(v) => setClassId(v === '' ? '' : Number(v))}
          >
            <option value="">Сынып</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Пән"
            value={subjectId === '' ? '' : String(subjectId)}
            onChange={(v) => setSubjectId(v === '' ? '' : Number(v))}
            disabled={classId === ''}
          >
            <option value="">Пән</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Тақырып"
            value={topicId === '' ? '' : String(topicId)}
            onChange={(v) => setTopicId(v === '' ? '' : Number(v))}
            disabled={subjectId === ''}
          >
            <option value="">Тақырып</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </FilterSelect>
        </div>

        <div style={{ margin: '0 0 24px' }}>
          <SearchInput value={searchQ} onChange={setSearchQ} />
        </div>

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={error} onRetry={() => void load()} />}
        {status === 'ready' && items.length === 0 && (
          hasFilters ? <NoResultsState onClear={() => { setClassId(''); setSearchQ(''); }} /> : <EmptyState onCreate={onBack} />
        )}
        {status === 'ready' && items.length > 0 && (
          <div data-tour="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {items.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} onOpen={() => onOpen(tpl)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TemplateCard({ template, onOpen }: { template: TextTemplate; onOpen: () => void }) {
  const created = formatDate(template.created_at);
  return (
    <button type="button" className="u365-gallery-card" onClick={onOpen} style={{ textAlign: 'left' }}>
      <div style={{ height: '120px', background: '#EAF1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #E6E2D8' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 4v5" />
        </svg>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <span style={{ fontSize: '18px', lineHeight: '1.3', color: '#1A1A17', fontFamily: 'Spectral, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {template.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontSize: '12px', color: '#6F6E66' }}>
            HTML-үлгі{created ? ` · ${created}` : ''}
          </span>
          <span style={{ fontSize: '13px', color: '#1E6E5C', fontWeight: 600 }}>Ашу →</span>
        </div>
      </div>
    </button>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block', maxWidth: '360px' }}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Атау бойынша іздеу…"
        aria-label="Атау бойынша іздеу"
        maxLength={200}
        style={{
          width: '100%',
          height: '38px',
          padding: '0 16px',
          background: '#FFFFFF',
          border: '1px solid #E6E2D8',
          borderRadius: '19px',
          color: '#1A1A17',
          fontFamily: 'inherit',
          fontSize: '14px',
        }}
      />
    </label>
  );
}

function LoadingState() {
  return (
    <div>
      <div className="u365-bar-progress" style={{ borderRadius: '4px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div className="u365-skeleton-line" style={{ height: '120px', background: '#EEEAE0' }} />
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="u365-skeleton-line-d1" style={{ height: '14px', width: '70%', borderRadius: '4px', background: '#EEEAE0' }} />
              <div className="u365-skeleton-line-d2" style={{ height: '12px', width: '40%', borderRadius: '4px', background: '#EEEAE0' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF', padding: '40px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '16px', color: '#1A1A17' }}>Үлгілерді жүктеу мүмкін болмады</p>
      <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6F6E66' }}>
        {message ?? 'Байланысты тексеріп, қайталаңыз. Сервер «ұйықтап» қалған болуы мүмкін — бірінші сұраныс ұзағырақ болады.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{ height: '36px', padding: '0 18px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
      >
        Қайталау
      </button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '48px 40px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '18px', color: '#1A1A17', fontFamily: 'Spectral, serif' }}>Үлгілер әлі жоқ</p>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6F6E66' }}>
        Студияда ойын жасап, үлгі ретінде сақтаңыз — ол осында пайда болады.
      </p>
      <button
        type="button"
        onClick={onCreate}
        style={{ height: '36px', padding: '0 18px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
      >
        Ойын жасау
      </button>
    </div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '48px 40px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '18px', color: '#1A1A17', fontFamily: 'Spectral, serif' }}>Ештеңе табылмады</p>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6F6E66' }}>
        Сүзгілерді өзгертіп көріңіз немесе іздеуді тазалаңыз.
      </p>
      <button
        type="button"
        onClick={onClear}
        style={{ height: '36px', padding: '0 18px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: '#1A1A17', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
      >
        Сүзгілерді тазалау
      </button>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
        style={{
          height: '38px',
          padding: '0 32px 0 16px',
          background: disabled ? '#F5F4F0' : '#FFFFFF',
          border: '1px solid #E6E2D8',
          borderRadius: '19px',
          color: disabled ? '#A8A69E' : '#1A1A17',
          fontFamily: 'inherit',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
        }}
      >
        {children}
      </select>
      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <ChevronDown />
      </span>
    </label>
  );
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#6F6E66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5 6 7.5 9 4.5"/>
    </svg>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('kk');
}
