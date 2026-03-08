import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

/**
 * Stores historical match data after a game concludes on the Durable Object.
 */
export const match = sqliteTable("match", {
  id: text("id").primaryKey(),
  player1Id: text("player1_id")
    .notNull()
    .references(() => user.id),
  player2Id: text("player2_id")
    .notNull()
    .references(() => user.id),
  winnerId: text("winner_id").references(() => user.id),
  status: text("status", { enum: ["FINISHED", "DRAW", "ABANDONED"] }).notNull(),
  finalBoardState: text("final_board_state").notNull(), // JSON string map of q,r to player
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }).notNull(),
});
