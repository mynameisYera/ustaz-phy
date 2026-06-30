import { useState } from 'react';
import { HomePage } from './HomePage';
import { StudioPage } from './StudioPage';
import { TemplatesPage } from './TemplatesPage';
import { ViewerPage } from './ViewerPage';
import '../../styles/ustaz.css';

type Page =
  | { id: 'home' }
  | { id: 'studio'; title: string; initialPrompt?: string; initialFiles?: File[] }
  | { id: 'templates' }
  | { id: 'viewer'; title: string };

export function UstazApp() {
  const [page, setPage] = useState<Page>({ id: 'home' });

  if (page.id === 'studio') {
    return (
      <StudioPage
        title={page.title}
        initialPrompt={page.initialPrompt}
        initialFiles={page.initialFiles}
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
      onCreate={(desc, files) => setPage({ id: 'studio', title: desc, initialPrompt: desc, initialFiles: files })}
      onTemplates={() => setPage({ id: 'templates' })}
      onBlank={() => setPage({ id: 'studio', title: 'Новая игра' })}
    />
  );
}
