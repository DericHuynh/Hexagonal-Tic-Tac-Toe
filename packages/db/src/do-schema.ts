import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Game Session State (singleton row — one per Durable Object instance)
// ---------------------------------------------------------------------------

export const gameState = sqliteTable("game_state", {
  id: integer().primaryKey({ autoIncrement: false }).default(1),
  status: text().notNull().default("waiting"), // 'waiting' | 'active' | 'finished' | 'abandoned'
  playerXId: text("player_x_id"),
  playerOId: text("player_o_id"),
  currentTurn: text("current_turn").notNull().default("X"), // 'X' or 'O'
  piecesPlacedThisTurn: integer("pieces_placed_this_turn").notNull().default(0),
  moveCount: integer("move_count").notNull().default(0),
  winner: text(), // 'X' | 'O' | null
  winReason: text("win_reason"), // 'six_in_row' | 'resignation' | 'timeout' | 'draw'
  winLine: text("win_line"), // JSON array of {q,r} for the winning cells
  startedAt: integer("started_at"),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ---------------------------------------------------------------------------
// Board Cells (sparse storage — only occupied cells)
// Composite primary key on (q, r) for O(1) lookups
// ---------------------------------------------------------------------------

export const cells = sqliteTable("cells", {
  q: integer().notNull(),
  r: integer().notNull(),
  player: text().notNull(), // 'X' or 'O'
  placedAt: integer("placed_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
  moveIndex: integer("move_index").notNull(),
});

// Note: The composite primary key on (q, r) is defined via SQL migration
// since Drizzle's SQLite driver doesn't support composite PKs in schema.
// The migration should include:
//   PRIMARY KEY (q, r)

// ---------------------------------------------------------------------------
// Move History (for replay within the DO)
// ---------------------------------------------------------------------------

export const moves = sqliteTable("moves", {
  id: integer().primaryKey({ autoIncrement: true }),
  player: text().notNull(), // 'X' or 'O'
  q: integer().notNull(),
  r: integer().notNull(),
  moveIndex: integer("move_index").notNull(),
  timestamp: integer()
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});
