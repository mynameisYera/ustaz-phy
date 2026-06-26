# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run both frontend and backend in development
npm run dev          # Vite dev server (frontend + embedded Express via plugin)
npm run dev:server   # Express backend only (port 3001)

# Build
npm run build        # tsc + vite build → dist/

# Production
npm start            # Express production server (server/production.ts)
```

No test or lint scripts are configured.

## Architecture

This is a physics education platform with two main features: an AI-powered HTML game generator ("Game Studio") and an interactive energy physics simulator.

The frontend follows **Clean Architecture** with three layers:

```
src/
├── domain/          # Pure business logic — no framework deps
│   ├── entities/    # Game, Lesson, FixRequest value objects
│   ├── ports/       # Interfaces: GameGenerator, GameExporter, GameLauncher
│   ├── repositories/# Interfaces: GameRepository, LessonRepository
│   ├── usecases/    # CreateGame, ApplyFix, ExportGame, LaunchGame
│   └── physics/     # Energy simulation logic
├── infrastructure/  # Implements domain ports
│   ├── generators/  # HttpGameGenerator → calls /api/generate
│   ├── exporters/   # ZipGameExporter (JSZip)
│   ├── launchers/   # BlobGameLauncher (iframe via blob URL)
│   └── repositories/# InMemory* implementations
├── presentation/    # React components
│   ├── components/  # GameStudio, EnergySimulator, GamePlayer, etc.
│   ├── context/     # ServicesContext (DI container)
│   └── hooks/       # useGameStudio (main orchestration)
└── App.tsx          # Tab nav: Studio ↔ Simulator
```

**Dependency flow**: `presentation` → `domain usecases` → `domain ports` ← `infrastructure`. Services are instantiated in `App.tsx` and injected via `ServicesContext`.

The **backend** (`server/`) is a standalone Express app:
- `app.ts` — Express factory with `/api/health` and `/api/generate`
- `handleGenerate.ts` — validates request, calls AI, returns HTML
- `ai.ts` — routes to Grok (`grok.ts`), OpenAI (`openai.ts`), or Gemini (`gemini.ts`)
- `prompts.ts` — constructs system + user prompts for game generation
- `parseGameResponse.ts` + `gameHtml.ts` — extract and validate `index.html` from AI response

In development, Vite embeds the Express app via a custom plugin (`vite.config.ts`), so a single `npm run dev` serves both.

**Deployment**: Vercel uses `api/generate.ts` as a serverless function wrapper. Cloudflare Pages support exists via `wrangler.toml`.

## Environment Variables

Copy `.env.example` to `.env`. The required variable is `AI_PROVIDER` (one of `grok`, `openai`, `gemini`) plus the corresponding API key:

```env
AI_PROVIDER=grok
GROK_API_KEY=          # gsk_... (Groq) or xai-... (xAI) — auto-detected by prefix
OPENAI_API_KEY=        # sk-proj-... or sk-...
GEMINI_API_KEY=
VITE_API_URL=          # Override API base URL (optional, for separate backend deployment)
```

Users can also supply a Grok/xAI API key directly in the UI; it is stored in `localStorage` via `src/infrastructure/storage/grokApiKeyStorage.ts`.

## Path Alias

`@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Generated Game Format

AI-generated games are self-contained single-file HTML documents (HTML + inline CSS + JS). Each "fix" request creates a new version; full history is kept in `InMemoryGameRepository`. The game is previewed via a blob URL in an iframe and can be exported as a ZIP via JSZip.
