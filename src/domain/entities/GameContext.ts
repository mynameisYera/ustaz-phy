export interface GameLessonContext {
  grade: number;
  subject: string;
  lessonTopic: string;
}

export interface CreateGameInput {
  grade: number;
  subject: string;
  lessonTopic: string;
  description: string;
  materialText?: string;
}

export function formatLessonChips(context: GameLessonContext): string[] {
  return [`${context.grade} класс`, context.subject, context.lessonTopic];
}

export function buildGameTitle(input: CreateGameInput): string {
  const topic = input.lessonTopic.trim();
  const desc = input.description.trim();
  if (desc.length <= 60) return desc || topic;
  return topic || desc.slice(0, 60);
}
