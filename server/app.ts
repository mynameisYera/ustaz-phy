import "./env.js";
import cors from "cors";
import express, { type Express } from "express";
import {
  generateGame,
  getActiveModelName,
  getAiConfigError,
  getAiProvider,
  isAiConfigured,
} from "./ai";
import { parseGameResponse } from "./parseGameResponse";

export function createApiApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      provider: getAiProvider(),
      aiConfigured: isAiConfigured(),
      model: getActiveModelName(),
    });
  });

  app.post("/api/generate", async (req, res) => {
    const configError = getAiConfigError();
    if (configError) {
      res.status(503).json({ error: configError });
      return;
    }

    const { description, fixHistory = [] } = req.body as {
      description?: string;
      fixHistory?: { message: string }[];
    };

    if (!description?.trim()) {
      res.status(400).json({ error: "description обязателен" });
      return;
    }

    try {
      const content = await generateGame(description.trim(), fixHistory);
      const files = parseGameResponse(content);
      res.json({ files });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка генерации";
      console.error("[generate]", message);
      res.status(502).json({ error: message });
    }
  });

  return app;
}

export { isAiConfigured };
