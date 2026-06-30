import type { FixRequest, GameFile } from "../entities/Game";

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64-encoded file content
}

export interface GenerateGameInput {
  description: string;
  fixHistory: FixRequest[];
  attachments?: Attachment[];
}

export interface GameGenerator {
  generate(input: GenerateGameInput): Promise<GameFile[]>;
}
