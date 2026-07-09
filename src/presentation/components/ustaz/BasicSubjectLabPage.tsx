import type { ReactNode } from "react";
import type { TourStep } from "./Tour";
import { LabShell, LabInstructionsHead, LabStep, LabHint, type LabSubject } from "./LabShell";
import { useLabGamesCards } from "@/presentation/hooks/useLabGamesCards";

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
  taskText: string;
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
  taskText,
  instructionsTitle,
  instructionsDesc,
  steps,
  hint,
}: BasicSubjectLabPageProps) {
  const { status, cards, error, subjectId, reload } = useLabGamesCards(apiSubjectName, notFoundMessage);

  return (
    <LabShell
      subject={shellSubject}
      subjectIcon={subjectIcon}
      subjectTitle={subjectTitle}
      subjectChip={subjectChip}
      tourSteps={tourSteps}
      formulas={formulas}
      games={status === "ready" ? cards : []}
      gamesExtra={
        <>
          {status === "loading" && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "16px" }}>Жүктелуде…</p>
          )}
          {status === "error" && (
            <div
              style={{
                marginBottom: "20px",
                padding: "14px 18px",
                borderRadius: "10px",
                background: "rgba(244,63,94,0.12)",
                border: "1px solid rgba(244,63,94,0.3)",
                color: "#fda4af",
                fontSize: "14px",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Жүктеу мүмкін болмады</p>
              <p style={{ margin: 0 }}>{error}</p>
              {subjectId && (
                <button
                  type="button"
                  onClick={reload}
                  style={{
                    marginTop: "12px",
                    height: "34px",
                    padding: "0 16px",
                    border: "none",
                    borderRadius: "8px",
                    background: "var(--accent)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Қайталау 🔄
                </button>
              )}
            </div>
          )}
        </>
      }
      calculator={
        <div className="lab-panel-body">
          <div className="lab-panel-task">
            <strong>Тапсырма:</strong> {taskText}
          </div>
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
