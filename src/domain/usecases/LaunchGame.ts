import type { GameId } from "../entities/Game";
import type { GameLaunch } from "../ports/GameLauncher";
import type { GameLauncher } from "../ports/GameLauncher";
import type { GameRepository } from "../repositories/GameRepository";

export class LaunchGameUseCase {
  constructor(
    private readonly repository: GameRepository,
    private readonly launcher: GameLauncher
  ) {}

  async execute(gameId: GameId): Promise<GameLaunch> {
    const game = await this.repository.getById(gameId);
    if (!game) {
      throw new Error("Игра не найдена");
    }
    return this.launcher.launch(game);
  }
}
