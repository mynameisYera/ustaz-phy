# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs frontend + embedded Express API via Vite middleware)
npm run dev

# Production server
npm run start          # tsx server/production.ts
npm run start:server   # tsx server/index.ts

# Build
npm run build          # tsc && vite build

# No test runner is configured in this project
```

There is no lint script in `package.json`. TypeScript type-checking is done via `tsc` as part of `npm run build`.

## Environment

Create a `.env` file at the project root:

```
OPENAI_API_KEY=sk-proj-...   # Required — must start with sk-proj- or sk-
OPENAI_MODEL=gpt-4o-mini     # Optional, defaults to gpt-4o-mini
OPENAI_BASE_URL=             # Optional, for custom endpoints
```

The `.env` is loaded by both Vite (via `dotenv` in `vite.config.ts`) and Express (via `server/env.ts`).

## Architecture

The project follows **Clean Architecture** with strict layer separation:

### Layers

**`src/domain/`** — pure business logic, no framework dependencies
- `entities/` — `Game`, `Lesson` data shapes and factory helpers
- `usecases/` — `CreateGame`, `ApplyFix`, `ExportGame`, `LaunchGame` — each takes its dependencies via constructor injection
- `ports/` — interfaces (`GameGenerator`, `GameExporter`, `GameLauncher`) that the infrastructure layer implements
- `repositories/` — `GameRepository`, `LessonRepository` interfaces
- `physics/` — pure physics calculations (energy, challenges)

**`src/infrastructure/`** — concrete implementations of domain ports
- `generators/HttpGameGenerator` — calls `POST /api/generate` on the backend
- `exporters/ZipGameExporter` — packages game files into a ZIP using JSZip
- `launchers/BlobGameLauncher` — opens the generated game HTML in a new tab via a Blob URL
- `repositories/InMemoryGameRepository` — runtime in-memory store (no persistence)

**`src/presentation/`** — React components and styles
- `context/ServicesContext` — provides all use-case instances to the component tree via React context
- `components/GameStudio` — AI game generation UI
- `components/EnergySimulator` — physics simulation UI

**`src/App.tsx`** — wires up all infrastructure instances, creates use-case objects, passes them to `ServicesProvider`, then renders either `GameStudio` or `EnergySimulator`.

**`server/`** — Express API (runs embedded in Vite dev server via `configureServer` hook)
- `app.ts` — creates the Express app with two routes: `GET /api/health`, `POST /api/generate`
- `handleGenerate.ts` — validates request, calls AI, parses response
- `ai.ts` — thin provider abstraction (currently only OpenAI)
- `openai.ts` — constructs the OpenAI client and sends the chat completion request
- `prompts.ts` — `SYSTEM_PROMPT` and `buildUserPrompt` (includes fix history for iterative generation)
- `parseGameResponse.ts` — parses the LLM markdown response into `GameFile[]` objects

### Data flow for game generation

1. User submits description in `GameStudio` component
2. `CreateGameUseCase.execute(description)` is called
3. `HttpGameGenerator.generate()` posts to `POST /api/generate`
4. Express handler → `generateGame()` → OpenAI chat completions API
5. Response parsed from markdown code blocks into `{ path, content }[]` files
6. `Game` entity stored in `InMemoryGameRepository`
7. `LaunchGameUseCase` creates a Blob URL from the HTML file and opens it

### Path alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
