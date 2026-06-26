import type { FixRequest, GameFile } from "../entities/Game";

export interface GenerateGameInput {
  description: string;
  fixHistory: FixRequest[];
}

export interface GameGenerator {
  generate(input: GenerateGameInput): Promise<GameFile[]>;
}
