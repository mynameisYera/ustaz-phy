import { useState } from 'react';
import { HomePage } from './HomePage';
import { StudioPage } from './StudioPage';
import { TemplatesPage } from './TemplatesPage';
import { ViewerPage } from './ViewerPage';
import '../../styles/ustaz.css';

type Page =
  | { id: 'home' }
  | { id: 'studio'; title: string }
  | { id: 'templates' }
  | { id: 'viewer'; title: string };

export function UstazApp() {
  const [page, setPage] = useState<Page>({ id: 'home' });

  if (page.id === 'studio') {
    return (
      <StudioPage
        title={page.title}
        onBack={() => setPage({ id: 'home' })}
      />
    );
  }

  if (page.id === 'templates') {
    return (
      <TemplatesPage
        onBack={() => setPage({ id: 'home' })}
        onOpen={(title) => setPage({ id: 'viewer', title })}
      />
    );
  }

  if (page.id === 'viewer') {
    return (
      <ViewerPage
        title={page.title}
        onBack={() => setPage({ id: 'templates' })}
        onUse={(title) => setPage({ id: 'studio', title })}
      />
    );
  }

  return (
    <HomePage
      onCreate={(desc) => setPage({ id: 'studio', title: desc })}
      onTemplates={() => setPage({ id: 'templates' })}
    />
  );
}
