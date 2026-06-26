import type { Game } from "../entities/Game";

export interface GameLaunch {
  launchUrl: string;
  revoke: () => void;
}

export interface GameLauncher {
  launch(game: Game): GameLaunch;
}
