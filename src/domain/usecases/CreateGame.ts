import type { CreateGameInput } from "../entities/GameContext";
import {
  createGameId,
  type Game,
} from "../entities/Game";
import type { Attachment, GameGenerator } from "../ports/GameGenerator";
import type { GameRepository } from "../repositories/GameRepository";

function validateInput(input: CreateGameInput): CreateGameInput {
  const grade = Number(input.grade);
  const subject = input.subject.trim();
  const lessonTopic = input.lessonTopic.trim();
  const description = input.description.trim();
  const materialText = input.materialText?.trim();

  if (!Number.isInteger(grade) || grade < 1 || grade > 11) {
    throw new Error("Класс таңдалуы керек (1–11)");
  }
  if (!subject) {
    throw new Error("Пән көрсетілуі керек");
  }
  if (!lessonTopic) {
    throw new Error("Сабақ тақырыбы көрсетілуі керек");
  }
  if (!description) {
    throw new Error("Ойын сипаты бос болмауы керек");
  }

  return {
    grade,
    subject,
    lessonTopic,
    description,
    materialText: materialText || undefined,
  };
}

export class CreateGameUseCase {
  constructor(
    private readonly generator: GameGenerator,
    private readonly repository: GameRepository
  ) {}

  async execute(description: string): Promise<Game> {
    const trimmed = description.trim();
    if (!trimmed) {
      throw new Error("Ойын сипаты бос болмауы керек");
    }

    const files = await this.generator.generate({
      ...validated,
      fixHistory: [],
      attachments,
    });

    const now = new Date();
    const game: Game = {
      id: createGameId(),
      description: validated.description,
      context: {
        grade: validated.grade,
        subject: validated.subject,
        lessonTopic: validated.lessonTopic,
      },
      materialText: validated.materialText,
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
