import { useState } from 'react';
import { Tour, type TourStep } from './Tour';

type ViewerState = 'loading' | 'success' | 'error';

interface ViewerPageProps {
  title: string;
  onBack: () => void;
  onUse: (title: string) => void;
}

const VIEWER_TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="frame"]', icon: 'open', title: 'Просмотр шаблона', body: 'Игра открывается прямо здесь — попробуйте её так, как увидят ученики, перед тем как взять за основу.' },
  { target: '[data-tour="use"]',   icon: 'edit', title: 'Используйте как основу', body: 'Понравился шаблон? Откройте его в Студии и адаптируйте под свой урок с помощью ассистента.' },
];

export function ViewerPage({ title, onBack, onUse }: ViewerPageProps) {
  const [state] = useState<ViewerState>('success');
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="u365-studio-full">
      {showTour && <Tour steps={VIEWER_TOUR_STEPS} onClose={() => setShowTour(false)} />}

      {/* Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '13px 28px', borderBottom: '1px solid #E6E2D8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#6F6E66', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'inherit' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5"/></svg>
            Вернуться к шаблонам
          </button>
          <span style={{ width: '1px', height: '20px', background: '#E6E2D8', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Spectral, serif', fontSize: '18px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button
            type="button"
            title="Показать подсказки"
            onClick={() => setShowTour(true)}
            style={{ width: '34px', height: '34px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0"/></svg>
          </button>
          <button
            data-tour="use"
            type="button"
            onClick={() => onUse(title)}
            style={{ height: '34px', padding: '0 16px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
          >
            Использовать как основу
          </button>
        </div>
      </header>

      {/* Framed game area */}
      <div data-tour="frame" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px', minHeight: 0 }}>
        <div style={{ width: '100%', maxWidth: '760px', height: '100%', maxHeight: '520px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* LOADING */}
          {state === 'loading' && (
            <>
              <div className="u365-bar-progress" />
              <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '22px', alignItems: 'center', justifyContent: 'center' }}>
                <div className="u365-skeleton-line" style={{ width: '70%', height: '150px', background: '#F4F1EA', borderRadius: '12px' }} />
                <div className="u365-skeleton-line-d1" style={{ height: '14px', width: '46%', background: '#F0EDE4', borderRadius: '6px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="u365-skeleton-line-d2" style={{ height: '38px', width: '120px', background: '#F0EDE4', borderRadius: '8px' }} />
                  <div className="u365-skeleton-line-d3" style={{ height: '38px', width: '120px', background: '#F0EDE4', borderRadius: '8px' }} />
                </div>
                <span style={{ color: '#6F6E66', fontSize: '14px' }}>Шаблон открывается…</span>
              </div>
            </>
          )}

          {/* SUCCESS: flashcard game */}
          {state === 'success' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 40px', background: '#FCFBF8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#6F6E66', marginBottom: '8px' }}>
                <span>Карточка 4 из 20</span>
                <span style={{ color: '#1E6E5C', fontWeight: 500 }}>Изучено: 3</span>
              </div>
              <div style={{ height: '4px', background: '#EEEAE0', borderRadius: '99px', overflow: 'hidden', marginBottom: '28px' }}>
                <div style={{ width: '20%', height: '100%', background: '#1E6E5C' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '380px', aspectRatio: '5/3', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'Spectral, serif', fontSize: '40px', fontWeight: 500 }}>Франция</span>
                  <span style={{ fontSize: '13px', color: '#A6A498' }}>Нажмите, чтобы увидеть столицу</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '26px' }}>
                <button type="button" style={{ height: '40px', padding: '0 24px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: '#1A1A17', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>
                  Повторить позже
                </button>
                <button type="button" style={{ height: '40px', padding: '0 24px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>
                  Знаю
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {state === 'error' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px', textAlign: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '1.5px solid #B4533B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B4533B" strokeWidth="1.6" strokeLinecap="round"><path d="M12 7.5v5.5M12 16.5h0"/></svg>
              </div>
              <h3 style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: '22px', margin: 0 }}>Не удалось открыть шаблон</h3>
              <p style={{ fontSize: '14px', color: '#6F6E66', maxWidth: '340px', margin: 0, lineHeight: '1.55' }}>
                Проверьте подключение к интернету и попробуйте снова.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" style={{ height: '38px', padding: '0 20px', border: 'none', borderRadius: '8px', background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>Повторить</button>
                <button type="button" onClick={onBack} style={{ height: '38px', padding: '0 20px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: '#1A1A17', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}>Назад</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
