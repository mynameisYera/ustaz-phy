import { InMemoryGameRepository } from "@/infrastructure/repositories/InMemoryGameRepository";
import { HttpGameGenerator } from "@/infrastructure/generators/HttpGameGenerator";
import { ZipGameExporter } from "@/infrastructure/exporters/ZipGameExporter";
import { BlobGameLauncher } from "@/infrastructure/launchers/BlobGameLauncher";
import { CreateGameUseCase } from "@/domain/usecases/CreateGame";
import { ApplyFixUseCase } from "@/domain/usecases/ApplyFix";
import { ExportGameUseCase } from "@/domain/usecases/ExportGame";
import { LaunchGameUseCase } from "@/domain/usecases/LaunchGame";
import { ListRecentGamesUseCase } from "@/domain/usecases/ListRecentGames";
import { GetGameUseCase } from "@/domain/usecases/GetGame";
import { ServicesProvider } from "@/presentation/context/ServicesContext";
import { UstazApp } from "@/presentation/components/ustaz/UstazApp";
import { MathGeoGebraPage } from "@/presentation/components/ustaz/MathGeoGebraPage";
import { PhysicsBuoyancyPage } from "@/presentation/components/ustaz/PhysicsBuoyancyPage";
import { GeographyLabPage } from "@/presentation/components/ustaz/GeographyLabPage";
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
  listRecentGames: new ListRecentGamesUseCase(gameRepository),
  getGame: new GetGameUseCase(gameRepository),
};

export function App() {
  if (window.location.pathname === "/math") {
    return <MathGeoGebraPage />;
  }

  if (window.location.pathname === "/physics") {
    return <PhysicsBuoyancyPage />;
  }

  if (window.location.pathname === "/geography") {
    return <GeographyLabPage />;
  }

  return (
    <ServicesProvider services={services}>
      <UstazApp />
    </ServicesProvider>
  );
}
