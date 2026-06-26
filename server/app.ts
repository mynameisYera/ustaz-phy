import "./env.js";
import cors from "cors";
import express, { type Express } from "express";
import {
  getActiveModelName,
  getAiProvider,
  isAiConfigured,
} from "./ai.js";
import { handleGenerate } from "./handleGenerate.js";

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
    const result = await handleGenerate(req.body ?? {});

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.json({ files: result.files });
  });

  return app;
}

export { isAiConfigured };
