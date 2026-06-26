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
    const provider = getAiProvider();
    res.json({
      ok: true,
      provider,
      aiConfigured: isAiConfigured(),
      userApiKeySupported: provider === "grok",
      model: getActiveModelName(),
    });
  });

  app.post("/api/generate", async (req, res) => {
    const { description, fixHistory = [], apiKey } = req.body as {
      description?: string;
      fixHistory?: { message: string }[];
      apiKey?: string;
    };

    const configError = getAiConfigError(apiKey);
    if (configError) {
      res.status(400).json({ error: configError });
      return;
    }

    if (!description?.trim()) {
      res.status(400).json({ error: "description обязателен" });
      return;
    }

    try {
      const content = await generateGame(description.trim(), fixHistory, apiKey);
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
