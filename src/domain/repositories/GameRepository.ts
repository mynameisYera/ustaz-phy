import type { Game, GameId } from "../entities/Game";

export interface GameRepository {
  save(game: Game): Promise<void>;
  getById(id: GameId): Promise<Game | null>;
  listAll(): Promise<Game[]>;
}
