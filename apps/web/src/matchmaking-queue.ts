import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { eq, sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { generateGameId, findMatches } from "@hex/game-core";

// Inline schema for matchmaking DO (self-contained)
const queueEntries = sqliteTable("queue_entries", {
  userId: text("user_id").primaryKey(),
  elo: integer().notNull(),
  gameMode: text("game_mode").notNull().default("standard"),
  enqueuedAt: integer("enqueued_at").notNull(),
});

const matchResults = sqliteTable("match_results", {
  userId: text("user_id").primaryKey(),
  gameId: text("game_id").notNull(),
  matchedAt: integer("matched_at").notNull(),
});

export class MatchmakingQueue extends DurableObject<Env> {
  storage: DurableObjectStorage;
  db: DrizzleSqliteDODatabase<any>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.storage = ctx.storage;
    this.db = drizzle(this.storage, { logger: false });

    ctx.blockConcurrencyWhile(async () => {
      // Manual schema init since we can't run the standard migrator here easily
      this.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS queue_entries (
          user_id TEXT PRIMARY KEY,
          elo INTEGER NOT NULL,
          game_mode TEXT NOT NULL DEFAULT 'standard',
          enqueued_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS match_results (
          user_id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          matched_at INTEGER NOT NULL
        );
      `);
    });
  }

  // -------------------------------------------------------------------------
  // RPC Methods
  // -------------------------------------------------------------------------

  async joinQueue(
    userId: string,
    elo: number,
    gameMode: string = "standard",
  ): Promise<{ ok: boolean; gameId?: string }> {
    const now = Math.floor(Date.now() / 1000);

    // Check if already matched
    const existing = await this.db
      .select()
      .from(matchResults)
      .where(eq(matchResults.userId, userId));
    if (existing.length > 0) {
      return { ok: true, gameId: existing[0].gameId };
    }

    // Upsert into queue
    this.storage.sql.exec(
      `INSERT OR REPLACE INTO queue_entries (user_id, elo, game_mode, enqueued_at) VALUES (?, ?, ?, ?)`,
      userId,
      elo,
      gameMode,
      now,
    );

    // Run matching
    await this._runMatch(gameMode);

    // Check if user was matched
    const matched = await this.db
      .select()
      .from(matchResults)
      .where(eq(matchResults.userId, userId));
    if (matched.length > 0) {
      return { ok: true, gameId: matched[0].gameId };
    }

    return { ok: true };
  }

  async checkStatus(userId: string): Promise<{ status: "waiting" | "matched"; gameId?: string }> {
    const matched = await this.db
      .select()
      .from(matchResults)
      .where(eq(matchResults.userId, userId));
    if (matched.length > 0) {
      return { status: "matched", gameId: matched[0].gameId };
    }
    return { status: "waiting" };
  }

  async leaveQueue(userId: string): Promise<void> {
    await this.db.delete(queueEntries).where(eq(queueEntries.userId, userId));
    await this.db.delete(matchResults).where(eq(matchResults.userId, userId));
  }

  async acknowledgeMatch(userId: string): Promise<void> {
    await this.db.delete(matchResults).where(eq(matchResults.userId, userId));
  }

  // -------------------------------------------------------------------------
  // Internal matching
  // -------------------------------------------------------------------------

  private async _runMatch(gameMode: string) {
    const now = Math.floor(Date.now() / 1000);
    const allEntries = await this.db
      .select()
      .from(queueEntries)
      .where(eq(queueEntries.gameMode, gameMode));

    const queue = allEntries.map((e) => ({
      userId: e.userId,
      elo: e.elo,
      gameMode: e.gameMode,
      enqueuedAt: e.enqueuedAt,
    }));

    const pairs = findMatches(queue, now);

    for (const { playerA, playerB } of pairs) {
      const gameId = generateGameId();
      const matchedAt = now;

      // Remove from queue
      await this.db.delete(queueEntries).where(eq(queueEntries.userId, playerA.userId));
      await this.db.delete(queueEntries).where(eq(queueEntries.userId, playerB.userId));

      // Store results
      this.storage.sql.exec(
        `INSERT OR REPLACE INTO match_results (user_id, game_id, matched_at) VALUES (?, ?, ?)`,
        playerA.userId,
        gameId,
        matchedAt,
      );
      this.storage.sql.exec(
        `INSERT OR REPLACE INTO match_results (user_id, game_id, matched_at) VALUES (?, ?, ?)`,
        playerB.userId,
        gameId,
        matchedAt,
      );
    }
  }

  // Wake up periodically via alarm to re-run matching
  async alarm() {
    await this._runMatch("standard");
    // Re-schedule alarm every 5 seconds if there are entries
    const count = await this.db.select({ c: sql<number>`count(*)` }).from(queueEntries);
    if ((count[0]?.c ?? 0) > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 5000);
    }
  }

  async fetch(_request: Request): Promise<Response> {
    return new Response("MatchmakingQueue DO", { status: 200 });
  }
}
