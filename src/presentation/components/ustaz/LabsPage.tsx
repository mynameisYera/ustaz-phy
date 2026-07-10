import { useEffect, useState, type CSSProperties } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import { openSubjectLab, type LabSubjectKey } from '@/domain/labs/subjectRoutes';
import { fetchLabSubjects } from '@/infrastructure/labs/LabsApi';
import mathAnimation from '@/assets/animations/math.lottie?url';
import physicsAnimation from '@/assets/animations/physics.lottie?url';
import chemistryAnimation from '@/assets/animations/chemistry.lottie?url';
import biologyAnimation from '@/assets/animations/biology.lottie?url';
import geographyAnimation from '@/assets/animations/geography.lottie?url';
import worldhistoryAnimation from '@/assets/animations/worldhistory.lottie?url';
import kzhistoryAnimation from '@/assets/animations/kzhistory.lottie?url';

const LABS_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="subjects"]', icon: 'grid', title: 'Пәндер', body: 'Пән бойынша ресурстарды көру үшін карточканы таңдаңыз.' },
];

interface LabsPageProps {
  onBack: () => void;
  onNavHome: () => void;
  onNavTemplates: () => void;
}

type SubjectLesson = {
  key: LabSubjectKey;
  eyebrow: string;
  title: string;
  description: string;
  animation: string;
  caption: string;
  accent: string;
  accentSoft: string;
  doodles: { text: string; top: string; left?: string; right?: string; size?: string; rotate?: string }[];
};

