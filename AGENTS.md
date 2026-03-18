# AGENTS.md

## Project Overview

Hexagonal Tic-Tac-Toe — a real-time multiplayer game on Cloudflare Workers with Durable Objects and D1. Turborepo monorepo with TanStack Start (React 19) frontend, shared game-core logic package, and Drizzle ORM for both databases. Canvas-based hex grid rendering (radius 20, 1,261 cells). Features ELO rating system, matchmaking, and Chess.com-style lessons.

## Build & Run Commands

```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Production build (Vite)
pnpm test             # Run all tests (vitest run)
pnpm deploy           # Build + wrangler deploy
pnpm tsc --noEmit     # Type check (no dedicated script)
```

### Running a Single Test

```bash
pnpm vitest run packages/game-core/tests/win-checker.test.ts    # Single file
pnpm vitest run -t "detects 6 in a row on q-axis"               # By name pattern
```

### Database Commands

```bash
pnpm db:generate      # Generate D1 migrations (drizzle-kit)
pnpm db:generate:do   # Generate Durable Object SQLite migrations
pnpm db:migrate       # Apply D1 migrations via wrangler
pnpm cf-typegen       # Regenerate worker-configuration.d.ts
```

## Monorepo Structure

```
hex-tic-tac-toe/
├── apps/
│   └── web/                    # TanStack Start app (SSR + client)
│       ├── src/
│       │   ├── routes/         # File-based routing (TanStack Router)
│       │   ├── components/     # React components (HexCanvas, GameHUD, etc.)
│       │   ├── hooks/          # useGameState, useCanvasViewport, useMatchmaking
│       │   ├── lib/            # canvas-renderer.ts, hex-to-pixel.ts
│       │   ├── db/             # D1 access via getDb()
│       │   ├── durable-object.ts
│       │   ├── server.ts       # Worker entry point
│       │   ├── router.tsx
│       │   └── routeTree.gen.ts
│       ├── drizzle/migrations/ # D1 migrations
│       ├── vite.config.ts
│       ├── wrangler.jsonc
│       └── package.json
│
├── packages/
│   ├── game-core/              # Pure TypeScript — no React, no Cloudflare deps
│   │   ├── src/
│   │   │   ├── hex.ts          # Axial/cube math, neighbors, distance
│   │   │   ├── board.ts        # Board state, cell access, validity
│   │   │   ├── win-checker.ts  # 6-in-a-row detection (3 axes)
│   │   │   ├── turn-manager.ts # Turn state machine (1-piece / 2-piece)
│   │   │   ├── elo.ts          # ELO calculation, rating tiers
│   │   │   ├── matchmaking.ts  # Queue logic, ELO-range matching
│   │   │   ├── lessons.ts      # Lesson definitions, puzzle validation
│   │   │   ├── types.ts        # GameState, Player, Move, AxialCoord, etc.
│   │   │   └── index.ts        # Barrel export
│   │   └── tests/
│   │
│   ├── db/                     # Drizzle schemas for D1 + DO SQLite
│   │   ├── src/
│   │   │   ├── schema.ts       # users, ratings, matches, match_moves, lessons, lesson_progress
│   │   │   ├── do-schema.ts    # game_state, cells, moves (DO-local)
│   │   │   └── index.ts        # getDb() helper
│   │   └── package.json
│   │
│   └── ui/                     # Shared React components (Button, Card, Modal)
│       └── package.json
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Testing

- Vitest with `@cloudflare/vitest-pool-workers` — tests run inside Workers runtime via miniflare
- Config: `vitest.config.ts` (separate from `vite.config.ts`). Tests in `test/*.test.ts` and `packages/game-core/tests/`
- Bindings available via `import { env } from 'cloudflare:test'`
- `game-core` tests are pure unit tests (no Cloudflare deps) — test hex math, win detection, turn logic, ELO, puzzles
- No lint or format tools configured (no ESLint, Prettier, or Biome)

## Architecture

### Runtime & Entry Points

- **Worker entry:** `apps/web/src/server.ts` — `createServerEntry` from TanStack Start, intercepts WebSocket upgrade requests for game sessions, delegates the rest to TanStack
- **Durable Object:** `apps/web/src/durable-object.ts` — `GameSession` class with RPC methods and WebSocket Hibernation API
- **Router factory:** `apps/web/src/router.tsx` — creates TanStack Router instance
- **Route tree:** `apps/web/src/routeTree.gen.ts` — auto-generated, DO NOT edit manually

### Two Database Systems

1. **D1 (shared SQLite):** Schema in `packages/db/src/schema.ts`, access via `getDb()` in `packages/db/src/index.ts`, migrations in `apps/web/drizzle/migrations/`
2. **Durable Object SQLite (per-instance):** Schema in `packages/db/src/do-schema.ts`, migrations in `apps/web/drizzle/do-migrations/`, auto-applied on DO construction

### Cloudflare Bindings

Access via `import { env } from 'cloudflare:workers'` (NOT `getCloudflareContext()`):
- `env.DB` — D1 database
- `env.GAME_SESSION` — DurableObjectNamespace for game sessions
- `env.MATCHMAKING_QUEUE` — DurableObjectNamespace for the matchmaking singleton

### Key Patterns

- **Server functions:** Defined with `createServerFn()` from `@tanstack/react-start`, placed at the top of route files before the route definition
- **DO RPC:** Server functions call DO methods directly via `env.GAME_SESSION.getByName(id).methodName()`
- **WebSocket:** Upgrade requests intercepted in `server.ts` via regex (`/game/:id/ws`), forwarded to DO `fetch()`
- **Optimistic UI:** Client updates board state immediately on click, reverts on server error
- **DO migrations:** Run in `blockConcurrencyWhile` during DO construction
- **Shared game-core:** Both client (optimistic validation) and server (authoritative validation) import from `packages/game-core` — single source of truth for game rules

### Game-Specific Architecture

- **Hex coordinates:** Axial (q, r) with s = -q - r. Valid if `abs(q) <= R && abs(r) <= R && abs(s) <= R`
- **Board radius:** R = 20 (1,261 cells). Configurable via constant in `game-core`
- **Turn system:** X plays 1 piece first, then both players alternate placing 2 pieces per turn. Win checked after each individual piece placement
- **Win condition:** 6 consecutive same-player pieces along any of 3 hex axes (q, r, s)
- **Canvas rendering:** Viewport-culled canvas drawing. Only visible cells rendered. Pan/zoom via `useCanvasViewport` hook
- **Matchmaking:** Dedicated singleton Durable Object (`MATCHMAKING_QUEUE`) manages queue atomically. ELO-based with expanding search range over time
- **Lessons:** Slide-based content with interactive puzzle boards. Stored in D1, progress tracked per user

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target ES2022, module ESNext, bundler module resolution
- Use `type` keyword for type-only imports when applicable
- No formatter configured — follow the style of the file you're editing (2-space indent in src, tabs in tests, single quotes, trailing commas, semicolons)

### Imports

- Path alias `@/*` maps to `./src/*` within each package/app (e.g., `import { getDb } from '@/db'`)
- `game-core` imported as `@hex/game-core` across the monorepo
- Order: external packages > `cloudflare:*` imports > `@hex/*` packages > internal `@/` imports > relative imports
- Named exports preferred; default exports only for React components

### Naming Conventions

- **Files:** kebab-case (`do-schema.ts`, `durable-object.ts`, `win-checker.ts`)
- **Route files:** TanStack Start conventions — `$param.tsx`, `__root.tsx`, dot-separated nested paths
- **Components:** PascalCase (`HexCanvas`, `GameHUD`, `PlayerCard`)
- **Server functions:** camelCase (`getGameInfo`, `placeMove`, `joinQueue`)
- **DB tables/columns:** snake_case in SQL, camelCase in Drizzle schema
- **Constants:** UPPER_SNAKE_CASE (`BOARD_RADIUS`, `WIN_LENGTH`, `WS_GAME_PATTERN`)
- **Private DO methods:** underscore prefix (`_broadcast`, `_checkWin`, `_applyMove`)
- **Hex coordinates:** `(q, r)` for axial, `(q, r, s)` for cube. Always use named properties, never raw arrays

### TanStack Start & React Patterns

- **Prefer server functions over API routes.** Use `createServerFn()` for data fetching and mutations. API routes (`server.handlers`) only for external consumers or webhooks
- **Avoid `useEffect` for data fetching.** Use route `loader` functions with server functions instead. `useEffect` acceptable only for WebSocket connections, canvas setup, or DOM measurements
- Route components are non-exported named functions; `export const Route` is the file route definition
- Use `Route.useLoaderData()` and `Route.useParams()` for route data access
- Functional components only, Tailwind CSS v4 utility classes for all styling

### Canvas Rendering

- All draw logic in `apps/web/src/lib/canvas-renderer.ts` — pure functions, no React state
- Canvas component (`HexCanvas`) owns the `<canvas>` ref and calls renderer in `requestAnimationFrame` loop
- Viewport state (pan/zoom) managed by `useCanvasViewport` hook, passed to renderer
- Coordinate transforms (hex ↔ pixel) in `apps/web/src/lib/hex-to-pixel.ts`, importing math from `game-core`

### Error Handling

- Optimistic updates with try/catch and rollback on failure
- Empty `catch` blocks acceptable for non-critical errors but must include a comment explaining why
- DO WebSocket errors handled gracefully — connection status tracked in component state
- Invalid moves rejected server-side with descriptive error messages sent via WebSocket

### Drizzle ORM

- Schema files export table definitions directly (`export const users = sqliteTable(...)`)
- Functional column builders: `integer()`, `text()` (not `integer("colname")`)
- Chain modifiers: `.primaryKey({ autoIncrement: true })`, `.notNull()`, `.default(0)`
- D1 access always through `getDb()` helper, never raw `env.DB`
- DO SQLite access via `drizzle(this.storage, { logger: false })` in the DO class

### Durable Objects

- Extend `DurableObject<Env>` from `cloudflare:workers`
- Always call `super(ctx, env)` in constructor
- Run migrations in `ctx.blockConcurrencyWhile()` during construction
- Public methods are RPC-callable; prefix private helpers with underscore
- WebSocket handlers use the Hibernation API (`ctx.acceptWebSocket`, `webSocketMessage`, `webSocketClose`)
- Export DO class from `server.ts` for wrangler to discover
- Game DOs are named by game ID: `env.GAME_SESSION.getByName(gameId)`
- Matchmaking DO is a singleton: `env.MATCHMAKING_QUEUE.getByName('matchmaking-queue')`

### game-core Package Rules

- **Zero dependencies** on React, Cloudflare, or any browser API — pure TypeScript only
- All functions must be deterministic (same input → same output) for testability
- Export types alongside implementations from `types.ts`
- Every public function needs a corresponding test in `packages/game-core/tests/`
- This package is the single source of truth for: win detection, move validation, turn management, ELO calculation, and lesson puzzle validation