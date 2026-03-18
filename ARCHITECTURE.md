# Hexagonal Tic-Tac-Toe: Architecture & System Design

## 1. Overview

A real-time multiplayer Hexagonal Tic-Tac-Toe game built as an edge-native application on Cloudflare Workers. Features a hexagonal grid with radius 20 (1,261 cells), ELO-based matchmaking, and a Chess.com-style lessons system. Built with TanStack Start (React 19), Cloudflare Durable Objects for real-time game state, D1 for persistent data, and Drizzle ORM for both databases.

## 2. Game Rules

### Board
- Hexagonal grid using **axial coordinates** (q, r) with radius R = 20
- Valid cells satisfy `abs(q) <= R && abs(r) <= R && abs(q + r) <= R`
- Total cells: 3 × R × (R + 1) + 1 = **1,261 cells**
- Three axes for win detection: q-axis, r-axis, s-axis (where s = -q - r)

### Turn System
1. **X plays first** — places exactly **1 piece**
2. **O responds** — places **2 pieces** in a row (adjacent moves)
3. **X plays** — places **2 pieces** in a row
4. **Alternation continues** — each subsequent turn is 2 pieces
5. Win is checked **after each individual piece placement**, not just at turn end
6. If a player completes 6-in-a-row during their first piece of a 2-piece turn, the game ends immediately (they don't place the second piece)

### Win Condition
- **6 consecutive pieces** along any of the 3 hex axes (q, r, or s direction)
- Checked via sliding window: for each axis, scan lines of cells for 6 consecutive same-player pieces

### Tie Condition
- All 1,261 cells are occupied and no player has 6-in-a-row

## 3. Monorepo Structure (Turborepo)

```
hex-tic-tac-toe/
├── apps/
│   ├── web/                          # TanStack Start frontend + SSR
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── __root.tsx
│   │   │   │   ├── index.tsx         # Landing / lobby
│   │   │   │   ├── game/
│   │   │   │   │   └── $id.tsx       # Active game page
│   │   │   │   ├── lessons/
│   │   │   │   │   ├── index.tsx     # Lesson catalog
│   │   │   │   │   └── $id.tsx       # Individual lesson
│   │   │   │   ├── leaderboard.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── $username.tsx
│   │   │   │   └── api/
│   │   │   │       └── auth/         # BetterAuth routes
│   │   │   ├── components/
│   │   │   │   ├── HexCanvas.tsx      # Canvas-based hex grid renderer
│   │   │   │   ├── GameHUD.tsx        # Turn info, timer, player cards
│   │   │   │   ├── MatchmakingQueue.tsx
│   │   │   │   ├── LessonCard.tsx
│   │   │   │   ├── PlayerCard.tsx     # Avatar, ELO, rating change
│   │   │   │   └── Header.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useGameState.ts    # WebSocket + optimistic state
│   │   │   │   ├── useCanvasViewport.ts # Pan/zoom logic
│   │   │   │   └── useMatchmaking.ts
│   │   │   ├── lib/
│   │   │   │   ├── canvas-renderer.ts # Pure drawing functions
│   │   │   │   └── hex-to-pixel.ts    # Coordinate transforms
│   │   │   ├── db/                    # D1 access (via getDb())
│   │   │   ├── server.ts             # Worker entry point
│   │   │   ├── router.tsx
│   │   │   └── routeTree.gen.ts
│   │   ├── drizzle/
│   │   │   └── migrations/           # D1 migrations
│   │   ├── vite.config.ts
│   │   ├── wrangler.jsonc
│   │   └── package.json
│   │
│   └── game-server/                  # Standalone DO-only worker (optional split)
│       └── (future: extract DO to separate worker if needed)
│
├── packages/
│   ├── game-core/                    # Shared game logic (pure TS, no React/CF)
│   │   ├── src/
│   │   │   ├── hex.ts               # Axial/cube math, neighbor lookup, line generation
│   │   │   ├── board.ts             # Board state, cell access, validity checks
│   │   │   ├── win-checker.ts       # 6-in-a-row detection along 3 axes
│   │   │   ├── turn-manager.ts      # Turn state machine (1-piece / 2-piece)
│   │   │   ├── elo.ts               # ELO calculation, rating tiers
│   │   │   ├── matchmaking.ts       # Queue logic, ELO-range matching
│   │   │   ├── lessons.ts           # Lesson definitions, puzzle validation
│   │   │   ├── types.ts             # Shared types (GameState, Player, Move, etc.)
│   │   │   └── index.ts             # Barrel export
│   │   ├── tests/
│   │   │   ├── hex.test.ts
│   │   │   ├── win-checker.test.ts
│   │   │   ├── turn-manager.test.ts
│   │   │   ├── elo.test.ts
│   │   │   └── lessons.test.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── db/                           # Drizzle schemas for D1
│   │   ├── src/
│   │   │   ├── schema.ts            # Users, matches, lessons, ratings tables
│   │   │   ├── do-schema.ts         # DO-local game state schema
│   │   │   └── index.ts             # getDb() helper
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui/                           # Shared React components
│       ├── src/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Modal.tsx
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## 4. Database Design

### D1 Schema (shared, `packages/db/src/schema.ts`)

```sql
-- Users & Auth
users {
  id            TEXT PRIMARY KEY,         -- BetterAuth user ID
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
}

-- ELO Ratings (separate table for extensibility to multiple game modes)
ratings {
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL REFERENCES users(id),
  game_mode     TEXT NOT NULL DEFAULT 'standard',  -- 'standard', 'ranked', 'blitz'
  elo           INTEGER NOT NULL DEFAULT 1200,
  peak_elo      INTEGER NOT NULL DEFAULT 1200,
  games_played  INTEGER NOT NULL DEFAULT 0,
  wins          INTEGER NOT NULL DEFAULT 0,
  losses        INTEGER NOT NULL DEFAULT 0,
  draws         INTEGER NOT NULL DEFAULT 0,
  streak        INTEGER NOT NULL DEFAULT 0,         -- positive = win streak, negative = loss
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, game_mode)
}

