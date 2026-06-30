import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateGameInput } from "@/domain/entities/GameContext";
import type { Game } from "@/domain/entities/Game";
import type { Attachment } from "@/domain/ports/GameGenerator";
import { useServices } from "../context/ServicesContext";

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ name: file.name, mimeType: file.type || "application/octet-stream", data: result.split(",")[1] });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type CreateResult = { ok: true; game: Game } | { ok: false; error: string };
type FixResult = { ok: true; game: Game } | { ok: false; error: string };

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

  useEffect(() => () => revokeLaunch(), [revokeLaunch]);

  const create = useCallback(
    async (input: CreateGameInput, files: File[] = []): Promise<CreateResult> => {
      setCreating(true);
      revokeLaunch();

      try {
        const attachments = files.length > 0 ? await Promise.all(files.map(fileToAttachment)) : undefined;
        const created = await createGame.execute(input, attachments);
        const launch = await launchGame.execute(created.id);
        revokeRef.current = launch.revoke;
        setGame(created);
        setLaunchUrl(launch.launchUrl);
        return { ok: true, game: created };
      } catch (e) {
        const error = e instanceof Error ? e.message : "Жасау қатесі";
        return { ok: false, error };
      } finally {
        setCreating(false);
      }
    },
    [createGame, launchGame, revokeLaunch]
  );

  const download = useCallback(async () => {
    if (!game) return;
    setDownloading(true);

    try {
      const blob = await exportGame.execute(game.id);
      downloadBlob(blob, `game-v${game.version}.zip`);
    } finally {
      setDownloading(false);
    }
  }, [exportGame, game]);

  const submitFix = useCallback(
    async (message: string, files: File[] = []): Promise<FixResult> => {
      if (!game) return { ok: false, error: "Ойын жасалмаған" };
      setFixing(true);
      revokeLaunch();

      try {
        const attachments = files.length > 0 ? await Promise.all(files.map(fileToAttachment)) : undefined;
        const updated = await applyFix.execute(game.id, message, attachments);
        const launch = await launchGame.execute(updated.id);
        revokeRef.current = launch.revoke;
        setGame(updated);
        setLaunchUrl(launch.launchUrl);
        return { ok: true, game: updated };
      } catch (e) {
        const error = e instanceof Error ? e.message : "Түзету қатесі";
        return { ok: false, error };
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
    create,
    download,
    submitFix,
  };
}
