import { useState, useEffect, useRef, useCallback } from 'react';

export interface TourStep {
  target: string;
  icon: string;
  title: string;
  body: string;
}

interface Props {
  steps: TourStep[];
  onClose: () => void;
}

const ICONS: Record<string, string> = {
  chat:     'M4 5h16v11H9.5L5 19.5V16H4z',
  canvas:   'M3 4.5h18v12.5H3zM9 20.5h6',
  phone:    'M7 3h10v18H7zM10.5 18h3',
  share:    'M8.1 10.9 15.9 7M8.1 13.1l7.8 3.9',
  help:     'M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0',
  download: 'M12 4v9M8 9.5l4 4 4-4M4 17h16',
  open:     'M15 3h6v6M21 3 9 15M9 3H3v12h12V9',
  edit:     'M13 3l4 4-9 9H4v-4L13 3z',
  filter:   'M3 5h18M6 10h12M9 15h6',
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
};

const PAD = 8;
const POP_W = 330;
const GAP = 14;

export function Tour({ steps, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popHeight, setPopHeight] = useState(190);

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const updateRect = useCallback(() => {
    const el = current?.target ? document.querySelector(current.target) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [current?.target]);

  // On step change: position spotlight immediately, scroll if needed, recompute after scroll
  useEffect(() => {
    const el = current?.target ? document.querySelector(current.target) : null;
    if (!el) { setRect(null); return; }
    setRect(el.getBoundingClientRect()); // show spotlight at current position right away
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const tid = setTimeout(() => setRect(el.getBoundingClientRect()), 450);
    return () => clearTimeout(tid);
  }, [current?.target]);

  useEffect(() => {
    if (popRef.current) setPopHeight(popRef.current.offsetHeight || 190);
  });
  useEffect(() => {
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') isLast ? onClose() : setStep(s => s + 1);
      else if (e.key === 'ArrowLeft' && !isFirst) setStep(s => s - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFirst, isLast, onClose]);

  const next = () => isLast ? onClose() : setStep(s => s + 1);
  const prev = () => { if (!isFirst) setStep(s => s - 1); };

  // Compute positions
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let hx = vw / 2 - 150, hy = vh / 2 - 90, hw = 300, hh = 180;
  if (rect) { hx = rect.left - PAD; hy = rect.top - PAD; hw = rect.width + PAD * 2; hh = rect.height + PAD * 2; }

  const below = hy + hh + GAP + popHeight <= vh - 8;
  const px = Math.max(16, Math.min(hx + hw / 2 - POP_W / 2, vw - POP_W - 16));
  const py = below ? hy + hh + GAP : Math.max(16, hy - GAP - popHeight);
  const cx = rect ? Math.max(px + 18, Math.min(rect.left + rect.width / 2, px + POP_W - 24)) : px + POP_W / 2;
  const ay = below ? py - 6.5 : py + popHeight - 6.5;

  const iconPath = ICONS[current?.icon] || ICONS.help;
  const isCircleIcon = current?.icon === 'help';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Spotlight hole — box-shadow creates the backdrop */}
      <div style={{
        position: 'fixed',
        left: hx, top: hy, width: hw, height: hh,
        border: '2px solid #1E6E5C',
        borderRadius: 10,
        boxShadow: '0 0 0 9999px rgba(26,26,23,.48)',
        pointerEvents: 'none',
        transition: 'left .3s,top .3s,width .3s,height .3s',
      }} />

      {/* Arrow */}
      <div style={{
        position: 'fixed',
        left: cx - 6.5, top: ay,
        width: 13, height: 13,
        background: '#fff',
        transform: 'rotate(45deg)',
        borderTop: below ? '1px solid #E6E2D8' : 'none',
        borderLeft: below ? '1px solid #E6E2D8' : 'none',
        borderBottom: below ? 'none' : '1px solid #E6E2D8',
        borderRight: below ? 'none' : '1px solid #E6E2D8',
        transition: 'left .3s,top .3s',
        pointerEvents: 'none',
      }} />

      {/* Popover */}
      <div ref={popRef} style={{
        position: 'fixed',
        left: px, top: py,
        width: POP_W,
        background: '#fff',
        border: '1px solid #E6E2D8',
        borderRadius: 12,
        boxShadow: '0 18px 48px rgba(26,26,23,.16)',
        padding: 18,
        boxSizing: 'border-box',
        transition: 'left .3s,top .3s',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E4EFEA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {isCircleIcon && <circle cx="12" cy="12" r="8.5" />}
              <path d={iconPath} />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Spectral, serif', fontWeight: 500, fontSize: 17, color: '#1A1A17', lineHeight: 1.25 }}>{current?.title}</div>
            <div style={{ fontSize: 12, color: '#6F6E66', marginTop: 3 }}>{step + 1} / {steps.length} қадам</div>
          </div>
          <button onClick={onClose} title="Закрыть" style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '-2px -2px 0 0', padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A6A498" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ fontSize: 14, color: '#4A4943', lineHeight: 1.55, margin: '13px 0 16px' }}>{current?.body}</div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button onClick={prev} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 14, color: isFirst ? '#C9C5B8' : '#6F6E66', cursor: isFirst ? 'default' : 'pointer', padding: '6px 2px' }}>
            Артқа
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {steps.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === step ? '#1E6E5C' : '#D8D3C6', display: 'inline-block' }} />
              ))}
            </div>
            <button onClick={next} style={{ height: 36, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1E6E5C', color: '#fff', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {isLast ? 'Дайын' : 'Келесі'}
              {!isLast && <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"/></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
