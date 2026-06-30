import type { CreateGameInput } from "../entities/GameContext";
import type { FixRequest, GameFile } from "../entities/Game";

export interface GenerateGameInput extends CreateGameInput {
  fixHistory: FixRequest[];
  attachments?: Attachment[];
}

export interface GameGenerator {
  generate(input: GenerateGameInput): Promise<GameFile[]>;
}
