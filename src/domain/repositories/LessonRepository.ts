import type { Lesson } from "../entities/Lesson";

// Порт (интерфейс) — контракт «откуда брать данные».
// Реализация будет в infrastructure.
export interface LessonRepository {
  getAll(): Promise<Lesson[]>;
  getById(id: string): Promise<Lesson | null>;
}
