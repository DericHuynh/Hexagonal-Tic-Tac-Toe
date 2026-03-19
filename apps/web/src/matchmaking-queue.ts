import { DurableObject } from "cloudflare:workers";


import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";



import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";



import { eq, sql } from "drizzle-orm";


import {
  findMatches,
  assignRoles,
  generateGameId,
  getSearchRange,
} from "@hex/game-core";

import type { QueueEntry, ServerMessage } from "@hex/game-core";

// ---------------------------------------------------------------------------
// Queue Entry Schema (DO-local SQLite)
// ---------------------------------------------------------------------------
const queueEntries = sqliteTable("queue_entries", {
  userId: text("user_id").primaryKey(),
  elo: integer().notNull(),
  gameMode: text("game_mode").notNull().default("standard"),
  enqueuedAt: integer("enqueued_at").notNull(),
});

// ---------------------------------------------------------------------------
// Match result stored for polling clients
// ---------------------------------------------------------------------------
const matchResults = sqliteTable("match_results", {
  userId: text("user_id").primaryKey(),
  gameId: text("game_id").notNull(),
  matchedAt: integer("matched_at").notNull(),
});

// ---------------------------------------------------------------------------
// MatchmakingQueue Durable Object (singleton)
// ---------------------------------------------------------------------------
export class MatchmakingQueue extends DurableObject<Env> {
  storage: DurableObjectStorage;
  db: DrizzleSqliteDODatabase<any>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.storage = ctx.storage;

    this.db = drizzle(this.storage, { logger: false });


    ctx.blockConcurrencyWhile(async () => {

      // Create tables if they don't exist

      await this.db.run(sql.raw(`

        CREATE TABLE IF NOT EXISTS queue_entries (

          user_id TEXT PRIMARY KEY NOT NULL,

          elo INTEGER NOT NULL,

          game_mode TEXT NOT NULL DEFAULT 'standard',

          enqueued_at INTEGER NOT NULL

        )

      `));

      await this.db.run(sql.raw(`

        CREATE TABLE IF NOT EXISTS match_results (

          user_id TEXT PRIMARY KEY NOT NULL,

          game_id TEXT NOT NULL,

          matched_at INTEGER NOT NULL

        )

      `));

    });

  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  /** Load all queue entries for a given game mode */
  private async _loadQueue(
    gameMode: string = "standard",
  ): Promise<QueueEntry[]> {
    const rows = await this.db
      .select()
      .from(queueEntries)
      .where(eq(queueEntries.gameMode, gameMode));

    return rows.map((row) => ({
      userId: row.userId,
      elo: row.elo,
      gameMode: row.gameMode,
      enqueuedAt: row.enqueuedAt,
    }));
  }

  /** Remove a player from the queue */
  private async _removeFromQueue(userId: string): Promise<void> {
    await this.db.delete(queueEntries).where(eq(queueEntries.userId, userId));
  }

  /** Store a match result so the client can poll for it */
  private async _storeMatchResult(
    userId: string,
    gameId: string,
  ): Promise<void> {
    await this.db
      .insert(matchResults)
      .values({
        userId,
        gameId,
        matchedAt: Math.floor(Date.now() / 1000),
      })
      .onConflictDoUpdate({
        target: matchResults.userId,
        set: {
          gameId,
          matchedAt: Math.floor(Date.now() / 1000),
        },
      });
  }

