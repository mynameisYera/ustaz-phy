import { useState } from 'react';
import type { CreateGameInput } from '@/domain/entities/GameContext';
import { buildGameTitle } from '@/domain/entities/GameContext';
import { HomePage } from './HomePage';
import { StudioPage } from './StudioPage';
import { TemplatesPage } from './TemplatesPage';
import { ViewerPage } from './ViewerPage';
import '../../styles/ustaz.css';

type Page =
  | { id: 'home' }
  | { id: 'studio'; title: string; input: CreateGameInput }
  | { id: 'templates' }
  | { id: 'viewer'; title: string };

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
        onOpen={(title) => setPage({ id: 'viewer', title })}
      />
    );
  }

  if (page.id === 'viewer') {
    return (
      <ViewerPage
        title={page.title}
        onBack={() => setPage({ id: 'templates' })}
        onUse={(title) =>
          setPage({
            id: 'studio',
            title,
            input: {
              grade: 5,
              subject: 'Математика',
              lessonTopic: title,
              description: title,
            },
          })
        }
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
      onTemplates={() => setPage({ id: 'templates' })}
      onBlank={() =>
        setPage({
          id: 'studio',
          title: 'Новая игра',
          input: {
            grade: 7,
            subject: 'Физика',
            lessonTopic: 'Кинематика',
            description: 'Создай интерактивную игру по теме урока',
          },
        })
      }
    />
  );
}
