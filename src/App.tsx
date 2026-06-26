import { useState } from "react";
import { InMemoryGameRepository } from "@/infrastructure/repositories/InMemoryGameRepository";
import { HttpGameGenerator } from "@/infrastructure/generators/HttpGameGenerator";
import { ZipGameExporter } from "@/infrastructure/exporters/ZipGameExporter";
import { BlobGameLauncher } from "@/infrastructure/launchers/BlobGameLauncher";
import { CreateGameUseCase } from "@/domain/usecases/CreateGame";
import { ApplyFixUseCase } from "@/domain/usecases/ApplyFix";
import { ExportGameUseCase } from "@/domain/usecases/ExportGame";
import { LaunchGameUseCase } from "@/domain/usecases/LaunchGame";
import { ServicesProvider } from "@/presentation/context/ServicesContext";
import { GameStudio } from "@/presentation/components/GameStudio";
import { EnergySimulator } from "@/presentation/components/EnergySimulator";
import "@/presentation/styles/studio.css";
import "@/presentation/styles/simulator.css";
import "@/presentation/styles/app.css";

const gameRepository = new InMemoryGameRepository();
const gameGenerator = new HttpGameGenerator();
const gameExporter = new ZipGameExporter();
const gameLauncher = new BlobGameLauncher();

const services = {
  createGame: new CreateGameUseCase(gameGenerator, gameRepository),
  applyFix: new ApplyFixUseCase(gameGenerator, gameRepository),
  exportGame: new ExportGameUseCase(gameRepository, gameExporter),
  launchGame: new LaunchGameUseCase(gameRepository, gameLauncher),
};

type Screen = "studio" | "simulator";

export function App() {
  const [screen, setScreen] = useState<Screen>("simulator");

  return (
    <ServicesProvider services={services}>
      <div className="app-shell">
        <nav className="app-nav">
          <button
            type="button"
            className={screen === "simulator" ? "active" : ""}
            onClick={() => setScreen("simulator")}
          >
            ⚡ Симулятор энергии
          </button>
          <button
            type="button"
            className={screen === "studio" ? "active" : ""}
            onClick={() => setScreen("studio")}
          >
            🎮 Game Studio (ИИ)
          </button>
        </nav>

        <div className="app-main">
          {screen === "simulator" ? <EnergySimulator /> : <GameStudio />}
        </div>
      </div>
    </ServicesProvider>
  );
}
