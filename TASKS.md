# Hexagonal Tic-Tac-Toe: Implementation Tasks

## Phase 1: Monorepo Restructure & Infrastructure

### 1.1 Convert to Turborepo Monorepo
- [ ] Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*`
- [ ] Create `turbo.json` with pipeline config (build, dev, test, lint)
- [ ] Move existing template code into `apps/web/`
- [ ] Update root `package.json` to workspace root (remove deps, add workspaces)
- [ ] Verify `pnpm dev` still works after restructure

### 1.2 Create Shared Packages
- [ ] Create `packages/game-core/` with `package.json`, `tsconfig.json`, `src/index.ts`
- [ ] Create `packages/db/` with `package.json`, `tsconfig.json`, `src/index.ts`
- [ ] Create `packages/ui/` with `package.json`, `tsconfig.json`, `src/index.ts`
- [ ] Add inter-package dependencies (`apps/web` depends on all three)
- [ ] Configure path aliases: `@hex/game-core`, `@hex/db`, `@hex/ui`
- [ ] Verify `pnpm build` builds all packages in correct order

### 1.3 Cloudflare Configuration
- [ ] Update `wrangler.jsonc`: rename DO binding to `GAME_SESSION`, add `MATCHMAKING_QUEUE` DO
- [ ] Update D1 database name/ID placeholders
- [ ] Create D1 database via `wrangler d1 create hex-tic-tac-toe-db`
- [ ] Update `worker-configuration.d.ts` via `pnpm cf-typegen`
- [ ] Verify `pnpm dev` boots with new bindings

---

## Phase 2: Game Core Logic (`packages/game-core`)

### 2.1 Hex Math (`src/hex.ts`)
- [ ] Define `AxialCoord` type: `{ q: number; r: number }`
- [ ] Define `CubeCoord` type: `{ q: number; r: number; s: number }`
- [ ] Implement `axialToCube(coord: AxialCoord): CubeCoord`
- [ ] Implement `cubeToAxial(coord: CubeCoord): AxialCoord`
- [ ] Implement `hexDistance(a: AxialCoord, b: AxialCoord): number`
- [ ] Implement `isValidCell(coord: AxialCoord, radius: number): boolean`
- [ ] Implement `getNeighbors(coord: AxialCoord): AxialCoord[]` (6 directions)
- [ ] Implement `getLine(start: AxialCoord, direction: number, length: number): AxialCoord[]`
- [ ] Implement `axialToKey(coord: AxialCoord): string` (for Map keys: `"q,r"`)
- [ ] Implement `keyToAxial(key: string): AxialCoord`
- [ ] Define `HEX_DIRECTIONS` constant array (6 direction vectors)
- [ ] Define `BOARD_RADIUS = 20` and `BOARD_CELL_COUNT = 1261` constants
- [ ] Write tests in `tests/hex.test.ts` — distance, neighbors, validity, line generation

### 2.2 Board State (`src/board.ts`)
- [ ] Define `Board` type: `Map<string, Player>` (sparse — only occupied cells)
- [ ] Implement `createBoard(): Board`
- [ ] Implement `getCell(board: Board, coord: AxialCoord): Player | null`
- [ ] Implement `setCell(board: Board, coord: AxialCoord, player: Player): Board` (immutable — returns new map)
- [ ] Implement `removeCell(board: Board, coord: AxialCoord): Board`
- [ ] Implement `isCellEmpty(board: Board, coord: AxialCoord): boolean`
- [ ] Implement `countPieces(board: Board): number`
- [ ] Implement `countPlayerPieces(board: Board, player: Player): number`
- [ ] Implement `isBoardFull(board: Board, radius: number): boolean`
- [ ] Implement `getOccupiedCells(board: Board): { coord: AxialCoord; player: Player }[]`
- [ ] Write tests in `tests/board.test.ts`

### 2.3 Win Detection (`src/win-checker.ts`)
- [ ] Implement `checkWinFromCell(board: Board, coord: AxialCoord, player: Player, winLength: number): AxialCoord[] | null`
  - For each of 3 axes (q+, r+, s+), walk positive and negative directions
  - Count consecutive same-player pieces in both directions
  - If total >= winLength, return array of winning cell coordinates
  - Otherwise return null
- [ ] Implement `checkAnyWin(board: Board, winLength: number): { player: Player; line: AxialCoord[] } | null`
  - Only checks cells adjacent to most recent move for efficiency
- [ ] Implement `getWinLines(board: Board, coord: AxialCoord, winLength: number): AxialCoord[][]`
  - Returns ALL lines of winLength through a cell (for lesson highlighting)
- [ ] Write tests in `tests/win-checker.test.ts`:
  - 6 in a row on q-axis
  - 6 in a row on r-axis
  - 6 in a row on s-axis (diagonal)
  - 5 in a row (not a win)
  - 6 with gap (not a win)
  - Win detected on first piece of 2-piece turn
  - Multiple simultaneous wins (edge case)

### 2.4 Turn Manager (`src/turn-manager.ts`)
- [ ] Define `TurnState` type:
  ```typescript
  interface TurnState {
    currentTurn: 'X' | 'O'
    piecesPlacedThisTurn: number  // 0 or 1
    moveCount: number             // total pieces placed
    isFirstTurn: boolean          // X's opening move (1 piece only)
  }
  ```
- [ ] Implement `createTurnState(): TurnState` (initial state: X's turn, 0 placed, first turn)
- [ ] Implement `canPlacePiece(state: TurnState): boolean`
- [ ] Implement `placePiece(state: TurnState): TurnState` (returns new state after placing)
- [ ] Implement `getPiecesRemaining(state: TurnState): number`
- [ ] Implement `getCurrentPlayer(state: TurnState): Player`
- [ ] Turn transition logic:
  - Move 0: X places 1 piece → turn goes to O
  - Move 1-2: O places 2 pieces → turn goes to X
  - Move 3-4: X places 2 pieces → turn goes to O
  - Move N: alternate 2-piece turns
- [ ] Write tests in `tests/turn-manager.test.ts`:
  - Initial state: X's turn, 1 piece to place
  - After X places: O's turn, 2 pieces to place
  - After O places 1: O still has 1 more
  - After O places 2: X's turn, 2 pieces to place
  - Verify moveCount increments correctly

### 2.5 Types (`src/types.ts`)
- [ ] Define `Player = 'X' | 'O'`
- [ ] Define `GameStatus = 'waiting' | 'active' | 'finished' | 'abandoned'`
- [ ] Define `WinReason = 'six_in_row' | 'resignation' | 'timeout' | 'draw'`
- [ ] Define `GameState` (full game state for WebSocket sync)
- [ ] Define `Move` (single piece placement with metadata)
- [ ] Define `GameInfo` (public game metadata for lobby/history)
- [ ] Define WebSocket message types (client→server and server→client)
- [ ] Define `Lesson`, `Slide`, `Puzzle` types for lessons system
- [ ] Barrel export all types from `src/index.ts`

### 2.6 ELO System (`src/elo.ts`)
- [ ] Implement `calculateExpectedScore(ratingA: number, ratingB: number): number`
- [ ] Implement `calculateNewRating(currentRating: number, expectedScore: number, actualScore: number, kFactor: number): number`
- [ ] Implement `getKFactor(gamesPlayed: number): number` (40/32/24 tiers)
- [ ] Implement `calculateRatingChange(playerElo: number, opponentElo: number, result: 0 | 0.5 | 1, gamesPlayed: number): { newRating: number; change: number }`
- [ ] Implement `getRatingTier(elo: number): RatingTier` (Bronze through Grandmaster)
- [ ] Define `RatingTier` type with name, minElo, color, badge
- [ ] Write tests in `tests/elo.test.ts`:
  - Equal ratings, win → +K/2
  - Higher rated player wins → small gain
  - Lower rated player wins → large gain
  - K-factor tiers
  - Rating tier boundaries

### 2.7 Matchmaking Logic (`src/matchmaking.ts`)
- [ ] Implement `shouldMatch(eloA: number, eloB: number, waitTimeSeconds: number): boolean`
  - Base threshold: ±200 ELO
  - After 30s: ±300
  - After 60s: ±500
  - After 120s: match with anyone
- [ ] Implement `findBestMatch(playerElo: number, queue: QueueEntry[]): QueueEntry | null`
- [ ] Define `QueueEntry` type
- [ ] Write tests in `tests/matchmaking.test.ts`

### 2.8 Lessons Logic (`src/lessons.ts`)
- [ ] Implement `validatePuzzleMove(puzzle: Puzzle, move: AxialCoord): boolean`
- [ ] Implement `calculatePuzzleScore(puzzle: Puzzle, hintsUsed: number, timeSeconds: number): number`
- [ ] Define `DEFAULT_LESSONS` constant array with at least 5 seed lessons:
  - Basics 1: "Your First Move" (place a piece in center)
  - Basics 2: "The Hex Grid" (understanding the 3 axes)
  - Tactics 1: "The Fork" (threaten two lines at once)
  - Strategy 1: "Center Control" (why center matters)
  - Puzzle 1: "Find the Win" (6-in-a-row puzzle)
- [ ] Write tests in `tests/lessons.test.ts`

---

## Phase 3: Database Schema (`packages/db`)

### 3.1 D1 Schema (`src/schema.ts`)
- [ ] Define `users` table (id, username, email, avatar_url, created_at, updated_at)
- [ ] Define `ratings` table (user_id, game_mode, elo, peak_elo, games_played, wins, losses, draws, streak, updated_at)
- [ ] Define `matches` table (id, player_x_id, player_o_id, winner_id, win_reason, move_count, duration_sec, board_radius, elo_x_before/o_before/after, started_at, ended_at, final_board)
- [ ] Define `match_moves` table (match_id, move_index, player_id, q, r, timestamp)
- [ ] Define `lessons` table (id, title, description, category, difficulty, order_index, content JSON, xp_reward, created_at)
- [ ] Define `lesson_progress` table (user_id, lesson_id, status, score, attempts, completed_at)
- [ ] Add proper indexes and foreign keys
- [ ] Export all tables from barrel `src/index.ts`

### 3.2 DO SQLite Schema (`src/do-schema.ts`)
- [ ] Define `game_state` table (singleton: status, player_x_id, player_o_id, current_turn, pieces_placed_this_turn, move_count, winner, win_reason, started_at, updated_at)
- [ ] Define `cells` table (q, r, player, placed_at, move_index — composite PK on q+r)
- [ ] Define `moves` table (id PK autoincrement, player, q, r, move_index, timestamp)
- [ ] Export all tables

### 3.3 Database Helper (`src/index.ts`)
- [ ] Implement `getDb()` — returns Drizzle instance bound to `env.DB`
- [ ] Re-export all schemas

### 3.4 Generate & Apply Migrations
- [ ] Run `pnpm db:generate` to create initial D1 migration
- [ ] Run `pnpm db:generate:do` to create initial DO migration
- [ ] Run `pnpm db:migrate --local` to apply D1 migration locally
- [ ] Verify DO migration auto-applies on first DO construction

---

## Phase 4: Durable Objects (`apps/web/src`)

### 4.1 GameSession DO (`durable-object.ts`)
- [ ] Rename `MyDurableObject` → `GameSession`
- [ ] Implement constructor: super call, drizzle init, run DO migrations in `blockConcurrencyWhile`
- [ ] Implement `createGame(playerXId: string, playerOId: string): Promise<string>` — initializes game state, returns game ID
- [ ] Implement `joinGame(playerId: string): Promise<GameState>` — validates player, returns full state
- [ ] Implement `placeMove(playerId: string, q: number, r: number): Promise<MoveResult>`:
  - Validate: game is active, it's this player's turn, cell is empty, cell is valid
  - Apply move to cells table
  - Update game_state (turn, pieces_placed, move_count)
  - Check win condition (via game-core)
  - If win: update game_state to finished, persist to D1, calculate ELO changes
  - Broadcast move + state to all connected WebSockets
  - Return result
- [ ] Implement `resign(playerId: string): Promise<void>` — set winner to opponent, persist
- [ ] Implement `offerDraw(playerId: string): Promise<void>` — notify opponent
- [ ] Implement `respondDraw(playerId: string, accept: boolean): Promise<void>`
- [ ] Implement `getGameState(): Promise<GameState>` — RPC method for server functions
- [ ] Implement `fetch(request: Request)` — WebSocket upgrade handler
- [ ] Implement `webSocketMessage(ws, message)` — parse and route client messages
- [ ] Implement `webSocketClose(ws, code, reason)` — handle disconnect, start abandonment timer
- [ ] Implement private `_broadcast(message: WSMessage)` — send to all connected clients
- [ ] Implement private `_persistToD1()` — write final match record + moves to D1
- [ ] Implement private `_calculateAndPersistElo()` — update ratings in D1
- [ ] Update `wrangler.jsonc` class name to `GameSession`

### 4.2 MatchmakingQueue DO
- [ ] Create `matchmaking-queue.ts` with `MatchmakingQueue` class extending `DurableObject`
- [ ] Implement DO SQLite schema for queue entries (in `do-schema.ts`)
- [ ] Implement `joinQueue(userId: string, elo: number, gameMode: string): Promise<void>`
- [ ] Implement `leaveQueue(userId: string): Promise<void>`
- [ ] Implement `checkStatus(userId: string): Promise<{ status: 'waiting' | 'matched'; gameId?: string }>`
- [ ] Implement private `_tryMatch()` — runs matching algorithm, creates game DO on match
- [ ] Implement `webSocketMessage` for real-time queue updates (optional — can also poll)
- [ ] Export from `server.ts`
- [ ] Update `wrangler.jsonc` to include `MatchmakingQueue` in DO bindings and SQLite migrations

### 4.3 Worker Entry Point (`server.ts`)
- [ ] Update WebSocket pattern: `/game/:id/ws` → route to `GAME_SESSION.getByName(id)`
- [ ] Add pattern: `/matchmaking/ws` → route to `MATCHMAKING_QUEUE.getByName('queue')`
- [ ] Keep TanStack handler as fallback for all other requests
- [ ] Export both DO classes

---

## Phase 5: Server Functions & Routes (`apps/web/src`)

### 5.1 Game Server Functions
- [ ] `createGame` — creates a new game DO, returns game ID
- [ ] `getGameInfo(id: string)` — returns game metadata (players, status, ELOs)
- [ ] `joinGame(id: string, playerId: string)` — joins existing game
- [ ] `getGameHistory(userId: string, page: number)` — queries D1 matches table
- [ ] `getReplay(matchId: string)` — queries D1 match_moves, returns move list

### 5.2 Matchmaking Server Functions
- [ ] `joinQueue(gameMode: string)` — calls matchmaking DO `joinQueue`
- [ ] `leaveQueue()` — calls matchmaking DO `leaveQueue`
- [ ] `checkQueueStatus()` — calls matchmaking DO `checkStatus`

### 5.3 Profile & Leaderboard Server Functions
- [ ] `getProfile(username: string)` — queries D1 users + ratings
- [ ] `getLeaderboard(gameMode: string, page: number)` — queries D1 ratings sorted by elo
- [ ] `getUserRating(userId: string, gameMode: string)` — single user's rating

### 5.4 Lessons Server Functions
- [ ] `getLessons(category?: string)` — queries D1 lessons table
- [ ] `getLesson(id: string)` — single lesson with content
- [ ] `getLessonProgress(userId: string)` — queries D1 lesson_progress
- [ ] `completeLesson(lessonId: string, score: number)` — upserts lesson_progress

### 5.5 Routes
- [ ] `__root.tsx` — update title, meta, header links
- [ ] `index.tsx` — landing page with "Play" button, leaderboard preview, featured lessons
- [ ] `game/$id.tsx` — game page with HexCanvas, GameHUD, WebSocket connection
- [ ] `lessons/index.tsx` — lesson catalog grid grouped by category
- [ ] `lessons/$id.tsx` — lesson viewer with slide navigation and puzzle board
- [ ] `leaderboard.tsx` — paginated leaderboard with ELO tiers
- [ ] `profile/$username.tsx` — user profile with rating, match history, lesson progress
- [ ] Remove `counter/` and `demo/` route directories

---

## Phase 6: Frontend Components & Rendering

### 6.1 Hex-to-Pixel Math (`src/lib/hex-to-pixel.ts`)
- [ ] Implement `axialToPixel(coord: AxialCoord, hexSize: number): { x: number; y: number }`
  - `x = hexSize * (3/2 * q)`
  - `y = hexSize * (sqrt(3)/2 * q + sqrt(3) * r)`
- [ ] Implement `pixelToAxial(point: { x: number; y: number }, hexSize: number): AxialCoord`
  - Inverse transform + hex rounding
- [ ] Implement `hexCorners(center: { x: number; y: number }, hexSize: number): { x: number; y: number }[]`
  - 6 corner points for drawing hex outlines
- [ ] Write tests for roundtrip accuracy

### 6.2 Canvas Viewport Hook (`src/hooks/useCanvasViewport.ts`)
- [ ] State: `{ centerX, centerY, zoom, isDragging, dragStart }`
- [ ] Implement `pan(dx: number, dy: number)` — translate camera
- [ ] Implement `zoomAt(screenX: number, screenY: number, delta: number)` — zoom centered on cursor
- [ ] Implement `resetView()` — center on origin, default zoom
- [ ] Implement `screenToHex(screenX: number, screenY: number): AxialCoord` — for click/hover detection
- [ ] Implement `getVisibleRange(): { minQ, maxQ, minR, maxR }` — for viewport culling
- [ ] Mouse event handlers: `onMouseDown`, `onMouseMove`, `onMouseUp`, `onWheel`
- [ ] Touch event handlers: single-finger pan, pinch-to-zoom
- [ ] Return ref + handlers for canvas element

### 6.3 Canvas Renderer (`src/lib/canvas-renderer.ts`)
- [ ] Define `RenderState` interface (cells, viewport, hoverCell, lastMove, winLine, currentPlayer, piecesRemaining)
- [ ] Implement `render(ctx: CanvasRenderingContext2D, state: RenderState): void`
- [ ] Draw background (dark gradient)
- [ ] Draw hex grid outlines (viewport-culled — only visible cells)
- [ ] Draw occupied cells: X = cyan circle, O = amber circle with glow effect
- [ ] Draw hover preview: semi-transparent piece at hovered cell
- [ ] Draw last move indicator: small dot
- [ ] Draw win line: pulsing highlight animation on winning cells
- [ ] Draw coordinate labels at low zoom levels (optional, for debugging)
- [ ] Optimize: pre-render static grid to offscreen canvas, blit on pan

### 6.4 HexCanvas Component (`src/components/HexCanvas.tsx`)
- [ ] Create `<canvas>` element with ref
- [ ] Use `useCanvasViewport` for pan/zoom state
- [ ] Use `useGameState` for board state
- [ ] Call `render()` in `requestAnimationFrame` loop
- [ ] Handle click → convert to hex coord → call `onCellClick`
- [ ] Handle hover → update hover state → re-render
- [ ] Responsive: fill container, handle resize
- [ ] Min/max zoom limits

### 6.5 GameHUD Component (`src/components/GameHUD.tsx`)
- [ ] Player cards (left/right): avatar, username, ELO, rating change indicator
- [ ] Turn indicator: whose turn, pieces remaining this turn
- [ ] Move counter
- [ ] Timer (optional — elapsed time since game start)
- [ ] Action buttons: Resign, Offer Draw
- [ ] Connection status indicator (green/red dot)

### 6.6 useGameState Hook (`src/hooks/useGameState.ts`)
- [ ] Open WebSocket to `/game/:id/ws`
- [ ] Maintain local `GameState` (board, turn, status)
- [ ] On `sync` message: set full state
- [ ] On `move` message: update board, turn state
- [ ] On `game_over` message: update status, show result
- [ ] On `error` message: show toast, revert optimistic update
- [ ] Implement `placePiece(q: number, r: number)`:
  - Optimistic: immediately add piece to local board
  - Send `place` message via WebSocket
  - On error: revert optimistic update
- [ ] Implement `resign()`, `offerDraw()`, `respondDraw(accept)`
- [ ] Track `isConnected` state
- [ ] Cleanup: close WebSocket on unmount

### 6.7 MatchmakingQueue Component (`src/components/MatchmakingQueue.tsx`)
- [ ] "Play" button → calls `joinQueue` server fn
- [ ] Show searching state with animated spinner
- [ ] Show estimated wait time, ELO search range expanding
- [ ] "Cancel" button → calls `leaveQueue` server fn
- [ ] Poll `checkQueueStatus` every 2s, redirect to `/game/:id` on match

### 6.8 Lesson Components
- [ ] `LessonCard.tsx` — card showing lesson title, category, difficulty stars, completion status
- [ ] `LessonViewer.tsx` — slide-based viewer with prev/next, progress bar
- [ ] `PuzzleBoard.tsx` — interactive hex canvas for puzzle mode (limited interaction — only allow solution cells)
- [ ] `SlideText.tsx` — renders text slide content
- [ ] `SlideBoard.tsx` — renders board demonstration with highlights and annotations

### 6.9 Shared UI Components (`packages/ui`)
- [ ] `Button.tsx` — primary/secondary/ghost variants
- [ ] `Card.tsx` — container with border, padding, optional header
- [ ] `Modal.tsx` — overlay dialog
- [ ] `RatingBadge.tsx` — ELO tier badge with color and icon
- [ ] `PlayerAvatar.tsx` — avatar image with fallback initial

---

## Phase 7: Authentication

### 7.1 BetterAuth Setup
- [ ] Install BetterAuth in `apps/web`
- [ ] Configure BetterAuth with D1 adapter
- [ ] Create auth API routes at `/api/auth/*`
- [ ] Configure OAuth providers (Google, GitHub) — or start with email/password only
- [ ] Create `getAuthUser()` server fn that returns current user or null
- [ ] Create auth middleware for protected routes

### 7.2 Auth UI
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] User menu in header (avatar, dropdown with profile/logout)
- [ ] Guest play option (no auth required, no ELO tracking)

---

## Phase 8: Seed Data & Content

### 8.1 Lesson Content
- [ ] Write content for 10+ lessons across all categories
- [ ] Create puzzle positions with solutions
- [ ] Seed into D1 via migration or script

### 8.2 Demo Data (Optional)
- [ ] Create seed script for test users and sample matches
- [ ] Useful for development and demo

---

## Phase 9: Testing

### 9.1 Unit Tests (`packages/game-core/tests/`)
- [ ] `hex.test.ts` — distance, neighbors, validity, coordinate conversion
- [ ] `board.test.ts` — create, get, set, remove, count, full check
- [ ] `win-checker.test.ts` — all 3 axes, edge cases, non-wins
- [ ] `turn-manager.test.ts` — state transitions, piece counts
- [ ] `elo.test.ts` — calculation, K-factors, tiers
- [ ] `matchmaking.test.ts` — matching thresholds
- [ ] `lessons.test.ts` — puzzle validation, scoring
- [ ] Target: 100% coverage on game-core

### 9.2 Integration Tests (`apps/web/test/`)
- [ ] `durable-object.test.ts` — game creation, move placement, win detection, resignation
- [ ] `matchmaking.test.ts` — queue join/leave, matching algorithm
- [ ] Use `@cloudflare/vitest-pool-workers` for DO testing

### 9.3 Run All Tests
- [ ] `pnpm test` passes with 0 failures
- [ ] `pnpm tsc --noEmit` passes with 0 errors

---

## Phase 10: Polish & Deployment

### 10.1 UI Polish
- [ ] Responsive design — works on mobile (touch pan/zoom on canvas)
- [ ] Loading states for all async operations
- [ ] Error boundaries for game and lesson pages
- [ ] Animations: piece placement pop-in, win line pulse, page transitions
- [ ] Sound effects (optional): place piece, win, lose

### 10.2 Performance
- [ ] Verify canvas renders at 60fps during pan/zoom
- [ ] Verify WebSocket latency < 100ms on local
- [ ] Profile D1 queries — add indexes if needed
- [ ] Lazy-load lesson content

### 10.3 Deployment
- [ ] Create D1 database on Cloudflare (production)
- [ ] Update `wrangler.jsonc` with production D1 database ID
- [ ] Run `pnpm db:migrate --remote` to apply migrations
- [ ] Run `pnpm deploy` to deploy worker
- [ ] Verify WebSocket connections work in production
- [ ] Set up custom domain (optional)

### 10.4 CI/CD
- [ ] GitHub Actions workflow: install → type-check → test → build → deploy
- [ ] Separate staging and production environments
- [ ] D1 migration step before deploy

---

## Summary: Dependency Order

```
Phase 1 (Infra) ──► Phase 2 (game-core) ──► Phase 3 (DB schema)
                                              │
                          ┌───────────────────┘
                          ▼
                    Phase 4 (Durable Objects)
                          │
                          ▼
                    Phase 5 (Server Fns + Routes)
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              Phase 6       Phase 7
              (Frontend)    (Auth)
                    │           │
                    └─────┬─────┘
                          ▼
                    Phase 8 (Content)
                          │
                          ▼
                    Phase 9 (Testing)
                          │
                          ▼
                    Phase 10 (Deploy)
```

**Critical path:** game-core must be complete before DOs can be built. DOs must be complete before server functions. Everything else can be partially parallelized.