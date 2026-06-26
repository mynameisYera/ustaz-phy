// ============================================================
// DOMAIN — ядро. Не знает про React, fetch, localStorage.
// ============================================================

export type LessonId = string;

export interface Lesson {
  id: LessonId;
  title: string;
  topic: string;
  durationMinutes: number;
}

export function isLongLesson(lesson: Lesson): boolean {
  return lesson.durationMinutes > 60;
}