-- Match History
matches {
  id            TEXT PRIMARY KEY,         -- UUID
  player_x_id   TEXT NOT NULL REFERENCES users(id),
  player_o_id   TEXT NOT NULL REFERENCES users(id),
  winner_id     TEXT REFERENCES users(id),  -- NULL = draw
  win_reason    TEXT,                      -- 'six_in_row', 'timeout', 'resignation', 'draw'
  move_count    INTEGER NOT NULL,
  duration_sec  INTEGER NOT NULL,
  board_radius  INTEGER NOT NULL DEFAULT 20,
  elo_x_before  INTEGER NOT NULL,
  elo_o_before  INTEGER NOT NULL,
  elo_x_after   INTEGER NOT NULL,
  elo_o_after   INTEGER NOT NULL,
  started_at    INTEGER NOT NULL,
  ended_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  -- Reconstructed board state stored in DO, final snapshot in D1 for history
  final_board   TEXT                       -- JSON snapshot of final board state
}

-- Match Moves (for replay)
match_moves {
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id      TEXT NOT NULL REFERENCES matches(id),
  move_index    INTEGER NOT NULL,          -- 0-based sequential
  player_id     TEXT NOT NULL,
  q             INTEGER NOT NULL,
  r             INTEGER NOT NULL,
  timestamp     INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(match_id, move_index)
}

-- Lessons System
lessons {
  id            TEXT PRIMARY KEY,         -- slug, e.g., 'hex-basics-1'
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT NOT NULL,            -- 'basics', 'tactics', 'strategy', 'endgame', 'puzzles'
  difficulty    INTEGER NOT NULL,         -- 1-10
  order_index   INTEGER NOT NULL,         -- display order within category
  content       TEXT NOT NULL,            -- JSON: { slides: [...], puzzle: {...} }
  xp_reward     INTEGER NOT NULL DEFAULT 10,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
}

