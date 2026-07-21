export type LabSubjectKey =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "kzhistory"
  | "worldhistory"
  | "geography"
  | "informatic";

export const LAB_SUBJECT_ROUTES: Record<LabSubjectKey, string> = {
  math: "/math",
  physics: "/physics",
  chemistry: "/chemistry",
  biology: "/biology",
  kzhistory: "/kz-history",
  worldhistory: "/world-history",
  geography: "/geography",
  informatic: "/informatic",
};

export function openSubjectLab(key: LabSubjectKey): void {
  window.location.assign(LAB_SUBJECT_ROUTES[key]);
}
