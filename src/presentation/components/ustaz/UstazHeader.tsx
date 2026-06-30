interface UstazHeaderProps {
  onLogoClick?: () => void;
  onHelp?: () => void;
  helpLabel?: string;
}

export function UstazHeader({ onLogoClick, onHelp, helpLabel }: UstazHeaderProps) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid #E6E2D8' }}>
      <button
        type="button"
        onClick={onLogoClick}
        style={{ background: 'none', border: 'none', padding: 0, cursor: onLogoClick ? 'pointer' : 'default', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontFamily: 'Spectral, serif', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', color: '#1A1A17' }}>Ustaz 365</span>
          <span style={{ fontSize: '11px', color: '#6F6E66' }}>для школ · beta</span>
        </div>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onHelp && (
          <button
            type="button"
            title="Показать подсказки"
            onClick={onHelp}
            style={helpLabel
              ? { display: 'inline-flex', alignItems: 'center', gap: '7px', height: '34px', padding: '0 13px 0 11px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', color: '#1A1A17', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }
              : { width: '32px', height: '32px', border: '1px solid #E6E2D8', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E6E5C" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.7-2 2.1-2 3.4M12 17.2h0"/></svg>
            {helpLabel && <span>{helpLabel}</span>}
          </button>
        )}
        <span style={{ fontSize: '14px', color: '#6F6E66' }}>Айнур М.</span>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E4EFEA', color: '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '14px' }}>
          А
        </div>
      </div>
    </header>
  );
}
