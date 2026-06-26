import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)));

dotenv.config({ path: resolve(projectRoot, ".env"), override: true });

export default defineConfig(async () => {
  const { createApiApp, isAiConfigured } = await import("./server/app");

  const apiPlugin: Plugin = {
    name: "game-api",
    configureServer(server) {
      server.middlewares.use(createApiApp());
      console.log("✓ AI API встроен в Vite (/api/generate)");

      if (isAiConfigured()) {
        console.log(`✓ AI настроен: ${process.env.AI_PROVIDER || "openai"}`);
      } else {
        console.warn("⚠ OPENAI_API_KEY не найден — проверьте .env в:", projectRoot);
      }
    },
  };

  return {
    plugins: [react(), apiPlugin],
    resolve: {
      alias: {
        "@": resolve(projectRoot, "src"),
      },
    },
  };
});
