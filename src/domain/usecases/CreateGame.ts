import {
  createGameId,
  type Game,
} from "../entities/Game";
import type { Attachment, GameGenerator } from "../ports/GameGenerator";
import type { GameRepository } from "../repositories/GameRepository";

export class CreateGameUseCase {
  constructor(
    private readonly generator: GameGenerator,
    private readonly repository: GameRepository
  ) {}

  async execute(description: string, attachments?: Attachment[]): Promise<Game> {
    const trimmed = description.trim();
    if (!trimmed) {
      throw new Error("Ойын сипаты бос болмауы керек");
    }

    const files = await this.generator.generate({
      description: trimmed,
      fixHistory: [],
      attachments,
    });

    const now = new Date();
    const game: Game = {
      id: createGameId(),
      description: trimmed,
      version: 1,
      files,
      fixHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(game);
    return game;
  }
}
