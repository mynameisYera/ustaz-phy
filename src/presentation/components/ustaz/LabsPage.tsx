import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import {
  fetchLabGames,
  fetchLabRoute,
  fetchLabSubjects,
  type LabItem,
  type LabSubject,
} from '@/infrastructure/labs/LabsApi';
import mathAnimation from '@/assets/animations/math.lottie?url';
import physicsAnimation from '@/assets/animations/physics.lottie?url';
import chemistryAnimation from '@/assets/animations/chemistry.lottie?url';

const LABS_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="subjects"]', icon: 'grid', title: 'Пәндер', body: 'Пән бойынша ресурстарды көру үшін карточканы таңдаңыз.' },
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
  const [resourcesSubject, setResourcesSubject] = useState<'math' | 'physics' | 'chemistry' | null>(null);
  const [subjects, setSubjects] = useState<LabSubject[]>([]);

  useEffect(() => {
    void fetchLabSubjects()
      .then((items) => setSubjects(items))
      .catch(() => setSubjects([]));
  }, []);

  if (resourcesSubject) {
    const subject = subjects.find((s) => s.name.toLowerCase() === resourcesSubject) ?? null;
    return (
      <SubjectResourcesPage
        subjectKey={resourcesSubject}
        subject={subject}
        onBack={() => setResourcesSubject(null)}
        onNavHome={onNavHome}
        onNavTemplates={onNavTemplates}
      />
    );
  }

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
        <LabsHero onOpenResources={setResourcesSubject} />
      </main>
    </div>
  );
}

interface SubjectResourcesPageProps {
  subjectKey: 'math' | 'physics' | 'chemistry';
  subject: LabSubject | null;
  onBack: () => void;
  onNavHome: () => void;
  onNavTemplates: () => void;
}

function SubjectResourcesPage({ subjectKey, subject, onBack, onNavHome, onNavTemplates }: SubjectResourcesPageProps) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const load = () => {
    if (!subject) {
      setStatus('error');
      setError('Пән табылмады');
      return;
    }
    setStatus('loading');
    setError(null);
    void fetchLabGames(subject.subjectId)
      .then(({ items }) => {
        setLabs(items);
        setStatus('ready');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Зертханаларды жүктеу мүмкін болмады');
        setStatus('error');
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.subjectId]);

  const handleOpen = async () => {
    if (!subject) return;
    setOpeningId(subject.subjectId);
    setOpenError(null);
    try {
      const { route } = await fetchLabRoute(subject.subjectId);
      window.open(route, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : 'Зертхананы ашу мүмкін болмады');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      <UstazHeader
        onLogoClick={onBack}
        activePage="labs"
        onNavHome={onNavHome}
        onNavTemplates={onNavTemplates}
        onNavLabs={onBack}
      />

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 40px 80px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px', marginBottom: '20px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', color: '#1A1A17', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}
        >
          ← Зертханалар
        </button>

        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '30px', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
          {subjectLabel(subjectKey)} · Ресурстар
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 28px' }}>
          Осы пән бойынша интерактивті зертханаларды таңдап, сабақта көрсетіңіз.
        </p>

        {openError && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', border: '1px solid #E6C2BE', borderRadius: '8px', background: '#FCF2F0', color: '#8A3B33', fontSize: '13px' }}>
            {openError}
          </div>
        )}

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={error} onRetry={load} />}
        {status === 'ready' && labs.length === 0 && <NoLabsState />}
        {status === 'ready' && labs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {labs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                opening={openingId === subject?.subjectId}
                onOpen={() => void handleOpen()}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const SUBJECT_LESSONS: {
  key: 'math' | 'physics' | 'chemistry';
  eyebrow: string;
  title: string;
  description: string;
  animation: string;
  caption: string;
}[] = [
  {
    key: 'physics',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Физиканы интерактивті ету',
    description: 'Физикалық құбылыстарды зерттеу зертханаларын қолданып, теманы тәжірибе арқылы түсіндіріңіз.',
    animation: physicsAnimation,
    caption: 'Физика зертханаларын зерттеу',
  },
  {
    key: 'math',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Математиканы интерактивті ету',
    description: 'Зерттеу тапсырмалары арқылы негізгі математикалық ұғымдарды ашыңыз, содан кейін жаттығулармен бекітіңіз.',
    animation: mathAnimation,
    caption: 'Пифагор теоремасын зерттеу',
  },
  {
    key: 'chemistry',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Химияны интерактивті ету',
    description: 'Химиялық реакциялар мен процестерді виртуалды зертханада қауіпсіз әрі көрнекі түрде көрсетіңіз.',
    animation: chemistryAnimation,
    caption: 'Химия зертханаларын зерттеу',
  },
];

function LabsHero({ onOpenResources }: { onOpenResources: (subject: 'math' | 'physics' | 'chemistry') => void }) {
  const handleOpen = (key: 'math' | 'physics' | 'chemistry') => {
    if (key === 'physics') {
      window.location.assign('/physics');
      return;
    }
    onOpenResources(key);
  };

  return (
    <div data-tour="subjects" style={{ display: 'flex', flexDirection: 'column', gap: '28px', margin: '0 0 36px' }}>
      {SUBJECT_LESSONS.map((lesson) => (
        <SubjectLessonBlock key={lesson.key} lesson={lesson} onOpen={() => handleOpen(lesson.key)} />
      ))}
    </div>
  );
}

function SubjectLessonBlock({ lesson, onOpen }: { lesson: (typeof SUBJECT_LESSONS)[number]; onOpen: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '40px',
        flexWrap: 'wrap',
        border: '1px solid #E6E2D8',
        borderRadius: '16px',
        background: '#FFFFFF',
        padding: '36px',
      }}
    >
      <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '260px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#1E6E5C', textTransform: 'uppercase', margin: '0 0 10px' }}>
          {lesson.eyebrow}
        </span>
        <h2 style={{ fontFamily: 'Spectral, serif', fontWeight: 600, fontSize: '30px', letterSpacing: '-0.01em', margin: '0 0 12px', lineHeight: 1.15 }}>
          {lesson.title}
        </h2>
        <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 24px', maxWidth: '420px' }}>
          {lesson.description}
        </p>
        <div>
          <button
            type="button"
            onClick={onOpen}
            style={{
              height: '44px',
              padding: '0 22px',
              border: 'none',
              borderRadius: '8px',
              background: '#1E6E5C',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Ресурстарды көру →
          </button>
        </div>
      </div>

      <div style={{ flex: '1 1 340px', minWidth: '280px', maxWidth: '460px' }}>
        <div
          style={{
            border: '1px solid #E6E2D8',
            borderRadius: '12px',
            background: '#FBFAF6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '18px',
          }}
        >
          <div style={{ width: '100%', height: '180px' }}>
            <DotLottieReact src={lesson.animation} loop autoplay style={{ width: '100%', height: '100%' }} />
          </div>
          <span style={{ fontSize: '13px', color: '#6F6E66', textAlign: 'center' }}>
            {lesson.caption}
          </span>
        </div>
      </div>
    </div>
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
