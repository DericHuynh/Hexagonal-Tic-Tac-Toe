# Hexagonal Tic-Tac-Toe

A real-time multiplayer hexagonal tic-tac-toe game with ELO ratings, matchmaking, and Chess.com-style lessons. Built on Cloudflare Workers with Durable Objects, D1, TanStack Start, and React 19.

## Game Rules

- **Board:** Hexagonal grid with radius 20 (1,261 cells) using axial coordinates
- **Turn order:** X plays 1 piece first, then both players alternate placing 2 pieces per turn
- **Win condition:** 6 consecutive pieces along any of the 3 hex axes (q, r, or s)
- **Tie:** All cells filled with no winner
- Win is checked after each individual piece placement — a player can win on the first piece of a 2-piece turn

## Architecture

```
Browser (React + Canvas)
  │
  ├── HexCanvas (canvas-renderer.ts) — viewport-culled hex grid rendering
  ├── useGameState — WebSocket client + optimistic UI
  ├── useCanvasViewport — pan/zoom/touch handling
  └── Route Loaders → createServerFn → Durable Objects / D1
          │
          ▼
Cloudflare Worker (server.ts)
  ├── TanStack Start handler (SSR, routing, server functions)
  ├── WebSocket upgrade → GameSession DO (per-game)
  ├── Matchmaking → MatchmakingQueue DO (singleton)
  └── D1 database (users, ratings, matches, lessons)
          │
          ▼
Durable Objects
  ├── GameSession (one per active game)
  │   ├── SQLite: game state, board cells, move history
  │   ├── WebSocket Hibernation API for real-time sync
  │   └── RPC methods: placeMove, resign, getGameState
  │
  └── MatchmakingQueue (singleton)
      ├── SQLite: queue entries
      └── ELO-based matching with expanding search range
```

### Monorepo Structure

```
hex-tic-tac-toe/
├── apps/
│   └── web/                          # TanStack Start app
│       ├── src/
│       │   ├── routes/               # File-based routing
│       │   ├── components/           # HexCanvas, GameHUD, PlayerCard, etc.
│       │   ├── hooks/                # useGameState, useCanvasViewport
│       │   ├── lib/                  # canvas-renderer.ts, hex-to-pixel.ts
│       │   ├── durable-object.ts     # GameSession DO
│       │   ├── matchmaking-queue.ts  # MatchmakingQueue DO
│       │   └── server.ts             # Worker entry point
│       ├── drizzle/migrations/       # D1 migrations
│       └── wrangler.jsonc
│
├── packages/
│   ├── game-core/                    # Pure TypeScript — shared game logic
│   │   ├── src/
│   │   │   ├── hex.ts                # Axial/cube math, neighbors, distance
│   │   │   ├── board.ts              # Board state management
│   │   │   ├── win-checker.ts        # 6-in-a-row detection (3 axes)
│   │   │   ├── turn-manager.ts       # Turn state machine (1-piece / 2-piece)
│   │   │   ├── elo.ts                # ELO calculation, rating tiers
│   │   │   ├── matchmaking.ts        # Queue matching logic
│   │   │   └── lessons.ts            # Lesson definitions, puzzle validation
│   │   └── tests/
│   │
│   ├── db/                           # Drizzle schemas for D1 + DO SQLite
│   │   └── src/
│   │       ├── schema.ts             # users, ratings, matches, lessons
│   │       ├── do-schema.ts          # game_state, cells, moves
│   │       └── index.ts              # getDb() helper
│   │
│   └── ui/                           # Shared React components
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a D1 database

```bash
pnpm dlx wrangler d1 create hex-tic-tac-toe-db
```

Copy the `database_name` and `database_id` from the output into `apps/web/wrangler.jsonc`:

```jsonc
"d1_databases": [
    {
        "binding": "DB",
        "database_name": "hex-tic-tac-toe-db",
        "database_id": "xxxx-xxxx-xxxx-xxxx",
        "migrations_dir": "./drizzle/migrations"
    }
]
```

### 3. Run migrations

```bash
pnpm db:migrate --local
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm build` | Production build (Vite) |
| `pnpm test` | Run all tests (vitest run) |
| `pnpm deploy` | Build + wrangler deploy |
| `pnpm tsc --noEmit` | Type check |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate D1 migrations after changing schema |
| `pnpm db:generate:do` | Generate DO SQLite migrations |
| `pnpm db:migrate` | Apply D1 migrations (add `--remote` for production) |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` |

### Testing

```bash
pnpm test                                              # Run all tests
pnpm vitest run packages/game-core/tests/win-checker.test.ts   # Single file
pnpm vitest run -t "detects 6 in a row on q-axis"     # By name pattern
```

## Key Concepts

### Hexagonal Coordinates

The board uses **axial coordinates** (q, r) where s = -q - r. A cell is valid if:

```
abs(q) <= R && abs(r) <= R && abs(q + r) <= R
```

Three axes for win detection: along q, along r, and along s (the diagonal).

### Turn System

| Move # | Player | Pieces Placed |
|--------|--------|---------------|
| 0 | X | 1 (opening move) |
| 1–2 | O | 2 |
| 3–4 | X | 2 |
| 5–6 | O | 2 |
| ... | alternating | 2 |

### ELO Rating

Standard ELO formula with K-factor tiers:

| Games Played | K-factor |
|---|---|
| 0–10 | 40 |
| 11–30 | 32 |
| 31+ | 24 |

Rating tiers: Bronze (0–799), Silver (800–1199), Gold (1200–1599), Platinum (1600–1999), Diamond (2000–2399), Grandmaster (2400+).

### Rendering

The hex grid is rendered on an HTML Canvas element with viewport culling — only cells visible on screen are drawn. Supports pan (drag), zoom (scroll wheel), and touch gestures.

## Deployment

```bash
# Apply D1 migrations to production
pnpm db:migrate --remote

# Build and deploy
pnpm deploy
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TanStack Start (React 19) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 |
| Rendering | HTML Canvas 2D |
| Real-time | WebSocket Hibernation API |
| Server state | Cloudflare Durable Objects |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| Language | TypeScript (strict mode) |
| Build | Vite + @cloudflare/vite-plugin |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest + @cloudflare/vitest-pool-workers |
| Deployment | Cloudflare Workers |

## License

MIT