-- User Lesson Progress
lesson_progress {
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL REFERENCES users(id),
  lesson_id     TEXT NOT NULL REFERENCES lessons(id),
  status        TEXT NOT NULL DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
  score         INTEGER,                  -- puzzle score (0-100)
  attempts      INTEGER NOT NULL DEFAULT 0,
  completed_at  INTEGER,
  UNIQUE(user_id, lesson_id)
}

-- Matchmaking Queue (managed by a dedicated Durable Object)
-- Stored in DO SQLite, not D1, for atomicity
```

### Durable Object SQLite Schema (`packages/db/src/do-schema.ts`)

```sql
-- Game Session State (per-game DO)
game_state {
  id            INTEGER PRIMARY KEY DEFAULT 1,  -- singleton row
  status        TEXT NOT NULL DEFAULT 'waiting',  -- 'waiting', 'active', 'finished', 'abandoned'
  player_x_id   TEXT,
  player_o_id   TEXT,
  current_turn  TEXT NOT NULL DEFAULT 'X',       -- 'X' or 'O'
  pieces_placed_this_turn INTEGER NOT NULL DEFAULT 0,  -- 0 or 1 (for 2-piece turns)
  move_count    INTEGER NOT NULL DEFAULT 0,
  winner        TEXT,                              -- 'X', 'O', or NULL
  win_reason    TEXT,
  started_at    INTEGER,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
}

-- Board Cells (sparse storage — only occupied cells)
cells {
  q             INTEGER NOT NULL,
  r             INTEGER NOT NULL,
  player        TEXT NOT NULL,             -- 'X' or 'O'
  placed_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  move_index    INTEGER NOT NULL,
  PRIMARY KEY (q, r)
}

-- Move History (for replay within the DO)
moves {
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  player        TEXT NOT NULL,
  q             INTEGER NOT NULL,
  r             INTEGER NOT NULL,
  move_index    INTEGER NOT NULL,
  timestamp     INTEGER NOT NULL DEFAULT (unixepoch())
}
```

### Matchmaking Queue DO Schema

```sql
queue_entry {
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL UNIQUE,
  elo           INTEGER NOT NULL,
  game_mode     TEXT NOT NULL DEFAULT 'standard',
  enqueued_at   INTEGER NOT NULL DEFAULT (unixepoch())
}
```

## 5. Hexagonal Grid Mathematics

### Coordinate System

**Axial coordinates (q, r)** — two axes at 120°. Derived cube coordinate s = -q - r.

```
        +r
         \
    -q ----●---- +q
           /
         -r
```

### Key Operations (in `packages/game-core/src/hex.ts`)

| Operation | Formula |
|-----------|---------|
| Cube from axial | `(q, r, -q-r)` |
| Distance | `(abs(q1-q2) + abs(r1-r2) + abs(s1-s2)) / 2` |
| Valid cell? | `abs(q) <= R && abs(r) <= R && abs(-q-r) <= R` |
| Neighbors | 6 directions: `(+1,0), (+1,-1), (0,-1), (-1,0), (-1,+1), (0,+1)` |
| Axial to pixel | `x = size * (3/2 * q)`, `y = size * (sqrt(3)/2 * q + sqrt(3) * r)` |
| Pixel to axial | Inverse matrix, then round to nearest hex |

### Win Detection Algorithm (`win-checker.ts`)

For each newly placed piece at (q, r):
1. For each of the **3 axes** (q-direction, r-direction, s-direction):
   - Walk in the positive direction, counting consecutive same-player pieces
   - Walk in the negative direction, counting consecutive same-player pieces
   - Total = positive + negative + 1 (the placed piece itself)
   - If total >= 6 → **win**
2. This is O(1) per move (max 2 × R × 3 = 120 cell checks for R=20)

### Line Generation (for lesson puzzles)

Generate all possible lines of length 6 on the board:
- For each cell, for each of 3 directions, check if 6 consecutive cells exist within bounds
- Store as arrays of (q, r) tuples for rendering highlights

## 6. Rendering Architecture

### Why Canvas (not SVG/DOM)

With 1,261 cells, SVG performance degrades on pan/zoom. Canvas provides:
- Constant-time rendering regardless of board size (only draw visible cells)
- Smooth 60fps pan/zoom via hardware-accelerated 2D context
- Direct pixel manipulation for hover effects and animations

### Viewport System (`useCanvasViewport.ts`)

```
Camera State:
  - centerQ, centerR: which hex cell is at screen center
  - zoom: pixels per hex unit (default ~30px)
  - isDragging: pan state

