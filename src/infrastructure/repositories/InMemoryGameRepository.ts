import type { Game, GameId } from "@/domain/entities/Game";
import type { GameRepository } from "@/domain/repositories/GameRepository";

export class InMemoryGameRepository implements GameRepository {
  private readonly store = new Map<GameId, Game>();

  async save(game: Game): Promise<void> {
    this.store.set(game.id, game);
  }

  async getById(id: GameId): Promise<Game | null> {
    return this.store.get(id) ?? null;
  }
}
