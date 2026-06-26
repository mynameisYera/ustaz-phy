import type { Game } from "../entities/Game";

export interface GameExporter {
  export(game: Game): Promise<Blob>;
}
