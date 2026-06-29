import type { FixRequest, GameFile } from "../entities/Game";

export interface GenerateGameInput {
  description: string;
  fixHistory: FixRequest[];
  useRag?: boolean;
}

export interface GameGenerator {
  generate(input: GenerateGameInput): Promise<GameFile[]>;
}
