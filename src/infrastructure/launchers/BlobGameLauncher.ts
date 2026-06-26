import type { Game } from "@/domain/entities/Game";
import type { GameLaunch, GameLauncher } from "@/domain/ports/GameLauncher";

function inlineAssets(game: Game): string {
  const html = game.files.find((f) => f.path === "index.html")?.content;
  if (!html) throw new Error("В игре нет index.html");

  const css = game.files.find((f) => f.path === "style.css")?.content ?? "";
  const js = game.files.find((f) => f.path === "game.js")?.content ?? "";

  return html
    .replace('<link rel="stylesheet" href="style.css" />', `<style>${css}</style>`)
    .replace('<script src="game.js"></script>', `<script>${js}</script>`);
}

export class BlobGameLauncher implements GameLauncher {
  launch(game: Game): GameLaunch {
    const content = inlineAssets(game);
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const launchUrl = URL.createObjectURL(blob);

    return {
      launchUrl,
      revoke: () => URL.revokeObjectURL(launchUrl),
    };
  }
}
