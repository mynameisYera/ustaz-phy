import { createContext, useContext, type ReactNode } from "react";
import type { CreateGameUseCase } from "@/domain/usecases/CreateGame";
import type { ApplyFixUseCase } from "@/domain/usecases/ApplyFix";
import type { ExportGameUseCase } from "@/domain/usecases/ExportGame";
import type { LaunchGameUseCase } from "@/domain/usecases/LaunchGame";

export interface AppServices {
  createGame: CreateGameUseCase;
  applyFix: ApplyFixUseCase;
  exportGame: ExportGameUseCase;
  launchGame: LaunchGameUseCase;
}

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services: AppServices;
  children: ReactNode;
}) {
  return (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
  );
}

export function useServices(): AppServices {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("ServicesProvider is missing");
  return ctx;
}
