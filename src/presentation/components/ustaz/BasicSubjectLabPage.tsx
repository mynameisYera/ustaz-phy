import type { ReactNode } from "react";
import type { TourStep } from "./Tour";
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabSubject } from "./LabShell";
import { LabFilters, LabGamesStatus, LabGamesEmpty, InlineGamePanel, labItemsToCards } from "./LabGamesPanel";
import { useLabGames } from "@/presentation/hooks/useLabGames";

interface BasicSubjectLabPageProps {
  shellSubject: LabSubject;
  apiSubjectName: string;
  notFoundMessage: string;
  subjectTitle: string;
  subjectChip: string;
  subjectIcon: ReactNode;
  tourSteps: TourStep[];
  formulas: { text: string; top: string; left?: string; right?: string }[];
  heroEmoji: string;
  heroTitle: string;
  heroDescription: string;
  instructionsTitle: string;
  instructionsDesc: string;
  steps: { title: string; body: string }[];
  hint: string;
}

export function BasicSubjectLabPage({
  shellSubject,
  apiSubjectName,
  notFoundMessage,
  subjectTitle,
  subjectChip,
  subjectIcon,
  tourSteps,
  formulas,
  heroEmoji,
  heroTitle,
  heroDescription,
  instructionsTitle,
  instructionsDesc,
  steps,
  hint,
}: BasicSubjectLabPageProps) {
  const { status, error, subjectId, items, classId, search, setSearch, selectClass, activeGame, setActiveGame, reload } =
    useLabGames(apiSubjectName, notFoundMessage);

  const games = status === "ready" ? labItemsToCards(items, setActiveGame, activeGame?.id) : [];

  return (
    <LabShell
      subject={shellSubject}
      subjectIcon={subjectIcon}
      subjectTitle={subjectTitle}
      subjectChip={subjectChip}
      tourSteps={tourSteps}
      formulas={formulas}
      games={games}
      gamesExtra={
        <>
          <LabFilters classId={classId} onSelectClass={selectClass} search={search} onSearchChange={setSearch} />
          <LabGamesStatus status={status} error={error} onRetry={subjectId ? reload : undefined} />
          {status === "ready" && games.length === 0 && <LabGamesEmpty search={search} />}
        </>
      }
      calculator={
        activeGame ? (
          <InlineGamePanel game={activeGame} onBack={() => setActiveGame(null)} />
        ) : (
          <div className="lab-panel-body">
            <div
              style={{
                flex: 1,
                minHeight: "460px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                padding: "32px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "72px", lineHeight: 1 }}>{heroEmoji}</span>
              <h2 style={{ margin: 0, fontFamily: "Spectral, serif", fontSize: "28px", color: "#1a1a17" }}>{heroTitle}</h2>
              <p style={{ margin: 0, maxWidth: "420px", color: "#6f6e66", fontSize: "15px", lineHeight: 1.6 }}>{heroDescription}</p>
            </div>
          </div>
        )
      }
      instructions={
        <>
          <LabInstructionsHead
            title={instructionsTitle}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v5M10 14h0" />
              </svg>
            }
          />
          <p className="lab-instructions-desc">{instructionsDesc}</p>
          <div className="lab-steps">
            {steps.map((step, index) => (
              <LabStep key={step.title} n={index + 1} title={step.title} body={step.body} inactive={index === steps.length - 1} />
            ))}
          </div>
          <LabHint label="Кеңес">{hint}</LabHint>
        </>
      }
    />
  );
}