  /** Broadcast a message to all connected WebSockets */
  private _broadcast(message: ServerMessage) {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // ignore stale connections
      }
    }
  }

  /** Broadcast to a specific user's WebSocket(s) */
  private _broadcastToUser(userId: string, message: ServerMessage) {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets(userId)) {
      try {
        ws.send(payload);
      } catch {
        // ignore
      }
    }
  }

  /** Attempt to match players in the queue */
  private async _tryMatch(gameMode: string = "standard"): Promise<void> {
    const queue = await this._loadQueue(gameMode);
    if (queue.length < 2) return;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const pairs = findMatches(queue, nowSeconds);

    for (const pair of pairs) {
      const { playerX, playerO } = assignRoles(pair.playerA, pair.playerB);
      const gameId = generateGameId();

      // Create the game Durable Object
      const gameStub = this.env.GAME_SESSION.getByName(gameId);
      await gameStub.createGame(playerX.userId, playerO.userId);

      // Store match results for both players
      await this._storeMatchResult(playerX.userId, gameId);
      await this._storeMatchResult(playerO.userId, gameId);

      // Remove both players from the queue
      await this._removeFromQueue(playerX.userId);
      await this._removeFromQueue(playerO.userId);

      // Notify both players via WebSocket
      this._broadcastToUser(playerX.userId, {
        type: "sync",
        state: {
          gameId,
          status: "active",
          boardRadius: 20,
          board: new Map(),
          playerXId: playerX.userId,
          playerOId: playerO.userId,
          currentTurn: "X",
          piecesPlacedThisTurn: 0,
          moveCount: 0,
          winner: null,
          winReason: null,
          winLine: null,
          startedAt: nowSeconds,
          updatedAt: nowSeconds,
        },
      } as any);

      this._broadcastToUser(playerO.userId, {
        type: "sync",
        state: {
          gameId,
          status: "active",
          boardRadius: 20,
          board: new Map(),
          playerXId: playerX.userId,
          playerOId: playerO.userId,
          currentTurn: "X",
          piecesPlacedThisTurn: 0,
          moveCount: 0,
          winner: null,
          winReason: null,
          winLine: null,
          startedAt: nowSeconds,
          updatedAt: nowSeconds,
        },
      } as any);
    }
  }

  // =========================================================================
  // RPC Methods
  // =========================================================================

  /** Join the matchmaking queue */
  async joinQueue(
    userId: string,
    elo: number,
    gameMode: string = "standard",
  ): Promise<{ status: string; position?: number }> {
    // Check if already in queue
    const existing = await this.db
      .select()
      .from(queueEntries)
      .where(eq(queueEntries.userId, userId));

    if (existing.length > 0) {
      // Update ELO in case it changed
      await this.db
        .update(queueEntries)
        .set({ elo, gameMode })
        .where(eq(queueEntries.userId, userId));
    } else {
      await this.db.insert(queueEntries).values({
        userId,
        elo,
        gameMode,
        enqueuedAt: Math.floor(Date.now() / 1000),
      });
    }

    // Try to find a match immediately
    await this._tryMatch(gameMode);

    // Check if the player was matched (removed from queue)
    const stillInQueue = await this.db
      .select()
      .from(queueEntries)
      .where(eq(queueEntries.userId, userId));

    if (stillInQueue.length === 0) {
      // Player was matched! Get the game ID
      const result = await this.db
        .select()
        .from(matchResults)
        .where(eq(matchResults.userId, userId));

      if (result.length > 0) {
        return { status: "matched" };
      }
    }

    // Still waiting — return position
    const queue = await this._loadQueue(gameMode);
    const position = queue.findIndex((e) => e.userId === userId);

    return { status: "waiting", position: position >= 0 ? position + 1 : 0 };
  }

  /** Leave the matchmaking queue */
  async leaveQueue(userId: string): Promise<void> {
    await this._removeFromQueue(userId);
  }

  /** Check if a player has been matched (polling endpoint) */
  async checkStatus(
    userId: string,
  ): Promise<{
    status: "waiting" | "matched";
    gameId?: string;
    position?: number;
  }> {
    // Check for a match result
    const result = await this.db
      .select()
      .from(matchResults)
      .where(eq(matchResults.userId, userId));

    if (result.length > 0) {
      const gameId = result[0].gameId;
      // Clean up the match result
      await this.db.delete(matchResults).where(eq(matchResults.userId, userId));
      return { status: "matched", gameId };
    }

    // Check queue position
    const queue = await this._loadQueue();
    const position = queue.findIndex((e) => e.userId === userId);

    if (position >= 0) {
      return { status: "waiting", position: position + 1 };
    }

    // Not in queue and no match — might have been matched already
    return { status: "waiting", position: 0 };
  }

  /** Get queue stats (for UI display) */
  async getQueueStats(gameMode: string = "standard"): Promise<{
    playerCount: number;
    avgElo: number;
    avgWaitSeconds: number;
  }> {
    const queue = await this._loadQueue(gameMode);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (queue.length === 0) {
      return { playerCount: 0, avgElo: 0, avgWaitSeconds: 0 };
    }

    const avgElo = Math.round(
      queue.reduce((sum, e) => sum + e.elo, 0) / queue.length,
    );

    const avgWaitSeconds = Math.round(
      queue.reduce((sum, e) => sum + (nowSeconds - e.enqueuedAt), 0) /
        queue.length,
    );

    return {
      playerCount: queue.length,
      avgElo,
      avgWaitSeconds,
    };
  }

  /** Force a match attempt (useful for testing or scheduled triggers) */
  async forceMatch(gameMode: string = "standard"): Promise<number> {
    const before = (await this._loadQueue(gameMode)).length;
    await this._tryMatch(gameMode);
    const after = (await this._loadQueue(gameMode)).length;
    return before - after; // number of players matched
  }

  // =========================================================================
  // WebSocket Handler
  // =========================================================================

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with userId as tag for targeted messaging
    const tags = userId ? [userId] : ["spectator"];
    this.ctx.acceptWebSocket(server, tags);

    // Send current queue stats
    const stats = await this.getQueueStats();
    server.send(
      JSON.stringify({
        type: "queue_stats",
        ...stats,
      }),
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let parsed: any;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    const tags = this.ctx.getTags(ws);
    const userId = tags.find((t) => t !== "spectator");

    if (!userId) return;

    switch (parsed.type) {
      case "join": {
        const result = await this.joinQueue(
          userId,
          parsed.elo ?? 1200,
          parsed.gameMode ?? "standard",
        );
        ws.send(JSON.stringify({ type: "queue_update", ...result }));
        break;
      }

      case "leave": {
        await this.leaveQueue(userId);
        ws.send(JSON.stringify({ type: "queue_update", status: "left" }));
        break;
      }

      case "check": {
        const status = await this.checkStatus(userId);
        ws.send(JSON.stringify({ type: "queue_update", ...status }));
        break;
      }

      case "ping": {
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      }
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    _wasClean: boolean,
  ) {
    // Optionally remove from queue on disconnect
    // For now, keep them in queue so they can reconnect
    ws.close(code, reason);
  }
}