Visible Range:
  - Convert screen corners to axial coords
  - Iterate only cells within visible range + 1 cell margin
  - Draw order: background → grid lines → pieces → hover highlight → selection
```

### Canvas Renderer (`canvas-renderer.ts`)

```typescript
interface RenderState {
  cells: Map<string, Player>     // "q,r" → 'X' | 'O'
  viewport: ViewportState
  hoverCell: AxialCoord | null
  lastMove: AxialCoord | null
  winLine: AxialCoord[] | null   // highlighted winning cells
  currentPlayer: Player
  piecesRemaining: number        // pieces left to place this turn
}

function render(ctx: CanvasRenderingContext2D, state: RenderState): void
```

- **Grid**: faint hex outlines for visible cells only
- **Pieces**: filled circles (X = cyan, O = amber) with subtle glow
- **Hover**: semi-transparent preview of piece placement
- **Win line**: pulsing highlight animation on the 6 winning cells
- **Last move**: small dot indicator

## 7. Real-Time Communication

### WebSocket Protocol

**Client → Server (Durable Object):**
```typescript
// Place a piece
{ type: 'place', q: number, r: number }

// Resign
{ type: 'resign' }

// Offer draw
{ type: 'draw_offer' }

// Accept/decline draw
{ type: 'draw_response', accept: boolean }

// Heartbeat
{ type: 'ping' }
```

**Server → Client:**
```typescript
// Full state sync (on connect)
{ type: 'sync', state: GameState }

// Move made (by either player)
{ type: 'move', q: number, r: number, player: Player, moveIndex: number }

// Turn change
{ type: 'turn_change', currentTurn: Player, piecesRemaining: number }

// Game over
{ type: 'game_over', winner: Player | null, reason: string, eloChange?: { x: number, o: number } }

// Error (invalid move, not your turn, etc.)
{ type: 'error', message: string }

// Opponent connected/disconnected
{ type: 'opponent_status', connected: boolean }

// Draw offer received
{ type: 'draw_offered' }