const SUBJECT_LESSONS: SubjectLesson[] = [
  {
    key: 'physics',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Физиканы интерактивті ету',
    description: 'Физикалық құбылыстарды зерттеу зертханаларын қолданып, теманы тәжірибе арқылы түсіндіріңіз.',
    animation: physicsAnimation,
    caption: 'Физика зертханаларын зерттеу',
    accent: '#1E6E5C',
    accentSoft: '#E4F2ED',
    doodles: [
      { text: 'E = mc²', top: '10%', left: '4%', size: '15px', rotate: '-6deg' },
      { text: '⚛', top: '65%', left: '8%', size: '30px', rotate: '10deg' },
      { text: 'F = ma', top: '18%', right: '6%', size: '13px', rotate: '4deg' },
      { text: '⚡', top: '72%', right: '10%', size: '24px', rotate: '-8deg' },
    ],
  },
  {
    key: 'math',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Математиканы интерактивті ету',
    description: 'Зерттеу тапсырмалары арқылы негізгі математикалық ұғымдарды ашыңыз, содан кейін жаттығулармен бекітіңіз.',
    animation: mathAnimation,
    caption: 'Математика зертханаларын зерттеу',
    accent: '#1E3A8A',
    accentSoft: '#E4E9F7',
    doodles: [
      { text: 'a² + b² = c²', top: '12%', left: '4%', size: '14px', rotate: '-4deg' },
      { text: 'π', top: '68%', left: '10%', size: '34px', rotate: '8deg' },
      { text: '∑', top: '20%', right: '8%', size: '28px', rotate: '-10deg' },
      { text: '∫f(x)dx', top: '74%', right: '6%', size: '13px', rotate: '5deg' },
    ],
  },
  {
    key: 'chemistry',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Химияны интерактивті ету',
    description: 'Химиялық реакциялар мен процестерді виртуалды зертханада қауіпсіз әрі көрнекі түрде көрсетіңіз.',
    animation: chemistryAnimation,
    caption: 'Химия зертханаларын зерттеу',
    accent: '#6D28A6',
    accentSoft: '#F1E9F9',
    doodles: [
      { text: 'H₂O', top: '10%', left: '5%', size: '15px', rotate: '-5deg' },
      { text: '⚗', top: '66%', left: '9%', size: '30px', rotate: '9deg' },
      { text: 'NaCl', top: '20%', right: '7%', size: '13px', rotate: '6deg' },
      { text: '🧪', top: '72%', right: '9%', size: '24px', rotate: '-7deg' },
    ],
  },
  {
    key: 'biology',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Биологияны интерактивті ету',
    description: 'Биологиялық құбылыстарды зерттеу зертханаларын қолданып, теманы тәжірибе арқылы түсіндіріңіз.',
    animation: biologyAnimation,
    caption: 'Биология зертханаларын зерттеу',
    accent: '#1E7A4C',
    accentSoft: '#E4F3EA',
    doodles: [
      { text: 'DNA', top: '11%', left: '4%', size: '14px', rotate: '-5deg' },
      { text: '🧬', top: '65%', left: '8%', size: '30px', rotate: '10deg' },
      { text: '2n = 46', top: '19%', right: '6%', size: '13px', rotate: '5deg' },
      { text: '🍃', top: '73%', right: '9%', size: '26px', rotate: '-8deg' },
    ],
  },
  {
    key: 'kzhistory',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Қазақстан тарихын интерактивті ету',
    description: 'Қазақстан тарихын зерттеу зертханаларын қолданып, теманы тәжірибе арқылы түсіндіріңіз.',
    animation: kzhistoryAnimation,
    caption: 'Қазақстан тарихы зертханаларын зерттеу',
    accent: '#9A3B12',
    accentSoft: '#F8E9DE',
    doodles: [
      { text: 'VIII ғ.', top: '11%', left: '5%', size: '14px', rotate: '-4deg' },
      { text: '🏛', top: '66%', left: '9%', size: '30px', rotate: '8deg' },
      { text: '1465', top: '19%', right: '7%', size: '13px', rotate: '5deg' },
      { text: '🐎', top: '72%', right: '8%', size: '26px', rotate: '-7deg' },
    ],
  },
  {
    key: 'worldhistory',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Дүниежүзі тарихын интерактивті ету',
    description: 'Дүниежүзі тарихын зерттеу зертханаларын қолданып, теманы тәжірибе арқылы түсіндіріңіз.',
    animation: worldhistoryAnimation,
    caption: 'Дүниежүзі тарихы зертханаларын зерттеу',
    accent: '#1F5FA8',
    accentSoft: '#E6EFF9',
    doodles: [
      { text: '1789', top: '11%', left: '5%', size: '14px', rotate: '-5deg' },
      { text: '🏺', top: '65%', left: '9%', size: '29px', rotate: '9deg' },
      { text: '476', top: '19%', right: '6%', size: '13px', rotate: '4deg' },
      { text: '⚔', top: '72%', right: '9%', size: '25px', rotate: '-8deg' },
    ],
  },
  {
    key: 'geography',
    eyebrow: 'Мұғалімдер мен оқушыларға',
    title: 'Географияны интерактивті ету',
    description: 'Географиялық құбылыстарды зерттеу зертханаларын қолданып, теманы тәжірибе арқылы түсіндіріңіз.',
    animation: geographyAnimation,
    caption: 'География зертханаларын зерттеу',
    accent: '#B0361F',
    accentSoft: '#FAEAE6',
    doodles: [
      { text: 'N 43°', top: '11%', left: '5%', size: '14px', rotate: '-4deg' },
      { text: '🌍', top: '65%', left: '9%', size: '30px', rotate: '8deg' },
      { text: 'R⊕ ≈ 6371 км', top: '19%', right: '6%', size: '12px', rotate: '5deg' },
      { text: '🧭', top: '72%', right: '9%', size: '26px', rotate: '-9deg' },
    ],
  },
];

type LoadStatus = 'loading' | 'ready' | 'error';

const LESSON_BY_KEY = new Map<LabSubjectKey, SubjectLesson>(SUBJECT_LESSONS.map((l) => [l.key, l]));

const PAGE_DOODLES: { text: string; top: string; left?: string; right?: string }[] = [
  { text: 'E = mc²', top: '6%', left: '3%' },
  { text: 'a² + b² = c²', top: '16%', right: '4%' },
  { text: '⚛', top: '28%', left: '90%' },
  { text: 'H₂O', top: '38%', left: '2%' },
  { text: '∫f(x)dx', top: '48%', right: '3%' },
  { text: '🧬', top: '58%', left: '92%' },
  { text: 'π ≈ 3.14159', top: '68%', left: '4%' },
  { text: '🌍', top: '78%', right: '5%' },
  { text: 'F = ma', top: '88%', left: '88%' },
  { text: '∑', top: '95%', left: '6%' },
];

