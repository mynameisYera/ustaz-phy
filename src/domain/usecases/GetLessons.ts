import type { Lesson } from "../entities/Lesson";
import { isLongLesson } from "../entities/Lesson";
import type { LessonRepository } from "../repositories/LessonRepository";

// Use Case — одно бизнес-действие приложения.
// Принимает репозиторий через конструктор (Dependency Injection).
export class GetLessonsUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(): Promise<Lesson[]> {
    const lessons = await this.repository.getAll();
    // Бизнес-правило: сначала длинные уроки
    return [...lessons].sort(
      (a, b) => Number(isLongLesson(b)) - Number(isLongLesson(a))
    );
  }
}

export class GetLessonByIdUseCase {
  constructor(private readonly repository: LessonRepository) {}

  execute(id: string): Promise<Lesson | null> {
    return this.repository.getById(id);
  }
}