// Pong
{ type: 'pong' }
```

### Connection Flow

1. Client navigates to `/game/:id`
2. Route loader calls `getGameInfo` server fn → returns game status, player IDs
3. `useGameState` hook opens WebSocket to `/game/:id/ws`
4. Server intercepts upgrade in `server.ts`, routes to correct DO
5. DO `fetch()` accepts WebSocket, sends `sync` message with full state
6. Game proceeds via `place` messages, DO validates and broadcasts `move`
7. On game end, DO persists result to D1, broadcasts `game_over`

## 8. ELO Rating System

### Calculation (`packages/game-core/src/elo.ts`)

Standard ELO formula:
```
E_A = 1 / (1 + 10^((R_B - R_A) / 400))
R'_A = R_A + K × (S_A - E_A)
```

**K-factor tiers:**
| Games Played | K-factor | Rationale |
|---|---|---|
| 0–10 | 40 | New players converge quickly |
| 11–30 | 32 | Still settling |
| 31+ | 24 | Established rating, slow changes |

**Rating tiers (display):**
| ELO Range | Tier | Badge |
|---|---|---|
| 0–799 | Bronze | 🟫 |
| 800–1199 | Silver | ⬜ |
| 1200–1599 | Gold | 🟨 |
| 1600–1999 | Platinum | 🩶 |
| 2000–2399 | Diamond | 💎 |
| 2400+ | Grandmaster | 👑 |

### Anti-Abuse
- Minimum 5 moves before resignation counts for ELO (prevents instant-quit farming)
- Abandoned games (disconnect > 60s) count as resignation
- New accounts have provisional rating (K=40) for first 10 games

## 9. Matchmaking System

### Architecture

A dedicated **MatchmakingQueue Durable Object** (singleton via `getByName('matchmaking-queue')`) manages the queue atomically.

### Flow

1. Player clicks "Play" → client calls `joinQueue` server fn
2. Server fn calls `env.MATCHMAKING_QUEUE.join(userId, elo, gameMode)`
3. DO adds player to queue, attempts matching:
   - Sort queue by ELO
   - For each player, find closest opponent within **±200 ELO** range
   - If match found: create game DO, assign player X (lower ELO or first in queue), player O
   - Notify both players via D1-polling or push notification
4. Client polls `checkQueueStatus` server fn every 2s (or use Durable Object Alarm for push)
5. When matched, client redirects to `/game/:id`

### Queue State (in Matchmaking DO SQLite)

```sql
queue_entries {
  user_id       TEXT PRIMARY KEY,
  elo           INTEGER NOT NULL,
  game_mode     TEXT NOT NULL,
  enqueued_at   INTEGER NOT NULL
}
```

### Matching Algorithm

```
for each player P in queue (sorted by elo):
  for each player Q below P:
    if |P.elo - Q.elo| <= threshold:
      createGame(P, Q)
      remove P, Q from queue
      break
  if wait_time(P) > 30s:
    threshold += 100   // widen search range
  if wait_time(P) > 120s:
    threshold = ∞      // match with anyone
```

## 10. Lessons System

### Structure (Chess.com-style)

**Categories:**
1. **Basics** — How hex grids work, coordinate system, placing pieces
2. **Tactics** — Forcing moves, forks (threatening two lines simultaneously), blocking
3. **Strategy** — Center control, piece connectivity, tempo (2-piece turns)
4. **Endgame** — Closing out won positions, defensive play when behind
5. **Puzzles** — "Find the winning move" interactive challenges

### Lesson Content Format

```typescript
interface Lesson {
  id: string
  title: string
  category: 'basics' | 'tactics' | 'strategy' | 'endgame' | 'puzzles'
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  slides: Slide[]
  puzzle?: Puzzle
  xpReward: number
}

type Slide =
  | { type: 'text'; content: string }
  | { type: 'board'; cells: CellState[]; highlight?: AxialCoord[]; annotation?: string }
  | { type: 'interactive'; cells: CellState[]; prompt: string; expectedMove: AxialCoord }

