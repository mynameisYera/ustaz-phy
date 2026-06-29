export function QuizIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="6" width="26" height="28" rx="3"/>
      <path d="M13 14h14M13 20h14M13 26h8"/>
    </svg>
  );
}

export function CardsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="11" width="20" height="22" rx="3"/>
      <path d="M14 8h17a3 3 0 0 1 3 3v17"/>
    </svg>
  );
}

export function CrosswordIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.3">
      <rect x="8" y="8" width="8" height="8"/>
      <rect x="16" y="8" width="8" height="8"/>
      <rect x="16" y="16" width="8" height="8"/>
      <rect x="24" y="16" width="8" height="8"/>
      <rect x="16" y="24" width="8" height="8"/>
    </svg>
  );
}

export function SortIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="9" width="11" height="11" rx="2"/>
      <rect x="22" y="20" width="11" height="11" rx="2"/>
      <path d="M25 9h8M25 13h6M7 27h8M7 31h6"/>
    </svg>
  );
}

export function SimIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="13"/>
      <path d="M20 7v6M20 27v6M7 20h6M27 20h6"/>
      <circle cx="20" cy="20" r="3.5"/>
    </svg>
  );
}

export function IconQuizSmall({ type }: { type: string }) {
  if (type === 'quiz') return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="6" width="26" height="28" rx="3"/><path d="M13 14h14M13 20h14M13 26h8"/>
    </svg>
  );
  if (type === 'cards') return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="11" width="20" height="22" rx="3"/><path d="M14 8h17a3 3 0 0 1 3 3v17"/>
    </svg>
  );
  if (type === 'cross') return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.3">
      <rect x="8" y="8" width="8" height="8"/><rect x="16" y="8" width="8" height="8"/>
      <rect x="16" y="16" width="8" height="8"/><rect x="24" y="16" width="8" height="8"/>
      <rect x="16" y="24" width="8" height="8"/>
    </svg>
  );
  if (type === 'sort') return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="9" width="11" height="11" rx="2"/><rect x="22" y="20" width="11" height="11" rx="2"/>
      <path d="M25 9h8M25 13h6M7 27h8M7 31h6"/>
    </svg>
  );
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" stroke="#1E6E5C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="13"/><path d="M20 7v6M20 27v6M7 20h6M27 20h6"/><circle cx="20" cy="20" r="3.5"/>
    </svg>
  );
}
