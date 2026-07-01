import type { Game } from "../entities/Game";
import type { GameRepository } from "../repositories/GameRepository";

export class ListRecentGamesUseCase {
  constructor(private readonly repository: GameRepository) {}

  async execute(): Promise<Game[]> {
    return this.repository.listAll();
  }
}
