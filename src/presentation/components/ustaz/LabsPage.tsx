import { useEffect, useState } from 'react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import {
  fetchLabGames,
  fetchLabRoute,
  fetchLabSubjects,
  type LabItem,
  type LabSubject,
} from '@/infrastructure/labs/LabsApi';

const LABS_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="subjects"]', icon: 'grid', title: 'Пәндер', body: 'Пәнді таңдаңыз, содан кейін сол пәнге қатысты зертханаларды көресіз.' },
];

interface LabsPageProps {
  onBack: () => void;
  onNavHome: () => void;
  onNavTemplates: () => void;
}

type LoadStatus = 'loading' | 'ready' | 'error';

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  physics: 'Физика',
  chemistry: 'Химия',
};

function subjectLabel(name: string): string {
  return SUBJECT_LABELS[name.toLowerCase()] ?? name;
}

export function LabsPage({ onBack, onNavHome, onNavTemplates }: LabsPageProps) {
  const [showTour, setShowTour] = useState(false);

  const [subjectsStatus, setSubjectsStatus] = useState<LoadStatus>('loading');
  const [subjects, setSubjects] = useState<LabSubject[]>([]);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<LabSubject | null>(null);

  const [labsStatus, setLabsStatus] = useState<LoadStatus>('loading');
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [labsError, setLabsError] = useState<string | null>(null);

  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const loadSubjects = () => {
    setSubjectsStatus('loading');
    setSubjectsError(null);
    void fetchLabSubjects()
      .then((items) => {
        setSubjects(items);
        setSubjectsStatus('ready');
        setActiveSubject((prev) => prev ?? items[0] ?? null);
      })
      .catch((e) => {
        setSubjectsError(e instanceof Error ? e.message : 'Пәндерді жүктеу мүмкін болмады');
        setSubjectsStatus('error');
      });
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadLabs = (subjectId: number) => {
    setLabsStatus('loading');
    setLabsError(null);
    void fetchLabGames(subjectId)
      .then(({ items }) => {
        setLabs(items);
        setLabsStatus('ready');
      })
      .catch((e) => {
        setLabsError(e instanceof Error ? e.message : 'Зертханаларды жүктеу мүмкін болмады');
        setLabsStatus('error');
      });
  };

  useEffect(() => {
    if (!activeSubject) {
      setLabs([]);
      return;
    }
    loadLabs(activeSubject.subjectId);
  }, [activeSubject]);

  const handleOpenLab = async (subjectId: number) => {
    setOpeningId(subjectId);
    setOpenError(null);
    try {
      const { route } = await fetchLabRoute(subjectId);
      window.open(route, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : 'Зертхананы ашу мүмкін болмады');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      {showTour && <Tour steps={LABS_TOUR_STEPS} onClose={() => setShowTour(false)} />}
      <UstazHeader
        onLogoClick={onBack}
        onHelp={() => setShowTour(true)}
        helpLabel="Нұсқаулар"
        activePage="labs"
        onNavHome={onNavHome}
        onNavTemplates={onNavTemplates}
        onNavLabs={() => {}}
      />

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 40px 80px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '34px', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
          Зертханалар
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 28px' }}>
          Пән бойынша интерактивті зертханаларды таңдап, сабақта көрсетіңіз.
        </p>

        {subjectsStatus === 'loading' && <SubjectsSkeleton />}
        {subjectsStatus === 'error' && (
          <ErrorState message={subjectsError} onRetry={loadSubjects} />
        )}

        {subjectsStatus === 'ready' && subjects.length === 0 && (
          <EmptySubjectsState />
        )}

        {subjectsStatus === 'ready' && subjects.length > 0 && (
          <>
            <div data-tour="subjects" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '0 0 24px' }}>
              {subjects.map((s) => (
                <SubjectTab
                  key={s.subjectId}
                  label={subjectLabel(s.name)}
                  active={activeSubject?.subjectId === s.subjectId}
                  onClick={() => setActiveSubject(s)}
                />
              ))}
            </div>

            {openError && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', border: '1px solid #E6C2BE', borderRadius: '8px', background: '#FCF2F0', color: '#8A3B33', fontSize: '13px' }}>
                {openError}
              </div>
            )}

            {labsStatus === 'loading' && <LoadingState />}
            {labsStatus === 'error' && (
              <ErrorState message={labsError} onRetry={() => activeSubject && loadLabs(activeSubject.subjectId)} />
            )}
            {labsStatus === 'ready' && labs.length === 0 && <NoLabsState />}
            {labsStatus === 'ready' && labs.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {labs.map((lab) => (
                  <LabCard
                    key={lab.id}
                    lab={lab}
                    opening={openingId === activeSubject?.subjectId}
                    onOpen={() => activeSubject && void handleOpenLab(activeSubject.subjectId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SubjectTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: '38px',
        padding: '0 18px',
        borderRadius: '19px',
        border: active ? '1px solid #1E6E5C' : '1px solid #E6E2D8',
        background: active ? '#1E6E5C' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#1A1A17',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function LabCard({ lab, opening, onOpen }: { lab: LabItem; opening: boolean; onOpen: () => void }) {
  const created = formatDate(lab.created_at);
  return (
    <button type="button" className="u365-gallery-card" onClick={onOpen} disabled={opening} style={{ textAlign: 'left', opacity: opening ? 0.7 : 1 }}>
      <div style={{ height: '120px', background: '#EAF1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #E6E2D8' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6M10 3v5.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.5V3" />
          <path d="M6.5 15h11" />
        </svg>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <span style={{ fontSize: '18px', lineHeight: '1.3', color: '#1A1A17', fontFamily: 'Spectral, serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lab.name}
        </span>
        <span style={{ fontSize: '13px', color: '#6F6E66', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lab.content}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontSize: '12px', color: '#6F6E66' }}>
            Зертхана{created ? ` · ${created}` : ''}
          </span>
          <span style={{ fontSize: '13px', color: '#1E6E5C', fontWeight: 600 }}>
            {opening ? 'Ашылуда…' : 'Ашу →'}
          </span>
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

function SubjectsSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="u365-skeleton-line" style={{ height: '38px', width: '110px', borderRadius: '19px', background: '#EEEAE0' }} />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div style={{ border: '1px solid #E6E2D8', borderRadius: '12px', background: '#FFFFFF', padding: '40px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '16px', color: '#1A1A17' }}>Жүктеу мүмкін болмады</p>
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

function EmptySubjectsState() {
  return (
    <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '48px 40px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '18px', color: '#1A1A17', fontFamily: 'Spectral, serif' }}>Пәндер әлі жоқ</p>
      <p style={{ margin: 0, fontSize: '14px', color: '#6F6E66' }}>
        Зертханалар пайда болғанда осында көрінеді.
      </p>
    </div>
  );
}

function NoLabsState() {
  return (
    <div style={{ border: '1px dashed #D8D3C6', borderRadius: '12px', background: '#FBFAF6', padding: '48px 40px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: '18px', color: '#1A1A17', fontFamily: 'Spectral, serif' }}>Бұл пән бойынша зертханалар жоқ</p>
      <p style={{ margin: 0, fontSize: '14px', color: '#6F6E66' }}>
        Басқа пәнді таңдап көріңіз.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('kk');
}
