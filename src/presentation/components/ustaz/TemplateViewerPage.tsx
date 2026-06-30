import { useEffect, useState } from 'react';
import type { TextTemplate } from '@/infrastructure/templates/TemplatesApi';

interface TemplateViewerPageProps {
  template: TextTemplate;
  onBack: () => void;
}

export function TemplateViewerPage({ template, onBack }: TemplateViewerPageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([template.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [template.content]);

  const createdLabel = formatDate(template.created_at);

  return (
    <div className="u365-studio-full">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '13px 28px', borderBottom: '1px solid #E6E2D8', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#6F6E66', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6F6E66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5"/></svg>
            Вернуться к шаблонам
          </button>
          <span style={{ width: '1px', height: '20px', background: '#E6E2D8', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Spectral, serif', fontSize: '18px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</span>
        </div>
        {createdLabel && (
          <span style={{ fontSize: '13px', color: '#6F6E66', flexShrink: 0 }}>Создан {createdLabel}</span>
        )}
      </header>

      <section style={{ flex: 1, minHeight: 0 }}>
        {src ? (
          <iframe
            title={template.name}
            src={src}
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#6F6E66' }}>
            Открываем шаблон…
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru');
}
