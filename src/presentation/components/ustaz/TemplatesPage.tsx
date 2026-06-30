import { useState } from 'react';
import { UstazHeader } from './UstazHeader';
import { Tour, type TourStep } from './Tour';
import { IconQuizSmall } from './icons';

const TEMPLATES_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="filters"]', icon: 'filter', title: 'Найдите нужный шаблон', body: 'Отфильтруйте библиотеку по предмету, классу и типу игры или воспользуйтесь поиском.' },
  { target: '[data-tour="grid"]',    icon: 'grid',   title: 'Каталог шаблонов',      body: 'Готовые игры с мини-превью. Нажмите «Открыть», чтобы посмотреть шаблон целиком.' },
];

interface TemplatesPageProps {
  onBack: () => void;
  onOpen: (title: string) => void;
}

const QUIZ_TEMPLATE = {
  title: 'Викторина',
  meta: 'Готовый шаблон для урока · Телевизионный формат',
  type: 'quiz',
  tint: '#111827',
};

export function TemplatesPage({ onBack, onOpen }: TemplatesPageProps) {
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="u365-root" style={{ overflowY: 'auto', height: '100%' }}>
      {showTour && <Tour steps={TEMPLATES_TOUR_STEPS} onClose={() => setShowTour(false)} />}
      <UstazHeader onLogoClick={onBack} onHelp={() => setShowTour(true)} helpLabel="Подсказки" />

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px 40px 80px' }}>
        <h1 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '34px', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
          Библиотека шаблонов
        </h1>
        <p style={{ color: '#6F6E66', fontSize: '15px', margin: '0 0 28px' }}>
          В системе доступен один полноценный шаблон — «Викторина», готовый к запуску сразу после создания.
        </p>

        <div data-tour="filters" style={{ marginBottom: '20px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EAF1ED', color: '#1E6E5C', borderRadius: '999px', padding: '8px 14px', fontSize: '13px' }}>
            Доступен 1 шаблон
          </span>
        </div>

        <div data-tour="grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 520px)', justifyContent: 'center' }}>
          <button type="button" className="u365-gallery-card" onClick={() => onOpen(QUIZ_TEMPLATE.title)} style={{ textAlign: 'left' }}>
            <div style={{ height: '150px', background: 'linear-gradient(135deg, #111827, #1f2937 65%, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1f2937' }}>
              <IconQuizSmall type={QUIZ_TEMPLATE.type} />
            </div>
            <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <span style={{ fontSize: '20px', lineHeight: '1.3', color: '#1A1A17', fontFamily: 'Spectral, serif' }}>{QUIZ_TEMPLATE.title}</span>
              <p style={{ margin: 0, fontSize: '13px', color: '#6F6E66', lineHeight: '1.5' }}>
                {QUIZ_TEMPLATE.meta}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6F6E66' }}>Категории · Стоимость · Медиа-вопросы</span>
                <span style={{ fontSize: '13px', color: '#1E6E5C', fontWeight: 600 }}>Открыть →</span>
              </div>
            </div>
          </button>
        </div>
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#6F6E66' }}>
          Остальные шаблонные проекты удалены.
        </div>
      </main>
    </div>
  );
}
