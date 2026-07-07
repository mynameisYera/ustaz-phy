import { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
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

export function LabsPage({ onBack, onNavHome, onNavTemplates }: LabsPageProps) {
  const [showTour, setShowTour] = useState(false);

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
        <LabsHero />
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

function LabsHero() {
  const ROUTES: Record<'math' | 'physics' | 'chemistry', string> = {
    math: '/math',
    physics: '/physics',
    chemistry: '/chemistry',
  };

  const handleOpen = (key: 'math' | 'physics' | 'chemistry') => {
    window.location.assign(ROUTES[key]);
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

