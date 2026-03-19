import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Users & Auth
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text().primaryKey(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ---------------------------------------------------------------------------
// ELO Ratings (separate table for extensibility to multiple game modes)
// ---------------------------------------------------------------------------

export const ratings = sqliteTable("ratings", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  gameMode: text("game_mode").notNull().default("standard"),
  elo: integer().notNull().default(1200),
  peakElo: integer("peak_elo").notNull().default(1200),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer().notNull().default(0),
  losses: integer().notNull().default(0),
  draws: integer().notNull().default(0),
  streak: integer().notNull().default(0),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ---------------------------------------------------------------------------
// Match History
// ---------------------------------------------------------------------------

export const matches = sqliteTable("matches", {
  id: text().primaryKey(),
  playerXId: text("player_x_id")
    .notNull()
    .references(() => users.id),
  playerOId: text("player_o_id")
    .notNull()
    .references(() => users.id),
  winnerId: text("winner_id").references(() => users.id),
  winReason: text("win_reason"),
  moveCount: integer("move_count").notNull(),
  durationSec: integer("duration_sec").notNull(),
  boardRadius: integer("board_radius").notNull().default(20),
  eloXBefore: integer("elo_x_before").notNull(),
  eloOBefore: integer("elo_o_before").notNull(),
  eloXAfter: integer("elo_x_after").notNull(),
  eloOAfter: integer("elo_o_after").notNull(),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
  finalBoard: text("final_board"),
});

// ---------------------------------------------------------------------------
// Match Moves (for replay)
// ---------------------------------------------------------------------------

export const matchMoves = sqliteTable("match_moves", {
  id: integer().primaryKey({ autoIncrement: true }),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id),
  moveIndex: integer("move_index").notNull(),
  playerId: text("player_id")
    .notNull()
    .references(() => users.id),
  q: integer().notNull(),
  r: integer().notNull(),
  timestamp: integer()
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ---------------------------------------------------------------------------
// Lessons System
// ---------------------------------------------------------------------------

export const lessons = sqliteTable("lessons", {
  id: text().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  difficulty: integer().notNull(),
  orderIndex: integer("order_index").notNull(),
  content: text().notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ---------------------------------------------------------------------------
// User Lesson Progress
// ---------------------------------------------------------------------------

export const lessonProgress = sqliteTable("lesson_progress", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => lessons.id),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  status: text().notNull().default("not_started"),
  score: integer(),
  attempts: integer().notNull().default(0),
  completedAt: integer("completed_at"),
});

// ---------------------------------------------------------------------------
// Demo: Punk Songs (for testing API routes)
// ---------------------------------------------------------------------------

export const songs = sqliteTable("songs", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  artist: text().notNull(),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Math.floor(Date.now() / 1000)),
});
