export type GameId = string;

export interface GameFile {
  path: string;
  content: string;
}

export interface FixRequest {
  id: string;
  message: string;
  createdAt: Date;
}

export interface Game {
  id: GameId;
  description: string;
  version: number;
  files: GameFile[];
  fixHistory: FixRequest[];
  createdAt: Date;
  updatedAt: Date;
}

export function createGameId(): GameId {
  return crypto.randomUUID();
}

export function createFixId(): string {
  return crypto.randomUUID();
}
