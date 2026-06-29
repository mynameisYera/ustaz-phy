import { InMemoryGameRepository } from "@/infrastructure/repositories/InMemoryGameRepository";
import { HttpGameGenerator } from "@/infrastructure/generators/HttpGameGenerator";
import { ZipGameExporter } from "@/infrastructure/exporters/ZipGameExporter";
import { BlobGameLauncher } from "@/infrastructure/launchers/BlobGameLauncher";
import { CreateGameUseCase } from "@/domain/usecases/CreateGame";
import { ApplyFixUseCase } from "@/domain/usecases/ApplyFix";
import { ExportGameUseCase } from "@/domain/usecases/ExportGame";
import { LaunchGameUseCase } from "@/domain/usecases/LaunchGame";
import { ServicesProvider } from "@/presentation/context/ServicesContext";
import { UstazApp } from "@/presentation/components/ustaz/UstazApp";
import "@/presentation/styles/studio.css";

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

export function App() {
  return (
    <ServicesProvider services={services}>
      <UstazApp />
    </ServicesProvider>
  );
}
