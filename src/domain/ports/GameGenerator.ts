import type { FixRequest, GameFile } from "../entities/Game";

export interface GenerateGameInput {
  description: string;
  fixHistory: FixRequest[];
  /** Groq (gsk_...) или xAI (xai-...) — вводит пользователь в Game Studio */
  apiKey?: string;
}

export interface GameGenerator {
  generate(input: GenerateGameInput): Promise<GameFile[]>;
}