interface Puzzle {
  board: CellState[]        // starting position
  playerToMove: Player
  solution: AxialCoord[]    // sequence of winning moves
  hints: string[]           // progressive hints
  timeLimit?: number        // seconds, for timed puzzles
}
```

### Progress Tracking

- Each lesson has `status`: not_started → in_progress → completed
- Puzzles scored 0–100 based on: correct solution, number of hints used, time taken
- XP earned on completion contributes to a player's "lesson level"
- Leaderboard for lesson completion speed and puzzle accuracy

### Lesson UI

- **Catalog page** (`/lessons`): grid of lesson cards grouped by category, showing difficulty stars and completion status
- **Lesson page** (`/lessons/:id`): slide-based presentation with interactive board, "Next"/"Previous" navigation
- **Puzzle mode**: interactive board where player clicks to place pieces, with "Submit" and "Hint" buttons

## 11. Authentication

### BetterAuth Integration

- Email/password + OAuth (Google, GitHub) via BetterAuth
- Session stored in D1 `sessions` table (BetterAuth managed)
- Auth middleware on protected routes (profile, play, lessons)
- Guest play allowed (no ELO tracking, no history)

### Route Protection

```typescript
// In route loaders
const user = await getAuthUser()  // server fn
if (!user) throw redirect({ to: '/login' })
```

## 12. Data Flow Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React)                           │
│                                                                  │
│  HexCanvas ──► canvas-renderer.ts (pure draw calls)              │
│  useGameState ──► WebSocket ──► Game DO                          │
│  useCanvasViewport ──► pan/zoom state (local only)               │
│  Route Loaders ──► createServerFn ──► D1 (history, profile)      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Cloudflare Worker (server.ts)                  │
│                                                                  │
│  WebSocket upgrade: /game/:id/ws ──► Game DO fetch()             │
│  Server functions ──► DO RPC (placeMove, resign, etc.)           │
│  Matchmaking ──► MatchmakingQueue DO                             │
│  Auth ──► BetterAuth ──► D1                                      │
└──────────┬──────────────────┬────────────────────────────────────┘
           │                  │
           ▼                  ▼
┌─────────────────┐  ┌──────────────────────────────────────────┐
│   D1 Database   │  │         Durable Objects                   │
│                 │  │                                            │
│  users          │  │  GameSession DO (one per active game)     │
│  ratings        │  │    ├── game_state (status, turn, winner)  │
│  matches        │  │    ├── cells (sparse board)               │
│  match_moves    │  │    ├── moves (history)                    │
│  lessons        │  │    ├── WebSocket connections              │
│  lesson_progress│  │    └── RPC methods                        │
│                 │  │                                            │
│                 │  │  MatchmakingQueue DO (singleton)           │
│                 │  │    ├── queue_entries                       │
│                 │  │    └── matching algorithm                  │
└─────────────────┘  └──────────────────────────────────────────┘
```

## 13. Performance Considerations

### Board Rendering
- **Viewport culling**: only iterate cells visible on screen (~50-100 cells at typical zoom)
- **Offscreen canvas**: pre-render static grid lines to an offscreen canvas, blit on pan
- **requestAnimationFrame**: batch all draw calls, skip frames when idle
- **Debounced resize**: recalculate viewport on window resize with 100ms debounce

### WebSocket
- **Hibernation API**: DO hibernates between messages, no idle CPU cost
- **Binary encoding**: consider MessagePack for board state sync (1,261 cells × ~10 bytes = ~12KB as JSON, ~4KB as binary)
- **Delta updates**: send only the new piece placement, not full board state

### Database
- **D1**: batch writes at game end (match record + all moves + rating updates in one transaction)
- **DO SQLite**: cells table uses composite primary key (q, r) for O(1) lookups
- **Indexes**: `matches(player_x_id, ended_at)`, `matches(player_o_id, ended_at)`, `ratings(user_id, game_mode)`

## 14. Deployment

### Cloudflare Resources
- **Worker**: hosts TanStack Start SSR + WebSocket routing
- **Durable Objects**: GameSession (auto-scaled per game), MatchmakingQueue (singleton)
- **D1 Database**: single database for all persistent data
- **KV** (optional): cache lesson content, leaderboard snapshots

### Environments
- **Local**: `pnpm dev` — miniflare for DO/D1 emulation
- **Staging**: `pnpm deploy` to a staging worker with separate D1 database
- **Production**: `pnpm deploy` with production D1 database ID

### CI/CD
- GitHub Actions: type-check → test → build → deploy
- D1 migrations applied via `wrangler d1 migrations apply DB --remote` before deploy
- DO migrations auto-applied on first request after deploy (via `blockConcurrencyWhile`)

## 15. Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | TanStack Start (React 19) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 |
| Rendering | HTML Canvas 2D |
| Real-time | WebSocket Hibernation API |
| Server state | Durable Objects (per-game + matchmaking) |
| Persistent storage | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| Auth | BetterAuth |
| Language | TypeScript (strict mode) |
| Build | Vite + @cloudflare/vite-plugin |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest + @cloudflare/vitest-pool-workers |
| Deployment | Cloudflare Workers |