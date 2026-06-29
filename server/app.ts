import "./env.js";
import cors from "cors";
import express, { type Express } from "express";
import multer from "multer";
import {
  getActiveModelName,
  getAiProvider,
  isAiConfigured,
} from "./ai.js";
import { handleGenerate } from "./handleGenerate.js";
import {
  handleRagCreateStore,
  handleRagDebugSearch,
  handleRagDeleteFile,
  handleRagQuery,
  handleRagStatus,
  handleRagUpload,
} from "./handleRag.js";

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

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

  app.get("/api/rag/status", async (_req, res) => {
    const result = await handleRagStatus();
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  app.post("/api/rag/store", async (req, res) => {
    const result = await handleRagCreateStore(req.body ?? {});
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  app.post("/api/rag/upload", pdfUpload.single("file"), async (req, res) => {
    const result = await handleRagUpload(req.file);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  app.delete("/api/rag/files/:fileId", async (req, res) => {
    const result = await handleRagDeleteFile(req.params.fileId);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ ok: true });
  });

  app.post("/api/rag/query", async (req, res) => {
    const result = await handleRagQuery(req.body ?? {});
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  app.post("/api/rag/debug-search", async (req, res) => {
    const result = await handleRagDebugSearch(req.body ?? {});
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  return app;
}

export { isAiConfigured };
