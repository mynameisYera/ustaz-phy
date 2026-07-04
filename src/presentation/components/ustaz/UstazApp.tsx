import { useState } from 'react';
import type { CreateGameInput } from '@/domain/entities/GameContext';
import { buildGameTitle } from '@/domain/entities/GameContext';
import type { GameId } from '@/domain/entities/Game';
import type { TextTemplate } from '@/infrastructure/templates/TemplatesApi';
import { HomePage } from './HomePage';
import { StudioPage } from './StudioPage';
import { TemplatesPage } from './TemplatesPage';
import { TemplateViewerPage } from './TemplateViewerPage';
import { LabsPage } from './LabsPage';
import { JeopardyPage } from './JeopardyPage';
import { EnergySim } from '../simulators/EnergySim';
import { BuoyancySim } from '../simulators/BuoyancySim';
import { CircuitSim } from '../simulators/CircuitSim';
import { LensSim } from '../simulators/LensSim';
import '../../styles/ustaz.css';

export type SimulatorId = 'energy' | 'buoyancy' | 'circuit' | 'lens';

const SIMULATORS: Record<SimulatorId, () => JSX.Element> = {
  energy: EnergySim,
  buoyancy: BuoyancySim,
  circuit: CircuitSim,
  lens: LensSim,
};

type Page =
  | { id: 'home' }
  | { id: 'studio'; title: string; input: CreateGameInput }
  | { id: 'studio-resume'; gameId: GameId }
  | { id: 'templates' }
  | { id: 'viewer'; template: TextTemplate }
  | { id: 'labs' }
  | { id: 'simulator'; sim: SimulatorId }
  | { id: 'jeopardy' };

export function UstazApp() {
  const [page, setPage] = useState<Page>({ id: 'home' });

  if (page.id === 'studio') {
    return (
      <StudioPage
        mode="create"
        title={page.title}
        input={page.input}
        onBack={() => setPage({ id: 'home' })}
      />
    );
  }

  if (page.id === 'studio-resume') {
    return (
      <StudioPage
        mode="resume"
        gameId={page.gameId}
        onBack={() => setPage({ id: 'home' })}
      />
    );
  }

  if (page.id === 'templates') {
    return (
      <TemplatesPage
        onBack={() => setPage({ id: 'home' })}
        onOpen={(template) => setPage({ id: 'viewer', template })}
        onNavLabs={() => setPage({ id: 'labs' })}
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

  if (page.id === 'labs') {
    return (
      <LabsPage
        onBack={() => setPage({ id: 'home' })}
        onNavHome={() => setPage({ id: 'home' })}
        onNavTemplates={() => setPage({ id: 'templates' })}
      />
    );
  }

  if (page.id === 'simulator') {
    const SimComponent = SIMULATORS[page.sim];
    return (
      <div className="u365-studio-full">
        <div style={{ flexShrink: 0, padding: '12px 20px', borderBottom: '1px solid #E6E2D8', background: '#FFFFFF' }}>
          <button
            type="button"
            onClick={() => setPage({ id: 'home' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px', background: '#FFFFFF', border: '1px solid #E6E2D8', borderRadius: '8px', color: '#1A1A17', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer' }}
          >
            ← Басты бет
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <SimComponent />
        </div>
      </div>
    );
  }

  if (page.id === 'jeopardy') {
    return <JeopardyPage onBack={() => setPage({ id: 'home' })} />;
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
      onOpenGame={(gameId) => setPage({ id: 'studio-resume', gameId })}
      onNavTemplates={() => setPage({ id: 'templates' })}
      onNavLabs={() => setPage({ id: 'labs' })}
      onOpenSimulator={(sim) => setPage({ id: 'simulator', sim })}
      onOpenJeopardy={() => setPage({ id: 'jeopardy' })}
    />
  );
}
