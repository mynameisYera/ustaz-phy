import { useCallback, useEffect, useState } from 'react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import { listTemplates, type TextTemplate } from '@/infrastructure/templates/TemplatesApi';
import { SUBJECTS, GRADES } from '@/domain/entities/Subjects';

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

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const { items } = await listTemplates();
      setItems(items);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Үлгілерді жүктеу мүмкін болмады');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '0 0 24px' }}>
          <FilterSelect label="Пән">
            <option value="">Пән</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Сынып">
            <option value="">Сынып</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g} сынып</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Ойын түрі">
            <option value="">Ойын түрі</option>
          </FilterSelect>
        </div>

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={error} onRetry={() => void load()} />}
        {status === 'ready' && items.length === 0 && <EmptyState onCreate={onBack} />}
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

function FilterSelect({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        defaultValue=""
        aria-label={label}
        style={{
          height: '38px',
          padding: '0 32px 0 16px',
          background: '#FFFFFF',
          border: '1px solid #E6E2D8',
          borderRadius: '19px',
          color: '#1A1A17',
          fontFamily: 'inherit',
          fontSize: '14px',
          cursor: 'pointer',
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
