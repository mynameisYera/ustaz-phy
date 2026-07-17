import { useEffect, useRef, useState } from 'react';
import { decodeLabItemHtml, type LabItem } from '@/infrastructure/labs/LabsApi';

/** `null` = every class of the subject, the default when a lab page opens. */
const CLASS_OPTIONS: (number | null)[] = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const ALL_CLASSES_LABEL = "Барлық сыныптар";

function classLabel(cls: number | null): string {
  return cls === null ? ALL_CLASSES_LABEL : `${cls} сынып`;
}

/** Class filter (all / 1-11) + name-search controls, shared across every subject lab page. */
export function LabFilters({
  classId,
  onSelectClass,
  search,
  onSearchChange,
}: {
  classId: number | null;
  onSelectClass: (cls: number | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <div>
        <span style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginBottom: '8px' }}>Сынып</span>
        <ClassDropdown value={classId} onSelect={onSelectClass} />
      </div>

      <div style={{ flex: '1 1 220px', minWidth: '200px', maxWidth: '360px' }}>
        <span style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginBottom: '8px' }}>Іздеу</span>
        <div style={{ position: 'relative' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ойын атауы бойынша іздеу…"
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 36px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ClassDropdown({ value, onSelect }: { value: number | null; onSelect: (cls: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          height: '38px',
          minWidth: '160px',
          padding: '0 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'inherit',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        {classLabel(value)}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 20,
            minWidth: '160px',
            maxHeight: '220px',
            overflowY: 'auto',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: '#1a2420',
            boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
            padding: '4px',
          }}
        >
          {CLASS_OPTIONS.map((cls) => {
            const active = cls === value;
            return (
              <button
                key={cls ?? 'all'}
                type="button"
                onClick={() => {
                  onSelect(cls);
                  setOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  height: '32px',
                  padding: '0 10px',
                  marginBottom: cls === null ? '4px' : undefined,
                  borderRadius: '6px',
                  border: 'none',
                  borderBottom: cls === null ? '1px solid rgba(255,255,255,0.12)' : undefined,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {classLabel(cls)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Loading skeleton / empty state / error box for the games grid, shared across subject lab pages. */
export function LabGamesStatus({
  status,
  error,
  onRetry,
}: {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  onRetry?: () => void;
}) {
  if (status === 'loading') {
    return (
      <div className="lab-games-grid" style={{ marginBottom: '4px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="lab-card-skeleton" />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', fontSize: '14px' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Жүктеу мүмкін болмады</p>
        <p style={{ margin: 0 }}>{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{ marginTop: '12px', height: '34px', padding: '0 16px', border: 'none', borderRadius: '8px', background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}
          >
            Қайталау 🔄
          </button>
        )}
      </div>
    );
  }

  return null;
}

/** Empty-state card shown in the games grid area when a class/search has 0 results. */
export function LabGamesEmpty({ search, classId }: { search: string; classId?: number | null }) {
  return (
    <div className="lab-games-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 18v3M7 9l2 2 2-3 2 3 2-2" />
      </svg>
      <p className="lab-games-empty-title">
        {search.trim()
          ? 'Іздеу бойынша ойын табылмады'
          : classId == null
            ? 'Бұл пән үшін ойындар әзірге жоқ'
            : 'Бұл сынып үшін ойындар әзірге жоқ'}
      </p>
      <p className="lab-games-empty-sub">
        {search.trim()
          ? 'Басқа атауды қолданып көріңіз немесе сүзгіні тазалаңыз.'
          : classId == null
            ? 'Кейінірек оралып көріңіз.'
            : 'Басқа сыныпты таңдап көріңіз немесе кейінірек оралыңыз.'}
      </p>
    </div>
  );
}

/**
 * Renders a loaded lab game inline (iframe srcDoc) in place of a subject's
 * calculator/simulator panel. The only chrome is a floating fullscreen toggle;
 * returning to the game list is done via the subject's own filters/cards.
 * `onBack` is kept in the prop contract for callers but is currently unused.
 */
export function InlineGamePanel({ game }: { game: LabItem; onBack?: () => void }) {
  // The game opens inline; the floating button toggles fullscreen. There is no
  // navbar strip — Esc exits fullscreen when it is on.
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen]);

  return (
    <div className={`lab-ggb-wrap${fullscreen ? ' lab-ggb-wrap--fullscreen' : ''}`}>
      <button
        type="button"
        className="lab-ggb-fs-btn"
        onClick={() => setFullscreen((v) => !v)}
        title={fullscreen ? 'Толық экраннан шығу (Esc)' : 'Толық экран'}
        aria-label={fullscreen ? 'Толық экраннан шығу' : 'Толық экран'}
      >
        {fullscreen ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
          </svg>
        )}
      </button>

      <div className="lab-panel-body">
        <div className="lab-ggb-host">
          <iframe
            title={game.name}
            srcDoc={decodeLabItemHtml(game)}
            sandbox="allow-scripts allow-same-origin"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        </div>
      </div>
    </div>
  );
}

function gameIcon(id: number): string {
  const icons = ['🧪', '🚀', '⚡', '🔬', '🪐', '💡'];
  return icons[id % icons.length];
}

/**
 * Maps loaded LabItems to LabGameCard entries with a consistent look across subjects.
 * Listing across all classes omits per-item classId, so the badge falls back to a
 * generic label rather than rendering an empty class number.
 */
export function labItemsToCards(items: LabItem[], onOpen: (item: LabItem) => void, activeGameId?: number) {
  return items.map((item) => ({
    tone: 'accent' as const,
    tag: item.classId != null ? `${item.classId} СЫНЫП` : 'ЗЕРТХАНА',
    name: item.name,
    desc: 'Интерактивті зертхана — ойын осы жерде, тапсырманың орнында ашылады.',
    icon: <span style={{ fontSize: '40px' }}>{gameIcon(item.id)}</span>,
    onClick: () => onOpen(item),
    disabled: activeGameId === item.id,
  }));
}
