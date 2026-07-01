import {
  createFixId,
  type FixRequest,
  type Game,
  type GameId,
} from "../entities/Game";
import type { Attachment, GameGenerator } from "../ports/GameGenerator";
import type { GameRepository } from "../repositories/GameRepository";

export class ApplyFixUseCase {
  constructor(
    private readonly generator: GameGenerator,
    private readonly repository: GameRepository
  ) {}

  async execute(gameId: GameId, message: string, attachments?: Attachment[]): Promise<Game> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new Error("Түзету сұрауы бос болмауы керек");
    }

    const existing = await this.repository.getById(gameId);
    if (!existing) {
      throw new Error("Ойын табылмады");
    }

    const fix: FixRequest = {
      id: createFixId(),
      message: trimmed,
      createdAt: new Date(),
    };

    const fixHistory = [...existing.fixHistory, fix];
    const files = await this.generator.generate({
      grade: existing.context.grade,
      subject: existing.context.subject,
      lessonTopic: existing.context.lessonTopic,
      description: existing.description,
      materialText: existing.materialText,
      outputFormat: existing.context.outputFormat,
      fixHistory,
      attachments,
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
