import type { KeyboardEvent, ReactNode } from "react";

interface TargetChallengeProps {
  title?: ReactNode;
  question: string;
  answerValue: string;
  answerUnit?: string;
  onAnswerChange: (v: string) => void;
  onCheck: () => void;
  onAnswerKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  checkResult: "correct" | "wrong" | null;
  onExit?: () => void;
  exitLabel?: string;
  hint?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function TargetChallenge({
  title = "🎯 Шаманы тап",
  question,
  answerValue,
  answerUnit,
  onAnswerChange,
  onCheck,
  onAnswerKeyDown,
  checkResult,
  onExit,
  exitLabel = "← Оқу режимі",
  hint,
  actions,
  children,
}: TargetChallengeProps) {
  return (
    <div className="prim-challenge">
      <div className="prim-challenge-head">
        <h2>{title}</h2>
        {onExit && (
          <button type="button" className="prim-challenge-exit" onClick={onExit}>
            {exitLabel}
          </button>
        )}
      </div>

      <p className="prim-challenge-question">{question}</p>

      {children}

      <div className="prim-challenge-answer-row">
        <input
          type="text"
          className="prim-challenge-input"
          placeholder={`Жауап${answerUnit ? ` (${answerUnit})` : ""}`}
          value={answerValue}
          onChange={(e) => onAnswerChange(e.target.value)}
          onKeyDown={onAnswerKeyDown}
        />
        <button
          type="button"
          className="prim-challenge-check"
          onClick={onCheck}
          disabled={!answerValue.trim()}
        >
          Тексеру
        </button>
      </div>

      {checkResult === "correct" && (
        <p className="prim-challenge-feedback prim-challenge-feedback--ok">✓ Дұрыс!</p>
      )}
      {checkResult === "wrong" && (
        <p className="prim-challenge-feedback prim-challenge-feedback--bad">✗ Қате. Қайта көріңіз.</p>
      )}

      {actions}

      {hint && <p className="prim-challenge-hint">{hint}</p>}
    </div>
  );
}
