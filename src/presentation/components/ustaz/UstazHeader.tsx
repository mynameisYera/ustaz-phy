interface UstazHeaderProps {
  onLogoClick?: () => void;
}

export function UstazHeader({ onLogoClick }: UstazHeaderProps) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <span style={{ fontSize: '14px', color: '#6F6E66' }}>Айнур М.</span>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E4EFEA', color: '#1E6E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '14px' }}>
          А
        </div>
      </div>
    </header>
  );
}
