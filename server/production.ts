import "./env.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiApp } from "./app.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(root, "dist");
const port = Number(process.env.PORT) || 3000;

const app = createApiApp();

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(resolve(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`ustaz-physics → http://localhost:${port}`);
  console.log("API: POST /api/generate");
});
