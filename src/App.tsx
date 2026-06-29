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
import { TopBar, type SimId } from "@/presentation/components/shell/TopBar";
import { EnergySim } from "@/presentation/components/simulators/EnergySim";
import { CircuitSim } from "@/presentation/components/simulators/CircuitSim";
import { LensSim } from "@/presentation/components/simulators/LensSim";
import { BuoyancySim } from "@/presentation/components/simulators/BuoyancySim";
import { RagPlayground } from "@/presentation/components/RagPlayground";
import "@/presentation/styles/shell.css";
import "@/presentation/styles/primitives.css";
import "@/presentation/styles/studio.css";
import "@/presentation/styles/simulator.css";
import "@/presentation/styles/rag.css";
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

type Screen = "sim" | "studio" | "rag";

function getHashSim(): SimId {
  const hash = window.location.hash.slice(2);
  if (["energy", "circuit", "lens", "buoyancy"].includes(hash)) return hash as SimId;
  return "energy";
}

export function App() {
  const [screen, setScreen] = useState<Screen>("sim");
  const [activeSim, setActiveSim] = useState<SimId>(getHashSim);

  const handleSimChange = (id: SimId) => {
    window.location.hash = `/${id}`;
    setActiveSim(id);
    setScreen("sim");
  };

  const handleStudioClick = () => setScreen((s) => (s === "studio" ? "sim" : "studio"));
  const handleRagClick    = () => setScreen((s) => (s === "rag"    ? "sim" : "rag"));

  return (
    <ServicesProvider services={services}>
      <div className="app-shell">
        <TopBar
          activeSim={activeSim}
          onSimChange={handleSimChange}
          onStudioClick={handleStudioClick}
          studioActive={screen === "studio"}
          onRagClick={handleRagClick}
          ragActive={screen === "rag"}
        />

        <div className="app-main">
          {screen === "studio" ? (
            <GameStudio />
          ) : screen === "rag" ? (
            <RagPlayground />
          ) : (
            <>
              {activeSim === "energy"   && <EnergySim />}
              {activeSim === "circuit"  && <CircuitSim />}
              {activeSim === "lens"     && <LensSim />}
              {activeSim === "buoyancy" && <BuoyancySim />}
            </>
          )}
        </div>
      </div>
    </ServicesProvider>
  );
}
