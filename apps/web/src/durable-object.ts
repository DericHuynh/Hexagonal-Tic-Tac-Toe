import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { eq } from "drizzle-orm";
import doMigrations from "../drizzle/do-migrations";
import { gameState, cells, moves } from "./db/do-schema";
import { isCellEmpty, isBoardFull, boardFromArray, axialToKey } from "@hex/game-core";
import { placePiece, restoreTurnState } from "@hex/game-core";
import { checkWinFromCell } from "@hex/game-core";
import type {
  Player,
  ClientMessage,
  ServerMessage,
  GameState,
  AxialCoord,
  Board,
  WinReason,
} from "@hex/game-core";
import { BOARD_RADIUS } from "@hex/game-core";

type CellRow = { q: number; r: number; player: string };

function boardFromRows(rows: CellRow[]): Board {
  return boardFromArray(rows.map((r) => ({ q: r.q, r: r.r, player: r.player as Player })));
}

export class GameSession extends DurableObject<Env> {
  storage: DurableObjectStorage;
  db: DrizzleSqliteDODatabase<any>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.storage = ctx.storage;
    this.db = drizzle(this.storage, { logger: false });
    ctx.blockConcurrencyWhile(async () => {
      await migrate(this.db, doMigrations);
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async _getOrCreateState() {
    const rows = await this.db.select().from(gameState).where(eq(gameState.id, 1));
    if (rows.length === 0) {
      await this.db.insert(gameState).values({ id: 1 });
      return (await this.db.select().from(gameState).where(eq(gameState.id, 1)))[0];
    }
    return rows[0];
  }

  private async _getBoard(): Promise<Board> {
    const cellRows = await this.db.select().from(cells);
    return boardFromRows(cellRows);
  }

  private _broadcast(msg: ServerMessage) {
    const json = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(json);
    }
  }

  private _sendToWs(ws: WebSocket, msg: ServerMessage) {
    ws.send(JSON.stringify(msg));
  }

  private async _buildGameState(): Promise<GameState> {
    const gs = await this._getOrCreateState();
    const board = await this._getBoard();
    return {
      gameId: this.ctx.id.toString(),
      status: (gs.status ?? "waiting") as any,
      boardRadius: BOARD_RADIUS,
      // Maps serialize as {} over JSON; convert to plain object so clients can reconstruct
      board: Object.fromEntries(board) as unknown as Board,
      playerXId: gs.playerXId ?? null,
      playerOId: gs.playerOId ?? null,
      currentTurn: (gs.currentTurn ?? "X") as Player,
      piecesPlacedThisTurn: gs.piecesPlacedThisTurn ?? 0,
      moveCount: gs.moveCount ?? 0,
      winner: (gs.winner ?? null) as Player | null,
      winReason: (gs.winReason ?? null) as WinReason | null,
      winLine: gs.winLine ? JSON.parse(gs.winLine) : null,
      startedAt: gs.startedAt ?? null,
      updatedAt: gs.updatedAt ?? Math.floor(Date.now() / 1000),
    };
  }

  // -------------------------------------------------------------------------
  // RPC Methods (called from server functions)
  // -------------------------------------------------------------------------

  async getGameState(): Promise<GameState> {
    return this._buildGameState();
  }

  async joinGame(userId: string, role: "X" | "O"): Promise<{ ok: boolean; error?: string }> {
    const gs = await this._getOrCreateState();
    if (gs.status !== "waiting") {
      return { ok: false, error: "Game already started" };
    }

    const update: Record<string, any> = { updatedAt: Math.floor(Date.now() / 1000) };
    if (role === "X") {
      if (gs.playerXId) return { ok: false, error: "X slot already taken" };
      update.playerXId = userId;
    } else {
      if (gs.playerOId) return { ok: false, error: "O slot already taken" };
      update.playerOId = userId;
    }

    // Check if both players are now set after this update
    const newXId = role === "X" ? userId : gs.playerXId;
    const newOId = role === "O" ? userId : gs.playerOId;
    if (newXId && newOId) {
      update.status = "active";
      update.startedAt = Math.floor(Date.now() / 1000);
    }

    await this.db.update(gameState).set(update).where(eq(gameState.id, 1));

    if (update.status === "active") {
      const newState = await this._buildGameState();
      this._broadcast({ type: "sync", state: newState });
    }

    return { ok: true };
  }

  async placeMove(userId: string, q: number, r: number): Promise<{ ok: boolean; error?: string }> {
    const gs = await this._getOrCreateState();

    if (gs.status !== "active") {
      return { ok: false, error: "Game not active" };
    }

    // Verify it's this player's turn
    const currentPlayer = gs.currentTurn as Player;
    const isPlayerX = gs.playerXId === userId;
    const isPlayerO = gs.playerOId === userId;
    if (!isPlayerX && !isPlayerO) {
      return { ok: false, error: "You are not in this game" };
    }
    if ((currentPlayer === "X" && !isPlayerX) || (currentPlayer === "O" && !isPlayerO)) {
      return { ok: false, error: "Not your turn" };
    }

    // Validate move
    const board = await this._getBoard();
    const coord: AxialCoord = { q, r };
    const key = axialToKey(coord);

    if (!isValidHex(q, r, BOARD_RADIUS)) {
      return { ok: false, error: "Cell out of bounds" };
    }
    if (!isCellEmpty(board, coord)) {
      return { ok: false, error: "Cell already occupied" };
    }

    // Place piece
    const moveIndex = gs.moveCount ?? 0;
    const now = Math.floor(Date.now() / 1000);
    await this.db.insert(cells).values({ q, r, player: currentPlayer, moveIndex, placedAt: now });
    await this.db.insert(moves).values({ q, r, player: currentPlayer, moveIndex, timestamp: now });

    // Update board locally for win check
    const newBoard = new Map(board);
    newBoard.set(key, currentPlayer);

    // Check win
    const winLine = checkWinFromCell(newBoard, coord, currentPlayer, 6, BOARD_RADIUS);

    const turnState = restoreTurnState({
      currentTurn: currentPlayer,
      piecesPlacedThisTurn: gs.piecesPlacedThisTurn ?? 0,
      moveCount: gs.moveCount ?? 0,
    });
    const nextTurnState = placePiece(turnState);
    const newMoveCount = nextTurnState.moveCount;

    let newStatus = gs.status!;
    let winner: string | null = null;
    let winReason: string | null = null;
    let winLineStr: string | null = null;

    if (winLine) {
      newStatus = "finished";
      winner = currentPlayer;
      winReason = "six_in_row";
      winLineStr = JSON.stringify(winLine);
    } else if (isBoardFull(newBoard, BOARD_RADIUS)) {
      newStatus = "finished";
      winReason = "draw";
    }

    await this.db
      .update(gameState)
      .set({
        moveCount: newMoveCount,
        currentTurn: nextTurnState.currentTurn,
        piecesPlacedThisTurn: nextTurnState.piecesPlacedThisTurn,
        status: newStatus,
        winner: winner,
        winReason: winReason,
        winLine: winLineStr,
        updatedAt: now,
      })
      .where(eq(gameState.id, 1));

    // Broadcast delta move (no full board — client applies the cell to its local Map)
    this._broadcast({
      type: "move",
      q,
      r,
      player: currentPlayer,
      moveIndex,
      currentTurn: nextTurnState.currentTurn,
      piecesPlacedThisTurn: nextTurnState.piecesPlacedThisTurn,
      moveCount: newMoveCount,
    });

    if (newStatus === "finished") {
      this._broadcast({
        type: "game_over",
        winner: winner as Player | null,
        reason: winReason! as WinReason,
        winLine: winLine ?? null,
      });
    }

    return { ok: true };
  }

  async resign(userId: string): Promise<{ ok: boolean }> {
    const gs = await this._getOrCreateState();
    if (gs.status !== "active") return { ok: false };

    const isPlayerX = gs.playerXId === userId;
    const isPlayerO = gs.playerOId === userId;
    if (!isPlayerX && !isPlayerO) return { ok: false };

    const winner: Player = isPlayerX ? "O" : "X";
    const now = Math.floor(Date.now() / 1000);

    await this.db
      .update(gameState)
      .set({
        status: "finished",
        winner,
        winReason: "resignation",
        updatedAt: now,
      })
      .where(eq(gameState.id, 1));

    this._broadcast({ type: "game_over", winner, reason: "resignation", winLine: null });

    return { ok: true };
  }

  // -------------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") ?? "guest";

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [userId]);

