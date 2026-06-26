import type { GameId } from "../entities/Game";
import type { GameExporter } from "../ports/GameExporter";
import type { GameRepository } from "../repositories/GameRepository";

export class ExportGameUseCase {
  constructor(
    private readonly repository: GameRepository,
    private readonly exporter: GameExporter
  ) {}

  async execute(gameId: GameId): Promise<Blob> {
    const game = await this.repository.getById(gameId);
    if (!game) {
      throw new Error("Ойын табылмады");
    }
    return this.exporter.export(game);
  }
}
