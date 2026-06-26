import JSZip from "jszip";
import type { Game } from "@/domain/entities/Game";
import type { GameExporter } from "@/domain/ports/GameExporter";

export class ZipGameExporter implements GameExporter {
  async export(game: Game): Promise<Blob> {
    const zip = new JSZip();

    for (const file of game.files) {
      zip.file(file.path, file.content);
    }

    return zip.generateAsync({ type: "blob" });
  }
}