export function LabsPage({ onBack, onNavHome, onNavTemplates }: LabsPageProps) {
  const [showTour, setShowTour] = useState(false);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [lessons, setLessons] = useState<SubjectLesson[]>(SUBJECT_LESSONS);

  useEffect(() => {
    void fetchLabSubjects()
      .then((subjects) => {
        // Backend drives which subjects appear and in what order; we only render
        // subjects that have a matching presentation entry (animation + lab route).
        // Backend-only subjects without a lab page (e.g. informatic, literature) are skipped.
        const mapped = subjects
          .map((s) => LESSON_BY_KEY.get(s.name.toLowerCase() as LabSubjectKey))
          .filter((l): l is SubjectLesson => Boolean(l));
        setLessons(mapped.length > 0 ? mapped : SUBJECT_LESSONS);
        setStatus('ready');
      })
      .catch(() => {
        // Never leave the page empty — fall back to the full static catalog.
        setLessons(SUBJECT_LESSONS);
        setStatus('error');
      });
  }, []);

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%', position: 'relative' }}>
      <div aria-hidden style={pageDoodleLayerStyle}>
        {PAGE_DOODLES.map((d, i) => (
          <span key={i} style={{ position: 'absolute', top: d.top, left: d.left, right: d.right }}>
            {d.text}
          </span>
        ))}
      </div>

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

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 40px 80px', position: 'relative', zIndex: 1 }}>
        {status === 'loading' && (
          <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 24px' }}>Жүктелуде…</p>
        )}
        {status === 'error' && (
          <p style={{ color: '#B45309', fontSize: '14px', margin: '0 0 24px' }}>
            Пәндерді серверден жүктеу мүмкін болмады — сақталған тізім көрсетілуде.
          </p>
        )}
        <LabsHero lessons={lessons} />
      </main>
    </div>
  );
}

const pageDoodleLayerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: 0,
  fontFamily: 'Spectral, serif',
  fontStyle: 'italic',
  fontSize: '22px',
  color: '#1A1A17',
  opacity: 0.05,
};

function LabsHero({ lessons }: { lessons: SubjectLesson[] }) {
  return (
    <div data-tour="subjects" style={{ display: 'flex', flexDirection: 'column', gap: '28px', margin: '0 0 36px' }}>
      {lessons.map((lesson) => (
        <SubjectLessonBlock
          key={lesson.key}
          lesson={lesson}
          onOpen={() => openSubjectLab(lesson.key)}
        />
      ))}
    </div>
  );
}

function SubjectLessonBlock({
  lesson,
  onOpen,
}: {
  lesson: SubjectLesson;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        gap: '40px',
        flexWrap: 'wrap',
        border: '1px solid #E6E2D8',
        borderRadius: '16px',
        background: '#FFFFFF',
        padding: '36px',
        overflow: 'hidden',
      }}
    >
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {lesson.doodles.map((d, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: d.top,
              left: d.left,
              right: d.right,
              fontFamily: 'Spectral, serif',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: d.size ?? '16px',
              color: lesson.accent,
              opacity: 0.1,
              transform: `rotate(${d.rotate ?? '0deg'})`,
              whiteSpace: 'nowrap',
            }}
          >
            {d.text}
          </span>
        ))}
      </div>

      <div style={{ position: 'relative', flex: '1 1 320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '260px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: lesson.accent,
            textTransform: 'uppercase',
            margin: '0 0 10px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: lesson.accentSoft,
          }}
        >
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
              background: lesson.accent,
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

      <div style={{ position: 'relative', flex: '1 1 340px', minWidth: '280px', maxWidth: '460px' }}>
        <div
          style={{
            border: `1px solid ${lesson.accentSoft}`,
            borderRadius: '12px',
            background: lesson.accentSoft,
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
