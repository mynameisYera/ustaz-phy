import type { Lesson } from "@/domain/entities/Lesson";
import type { LessonRepository } from "@/domain/repositories/LessonRepository";

const MOCK_LESSONS: Lesson[] = [
  { id: "1", title: "Кinematics", topic: "Mechanics", durationMinutes: 45 },
  { id: "2", title: "Newton's Laws", topic: "Mechanics", durationMinutes: 90 },
  { id: "3", title: "Electric Field", topic: "Electrodynamics", durationMinutes: 60 },
];

// Адаптер — конкретная реализация порта LessonRepository.
// Здесь fetch/API; можно заменить на HttpLessonRepository без изменения domain.
export class InMemoryLessonRepository implements LessonRepository {
  async getAll(): Promise<Lesson[]> {
    return MOCK_LESSONS;
  }

  async getById(id: string): Promise<Lesson | null> {
    return MOCK_LESSONS.find((l) => l.id === id) ?? null;
  }
}
