import { useState } from 'react';
import type { CreateGameInput } from '@/domain/entities/GameContext';
import { buildGameTitle } from '@/domain/entities/GameContext';
import type { TextTemplate } from '@/infrastructure/templates/TemplatesApi';
import { HomePage } from './HomePage';
import { StudioPage } from './StudioPage';
import { TemplatesPage } from './TemplatesPage';
import { TemplateViewerPage } from './TemplateViewerPage';
import '../../styles/ustaz.css';

type Page =
  | { id: 'home' }
  | { id: 'studio'; title: string; input: CreateGameInput }
  | { id: 'templates' }
  | { id: 'viewer'; template: TextTemplate };

export function UstazApp() {
  const [page, setPage] = useState<Page>({ id: 'home' });

  if (page.id === 'studio') {
    return (
      <StudioPage
        title={page.title}
        input={page.input}
        onBack={() => setPage({ id: 'home' })}
      />
    );
  }

  if (page.id === 'templates') {
    return (
      <TemplatesPage
        onBack={() => setPage({ id: 'home' })}
        onOpen={(template) => setPage({ id: 'viewer', template })}
      />
    );
  }

  if (page.id === 'viewer') {
    return (
      <TemplateViewerPage
        template={page.template}
        onBack={() => setPage({ id: 'templates' })}
      />
    );
  }

  return (
    <HomePage
      onCreate={(input) =>
        setPage({
          id: 'studio',
          title: buildGameTitle(input),
          input,
        })
      }
      onNavTemplates={() => setPage({ id: 'templates' })}
    />
  );
}
