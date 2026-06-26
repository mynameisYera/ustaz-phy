import {
  createFixId,
  type FixRequest,
  type Game,
  type GameId,
} from "../entities/Game";
import type { GameGenerator } from "../ports/GameGenerator";
import type { GameRepository } from "../repositories/GameRepository";

export class ApplyFixUseCase {
  constructor(
    private readonly generator: GameGenerator,
    private readonly repository: GameRepository
  ) {}

  async execute(gameId: GameId, message: string): Promise<Game> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Запрос на фикс не может быть пустым");
    }

    const existing = await this.repository.getById(gameId);
    if (!existing) {
      throw new Error("Игра не найдена");
    }

    const fix: FixRequest = {
      id: createFixId(),
      message: trimmed,
      createdAt: new Date(),
    };

    const fixHistory = [...existing.fixHistory, fix];
    const files = await this.generator.generate({
      description: existing.description,
      fixHistory,
    });

    const updated: Game = {
      ...existing,
      version: existing.version + 1,
      files,
      fixHistory,
      updatedAt: new Date(),
    };

    await this.repository.save(updated);
    return updated;
  }
}