    // Send full state sync on connect
    const state = await this._buildGameState();
    server.send(JSON.stringify({ type: "sync", state }));

    // Notify the other player that opponent has connected
    const gs = await this._getOrCreateState();
    const isPlayerX = gs.playerXId === userId;
    const isPlayerO = gs.playerOId === userId;
    if (isPlayerX || isPlayerO) {
      for (const ws of this.ctx.getWebSockets()) {
        if (ws !== server) {
          ws.send(JSON.stringify({ type: "opponent_status", connected: true }));
        }
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const msg = JSON.parse(typeof message === "string" ? message : "") as ClientMessage;
      const tags = this.ctx.getTags(ws);
      const userId = tags[0] ?? "guest";

      if (msg.type === "ping") {
        this._sendToWs(ws, { type: "pong" });
        return;
      }

      if (msg.type === "place") {
        const result = await this.placeMove(userId, msg.q, msg.r);
        if (!result.ok) {
          this._sendToWs(ws, { type: "error", message: result.error ?? "Move failed" });
        }
        return;
      }

      if (msg.type === "resign") {
        await this.resign(userId);
        return;
      }

      if (msg.type === "draw_offer") {
        // Broadcast to other player
        for (const other of this.ctx.getWebSockets()) {
          if (other !== ws) other.send(JSON.stringify({ type: "draw_offered" }));
        }
        return;
      }

      if (msg.type === "draw_response") {
        if (msg.accept) {
          await this._getOrCreateState();
          await this.db
            .update(gameState)
            .set({
              status: "finished",
              winReason: "draw",
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(gameState.id, 1));
          const state = await this._buildGameState();
          this._broadcast({
            type: "game_over",
            winner: null,
            reason: "draw",
            winLine: state.winLine ?? null,
          });
        } else {
          // Rejected: notify offerer
          for (const other of this.ctx.getWebSockets()) {
            if (other !== ws) other.send(JSON.stringify({ type: "draw_declined" }));
          }
        }
        return;
      }
    } catch {
      // ignore parse errors
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    ws.close(code, reason);
    // Notify others that opponent disconnected
    const tags = this.ctx.getTags(ws);
    const userId = tags[0];
    const gs = await this._getOrCreateState();
    if (gs.playerXId === userId || gs.playerOId === userId) {
      for (const other of this.ctx.getWebSockets()) {
        if (other !== ws) {
          other.send(JSON.stringify({ type: "opponent_status", connected: false }));
        }
      }
    }
  }
}

// Utility: validate hex within radius
function isValidHex(q: number, r: number, radius: number): boolean {
  return Math.abs(q) <= radius && Math.abs(r) <= radius && Math.abs(q + r) <= radius;
}
