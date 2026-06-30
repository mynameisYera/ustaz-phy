interface UstazHeaderProps {
  onLogoClick?: () => void;
  onHelp?: () => void;
  helpLabel?: string;
  activePage?: 'home' | 'templates';
  onNavHome?: () => void;
  onNavTemplates?: () => void;
}

export function UstazHeader({ onLogoClick, onHelp, helpLabel, activePage, onNavHome, onNavTemplates }: UstazHeaderProps) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', borderBottom: '1px solid #E6E2D8' }}>
      <button
        type="button"
        onClick={onLogoClick}
        style={{ background: 'none', border: 'none', padding: 0, cursor: onLogoClick ? 'pointer' : 'default', textAlign: 'left', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontFamily: 'Spectral, serif', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', color: '#1A1A17' }}>Ustaz 365</span>
          <span style={{ fontSize: '11px', color: '#6F6E66' }}>мектептер үшін · beta</span>
        </div>
      </button>

      {(onNavHome || onNavTemplates) && (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#F0EDE6', borderRadius: '10px', padding: '3px' }}>
          <NavTab label="Ойын студиясы" active={activePage === 'home'} onClick={onNavHome} />
          <NavTab label="Үлгілер" active={activePage === 'templates'} onClick={onNavTemplates} />
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {onHelp && (
          <button
            type="button"
            title="Нұсқауларды көрсету"
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
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E4EFEA', color: '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '14px' }}>
          А
        </div>
      </div>
    </header>
  );
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? '#FFFFFF' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        padding: '6px 16px',
        fontSize: '14px',
        fontFamily: 'inherit',
        color: active ? '#1A1A17' : '#6F6E66',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
        transition: 'background .15s, color .15s',
      }}
    >
      {label}
    </button>
  );
}
