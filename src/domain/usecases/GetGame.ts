import type { Game, GameId } from "../entities/Game";
import type { GameRepository } from "../repositories/GameRepository";

export class GetGameUseCase {
  constructor(private readonly repository: GameRepository) {}

  async execute(id: GameId): Promise<Game> {
    const game = await this.repository.getById(id);
    if (!game) {
      throw new Error("Ойын табылмады");
    }
    return game;
  }
}
