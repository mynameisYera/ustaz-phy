import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/domain/entities/Game";
import { useServices } from "../context/ServicesContext";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useGameStudio() {
  const { createGame, launchGame, exportGame, applyFix } = useServices();

  const [game, setGame] = useState<Game | null>(null);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

  const revokeLaunch = useCallback(() => {
    revokeRef.current?.();
    revokeRef.current = null;
    setLaunchUrl(null);
  }, []);

  const [creating, setCreating] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => revokeLaunch(), [revokeLaunch]);

  const create = useCallback(
    async (description: string) => {
      setCreating(true);
      setError(null);
      revokeLaunch();

      try {
        const created = await createGame.execute(description);
        const launch = await launchGame.execute(created.id);
        revokeRef.current = launch.revoke;
        setGame(created);
        setLaunchUrl(launch.launchUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка создания");
      } finally {
        setCreating(false);
      }
    },
    [createGame, launchGame, revokeLaunch]
  );

  const download = useCallback(async () => {
    if (!game) return;
    setDownloading(true);
    setError(null);

    try {
      const blob = await exportGame.execute(game.id);
      downloadBlob(blob, `game-v${game.version}.zip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка скачивания");
    } finally {
      setDownloading(false);
    }
  }, [exportGame, game]);

  const submitFix = useCallback(
    async (message: string) => {
      if (!game) return;
      setFixing(true);
      setError(null);
      revokeLaunch();

      try {
        const updated = await applyFix.execute(game.id, message);
        const launch = await launchGame.execute(updated.id);
        revokeRef.current = launch.revoke;
        setGame(updated);
        setLaunchUrl(launch.launchUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка фикса");
      } finally {
        setFixing(false);
      }
    },
    [applyFix, game, launchGame, revokeLaunch]
  );

  return {
    game,
    launchUrl,
    creating,
    fixing,
    downloading,
    error,
    create,
    download,
    submitFix,
  };
}
