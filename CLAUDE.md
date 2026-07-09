# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development — frontend + embedded Express API, both served by Vite
npm run dev

# Standalone API server (Express, no Vite) — rarely needed
npm run dev:server     # tsx watch server/index.ts
npm run start          # tsx server/production.ts
npm run start:server   # tsx server/index.ts

# Build (type-check + bundle)
npm run build          # tsc && vite build

npm run preview        # preview the production build
```

There is no lint script and no test runner. Type-checking is done by `tsc` as part of `npm run build` — run `npm run build` to verify a change type-checks. `tsconfig.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters`, so unused imports/vars fail the build.

The UI text is primarily Kazakh, with some Russian in server logs and error strings. Keep that convention when editing user-facing strings.

## Environment

Create a `.env` at the project root:

```
OPENAI_API_KEY=sk-proj-...   # Required — must start with sk-proj- or sk-
OPENAI_MODEL=gpt-4o-mini     # Optional, defaults to gpt-4o-mini
OPENAI_BASE_URL=             # Optional, custom endpoint
```

`.env` is loaded twice: by Vite (`dotenv` in `vite.config.ts`) and by Express (`server/env.ts`). The AI-backed features (game generation, PDF material extraction) return a Kazakh error if the key is missing rather than crashing.

## The two runtime surfaces

There is **one Vite app** but it renders completely different trees depending on `window.location.pathname` (see `src/App.tsx`):

- **Subject lab routes** (`/math`, `/physics`, `/geography`, `/chemistry`, `/biology`, `/kz-history`, `/world-history`) each render a standalone `*LabPage` component. Routes are defined in `src/domain/labs/subjectRoutes.ts`. There is **no router library** — navigation between labs is a full-page `window.location.assign`.
- **Everything else** renders `<UstazApp>`, the main teacher app, wrapped in `<ServicesProvider>`. `UstazApp` is a single component with an internal `Page` union state machine (home → studio / templates / labs / simulator / jeopardy) — again, no router, just `useState`.

When adding a new lab, add the route to `subjectRoutes.ts` **and** a branch in `App.tsx`.

## Architecture

Clean Architecture with strict layer separation. The AI **game-generation** feature is the part that fully exercises all layers; the subject labs are lighter and mostly live in `presentation` + `infrastructure`.

**`src/domain/`** — pure business logic, no framework deps
- `entities/` — `Game`, `Lesson`, `GameContext` (`CreateGameInput`, `buildGameTitle`), `Subjects`
- `usecases/` — `CreateGame`, `ApplyFix`, `ExportGame`, `LaunchGame`, `ListRecentGames`, `GetGame`, `GetLessons`; each receives its dependencies via constructor injection
- `ports/` — `GameGenerator`, `GameExporter`, `GameLauncher` interfaces implemented by infrastructure
- `repositories/` — `GameRepository`, `LessonRepository` interfaces
- `physics/` — pure calculations (`energy`, `gameChallenge`)
- `labs/subjectRoutes.ts`, `kz-history/` — lab route + data tables

**`src/infrastructure/`** — concrete implementations
- `generators/HttpGameGenerator` (calls `POST /api/generate`), `TemplateGameGenerator`
- `exporters/ZipGameExporter` (JSZip), `launchers/BlobGameLauncher` (opens generated HTML via Blob URL)
- `repositories/InMemory*` — runtime-only, **no persistence**
- Client API modules that hit external/local HTTP: `templates/TemplatesApi` + `CatalogApi`, `labs/LabsApi`, `simulators/SimulatorsApi`. **Note:** `TemplatesApi`/`CatalogApi` talk to a hard-coded external backend (`https://uiren-backend.onrender.com/api`), *not* the local Express server.
- **Config-driven interactive task engines** — the reusable pattern behind the labs. Each is a generic renderer component fed by plain-data `*TaskConfig` objects:
  - `geogebra/` — `GeoGebraApplet` (loads `deployggb.js` from geogebra.org at runtime) + `VectorTaskConfig` / `DistanceTaskConfig` and their `*TaskConfigs` arrays
  - `physics/` — `PhysicsCanvas` (Matter.js) + `BuoyancyTaskConfig` / `buoyancyTaskConfigs`
  - `geography/` — `MapEngine` (MapLibre GL) + `GeoTaskConfig` / `geoTaskConfigs`
  - `pdf/extractPdfMaterial` — renders PDF pages to images with `pdfjs-dist`, then POSTs to `/api/extract-material` for OCR/text extraction via the AI provider

  To add a task to an existing lab, add a config object to the relevant `*TaskConfigs` array — you usually don't touch the engine component.

**`src/presentation/`** — React + CSS (plain CSS files in `styles/`, not CSS modules)
- `context/ServicesContext` — provides use-case instances to the tree (only wraps `UstazApp`, not the lab routes)
- `hooks/useGameStudio` — orchestrates the create/fix/export/launch flow for the studio
- `components/ustaz/` — the main app screens; `LabShell` is the shared chrome (nav, formulas backdrop, tour, game grid) that every lab page composes
- `components/simulators/` — self-contained canvas simulators (`EnergySim`, `BuoyancySim`, `CircuitSim`, `LensSim`)
- `components/primitives/` — small shared UI atoms (`Sidebar`, `Canvas`, `SliderRow`, …)

**`server/`** — Express API, run embedded in Vite dev via `configureServer` (see `vite.config.ts`)
- `app.ts` — `createApiApp()`; routes: `GET /api/health`, `POST /api/generate`, `POST /api/extract-material`. `express.json` limit is **12mb** (PDF page images are large).
- `handleGenerate.ts` / `handleExtractMaterial.ts` — validate → call AI → parse. Both return a discriminated `{ ok: true, ... } | { ok: false, status, error }` result rather than throwing.
- `ai.ts` — provider abstraction (currently only OpenAI), config detection (`isAiConfigured`, `getAiConfigError`)
- `openai.ts`, `prompts.ts` (`SYSTEM_PROMPT` + `buildUserPrompt`, which appends fix history for iterative regeneration), `parseGameResponse.ts` (markdown code blocks → `GameFile[]`)
- `reactGameHtml.ts` / `gameHtml.ts` — build a **fully self-contained** game HTML: React/ReactDOM UMD builds are read from `node_modules` and inlined as `<script>` text, and JSX is transpiled with esbuild, so the generated game's sandboxed iframe makes no network calls.

**`api/`** — Vercel serverless entry points (`generate.ts`, `extract-material.ts`) that thin-wrap the same `server/handle*` functions. This is how the routes work in production; the Express `app.ts` is the dev-time equivalent. `api/generate` has a 300s `maxDuration` (`vercel.json`).

### Data flow — AI game generation

1. `GameStudio`/`useGameStudio` calls `CreateGameUseCase.execute(input)`
2. `HttpGameGenerator.generate()` → `POST /api/generate`
3. `handleGenerate` → `ai.ts` → OpenAI chat completions
4. `parseGameResponse` turns markdown code blocks into `GameFile[]` (`{ path, content }`)
5. `Game` entity stored in `InMemoryGameRepository`
6. `ApplyFixUseCase` re-runs generation with accumulated fix history; `ExportGameUseCase` zips the files; `LaunchGameUseCase` opens the built HTML via a Blob URL

## Deployment

Vercel. `vercel.json` builds with `npm run build` to `dist/`, rewrites all non-`/api` paths to `/index.html` (SPA fallback), and routes `/api/*` to the serverless functions in `api/`.

## Path alias

`@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.json`).
