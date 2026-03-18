import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { eq } from "drizzle-orm";
import migrations from "../drizzle/do-migrations";
import { gameState, cells, moves } from "./db/do-schema";
import {
  createBoard,
  forceSetCell,
  getCell,
  isCellEmpty,
  boardToArray,
  boardToString,
  isValidCell,
  checkWinFromCell,
  createTurnState,
  placePiece as applyTurnPiece,
  getPiecesRemaining,
  getCurrentPlayer,
  restoreTurnState,
  calculateMatchElo,
  shouldCountForElo,
  getRatingTier,
  generateGameId,
  BOARD_RADIUS,
  WIN_LENGTH,
  axialToKey,
} from "@hex/game-core";
import type {
  Player,
  Board,
  AxialCoord,
  GameState as GameCoreState,
  GameStatus,
  WinReason,
  TurnState,
  ServerMessage,
  ClientMessage,
  MoveResult,
  EloChange,
} from "@hex/game-core";

// ---------------------------------------------------------------------------
// WebSocket tag constants
// ---------------------------------------------------------------------------
const WS_PLAYER_X = "player_x";
const WS_PLAYER_O = "player_o";
const WS_SPECTATOR = "spectator";

// ---------------------------------------------------------------------------
// GameSession Durable Object
// ---------------------------------------------------------------------------
export class GameSession extends DurableObject<Env> {
  storage: DurableObjectStorage;
  db: DrizzleSqliteDODatabase<any>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.storage = ctx.storage;
    this.db = drizzle(this.storage, { logger: false });

    ctx.blockConcurrencyWhile(async () => {
      await migrate(this.db, migrations);
    });
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  /** Load the game state singleton row, or null if not initialized */
  private async _loadGameState(): Promise<
    typeof gameState.$inferSelect | null
  > {
    const rows = await this.db
      .select()
      .from(gameState)
      .where(eq(gameState.id, 1));
    return rows.length > 0 ? rows[0] : null;
  }

  /** Load the board as a Board Map from the cells table */
  private async _loadBoard(): Promise<Board> {
    const rows = await this.db.select().from(cells);
    const board = createBoard();
    for (const row of rows) {
      board.set(axialToKey({ q: row.q, r: row.r }), row.player as Player);
    }
    return board;
  }

  /** Build the full GameCoreState from the database */
  private async _buildFullState(): Promise<GameCoreState> {
    const gs = await this._loadGameState();
    if (!gs) {
      throw new Error("Game not initialized");
    }
    const board = await this._loadBoard();

    // Parse win line from JSON if present
    let winLine: AxialCoord[] | null = null;
    if (gs.winLine) {
      try {
        winLine = JSON.parse(gs.winLine);
      } catch {
        winLine = null;
      }
    }

    return {
      gameId: (await this.storage.get<string>("gameId")) ?? "unknown",
      status: gs.status as GameStatus,
      boardRadius: BOARD_RADIUS,
      board,
      playerXId: gs.playerXId,
      playerOId: gs.playerOId,
      currentTurn: gs.currentTurn as Player,
      piecesPlacedThisTurn: gs.piecesPlacedThisTurn,
      moveCount: gs.moveCount,
      winner: (gs.winner as Player) ?? null,
      winReason: (gs.winReason as WinReason) ?? null,
      winLine,
      startedAt: gs.startedAt,
      updatedAt: gs.updatedAt,
    };
  }

  /** Broadcast a message to all connected WebSockets */
  private _broadcast(message: ServerMessage) {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // ignore send errors on stale connections
      }
    }
  }

  /** Broadcast a message only to WebSockets with a specific tag */
  private _broadcastToTag(tag: string, message: ServerMessage) {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets(tag)) {
      try {
        ws.send(payload);
      } catch {
        // ignore
      }
    }
  }

  /** Get the WebSocket tag for a player */
  private _getPlayerTag(playerId: string): string | null {
    return this.ctx.getTags(this.ctx.getWebSockets()).length >= 0 ? null : null;
  }

  /** Determine which player (X or O) a given userId is */
  private async _getPlayerRole(userId: string): Promise<Player | null> {
    const gs = await this._loadGameState();
    if (!gs) return null;
    if (gs.playerXId === userId) return "X";
    if (gs.playerOId === userId) return "O";
    return null;
  }

  /** Update the game_state table */
  private async _updateGameState(
    updates: Partial<typeof gameState.$inferInsert>,
  ) {
    await this.db
      .update(gameState)
      .set({ ...updates, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(gameState.id, 1));
  }

  /** Persist the final match result to D1 */
  private async _persistToD1(
    winner: Player | null,
    winReason: WinReason,
    eloChange?: EloChange,
  ) {
    const gs = await this._loadGameState();
    if (!gs || !gs.playerXId || !gs.playerOId) return;

    const gameId =
      (await this.storage.get<string>("gameId")) ?? generateGameId();
    const startedAt = gs.startedAt ?? Math.floor(Date.now() / 1000);
    const endedAt = Math.floor(Date.now() / 1000);
    const board = await this._loadBoard();

    const winnerId =
      winner === "X" ? gs.playerXId : winner === "O" ? gs.playerOId : null;

    // Insert match record into D1
    await this.env.DB.prepare(
      `INSERT INTO matches (id, player_x_id, player_o_id, winner_id, win_reason, move_count, duration_sec, board_radius, elo_x_before, elo_o_before, elo_x_after, elo_o_after, started_at, ended_at, final_board)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        gameId,
        gs.playerXId,
        gs.playerOId,
        winnerId,
        winReason,
        gs.moveCount,
        endedAt - startedAt,
        BOARD_RADIUS,
        eloChange ? eloChange.winnerNewElo - eloChange.winnerChange : 1200,
        eloChange ? eloChange.loserNewElo - eloChange.loserChange : 1200,
        eloChange
          ? winner === "X"
            ? eloChange.winnerNewElo
            : eloChange.loserNewElo
          : 1200,
        eloChange
          ? winner === "O"
            ? eloChange.winnerNewElo
            : eloChange.loserNewElo
          : 1200,
        startedAt,
        endedAt,
        boardToString(board),
      )
      .run();

    // Insert move history into D1
    const moveRows = await this.db.select().from(moves);
    for (const move of moveRows) {
      const playerId = move.player === "X" ? gs.playerXId : gs.playerOId;
      await this.env.DB.prepare(
        `INSERT INTO match_moves (match_id, move_index, player_id, q, r, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(gameId, move.moveIndex, playerId, move.q, move.r, move.timestamp)
        .run();
    }

    // Update ratings in D1 if the game counts for ELO
    if (eloChange && shouldCountForElo(gs.moveCount)) {
      await this._updateRatings(gs.playerXId, gs.playerOId, winner, eloChange);
    }
  }

  /** Update player ratings in D1 */
  private async _updateRatings(
    playerXId: string,
    playerOId: string,
    winner: Player | null,
    eloChange: EloChange,
  ) {
    const isDraw = winner === null;

    // Update X's rating
    const xRating = await this.env.DB.prepare(
      `SELECT * FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
    )
      .bind(playerXId)
      .first<any>();

    if (xRating) {
      const newX = isDraw
        ? xRating.elo + eloChange.winnerChange
        : winner === "X"
          ? eloChange.winnerNewElo
          : eloChange.loserNewElo;

      const xWins = winner === "X" ? xRating.wins + 1 : xRating.wins;
      const xLosses = winner === "O" ? xRating.losses + 1 : xRating.losses;
      const xDraws = isDraw ? xRating.draws + 1 : xRating.draws;

      await this.env.DB.prepare(
        `UPDATE ratings SET elo = ?, peak_elo = MAX(peak_elo, ?), games_played = games_played + 1, wins = ?, losses = ?, draws = ?, updated_at = ? WHERE user_id = ? AND game_mode = 'standard'`,
      )
        .bind(
          newX,
          newX,
          xWins,
          xLosses,
          xDraws,
          Math.floor(Date.now() / 1000),
          playerXId,
        )
        .run();
    }

    // Update O's rating
    const oRating = await this.env.DB.prepare(
      `SELECT * FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
    )
      .bind(playerOId)
      .first<any>();

    if (oRating) {
      const newY = isDraw
        ? oRating.elo + eloChange.loserChange
        : winner === "O"
          ? eloChange.winnerNewElo
          : eloChange.loserNewElo;

      const oWins = winner === "O" ? oRating.wins + 1 : oRating.wins;
      const oLosses = winner === "X" ? oRating.losses + 1 : oRating.losses;
      const oDraws = isDraw ? oRating.draws + 1 : oRating.draws;

      await this.env.DB.prepare(
        `UPDATE ratings SET elo = ?, peak_elo = MAX(peak_elo, ?), games_played = games_played + 1, wins = ?, losses = ?, draws = ?, updated_at = ? WHERE user_id = ? AND game_mode = 'standard'`,
      )
        .bind(
          newY,
          newY,
          oWins,
          oLosses,
          oDraws,
          Math.floor(Date.now() / 1000),
          playerOId,
        )
        .run();
    }
  }

  // =========================================================================
  // RPC Methods (called from server functions)
  // =========================================================================

  /** Create a new game with two players. Returns the game ID. */
  async createGame(playerXId: string, playerOId: string): Promise<string> {
    const gameId = generateGameId();
    await this.storage.put("gameId", gameId);

    // Initialize game state
    await this.db.insert(gameState).values({
      id: 1,
      status: "active",
      playerXId,
      playerOId,
      currentTurn: "X",
      piecesPlacedThisTurn: 0,
      moveCount: 0,
      winner: null,
      winReason: null,
      winLine: null,
      startedAt: Math.floor(Date.now() / 1000),
    });

    return gameId;
  }

  /** Get the current game state (for server functions) */
  async getGameState(): Promise<GameCoreState> {
    return this._buildFullState();
  }

  /** Get game info for the route loader (lightweight) */
  async getGameInfo(): Promise<{
    gameId: string;
    status: GameStatus;
    playerXId: string | null;
    playerOId: string | null;
    currentTurn: Player;
    moveCount: number;
  }> {
    const gs = await this._loadGameState();
    if (!gs) throw new Error("Game not initialized");
    const gameId = (await this.storage.get<string>("gameId")) ?? "unknown";
    return {
      gameId,
      status: gs.status as GameStatus,
      playerXId: gs.playerXId,
      playerOId: gs.playerOId,
      currentTurn: gs.currentTurn as Player,
      moveCount: gs.moveCount,
    };
  }

  /** Place a move. Returns the result including updated state. */
  async placeMove(playerId: string, q: number, r: number): Promise<MoveResult> {
    const gs = await this._loadGameState();
    if (!gs) {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: "Game not found",
      };
    }

    // Validate game is active
    if (gs.status !== "active") {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: "Game is not active",
      };
    }

    // Determine player role
    const role = await this._getPlayerRole(playerId);
    if (!role) {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: "You are not a player in this game",
      };
    }

    // Check it's this player's turn
    if (gs.currentTurn !== role) {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: "It's not your turn",
      };
    }

    // Check the player has pieces remaining
    const turnState = restoreTurnState({
      currentTurn: gs.currentTurn as Player,
      piecesPlacedThisTurn: gs.piecesPlacedThisTurn,
      moveCount: gs.moveCount,
    });

    if (getPiecesRemaining(turnState) <= 0) {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: "No pieces remaining this turn",
      };
    }

    // Validate the cell
    const coord: AxialCoord = { q, r };
    if (!isValidCell(coord, BOARD_RADIUS)) {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: `Cell (${q}, ${r}) is outside the board`,
      };
    }

    const board = await this._loadBoard();
    if (!isCellEmpty(board, coord)) {
      return {
        success: false,
        gameState: await this._buildFullState(),
        error: `Cell (${q}, ${r}) is already occupied`,
      };
    }

    // Place the piece in the cells table
    await this.db.insert(cells).values({
      q,
      r,
      player: role,
      moveIndex: gs.moveCount,
    });

    // Record the move
    await this.db.insert(moves).values({
      player: role,
      q,
      r,
      moveIndex: gs.moveCount,
    });

    // Update the board in memory for win checking
    const newBoard = forceSetCell(board, coord, role);

    // Check for win
    const winLine = checkWinFromCell(
      newBoard,
      coord,
      role,
      WIN_LENGTH,
      BOARD_RADIUS,
    );

    // Advance turn state
    const newTurnState = applyTurnPiece(turnState);

    if (winLine) {
      // Game over — this player wins!
      const winReason: WinReason = "six_in_row";

      // Calculate ELO changes
      const gs2 = await this._loadGameState();
      let eloChange: EloChange | undefined;
      if (
        gs2 &&
        gs2.playerXId &&
        gs2.playerOId &&
        shouldCountForElo(gs.moveCount + 1)
      ) {
        // Fetch current ratings from D1
        const xRating = await this.env.DB.prepare(
          `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
        )
          .bind(gs2.playerXId)
          .first<any>();
        const oRating = await this.env.DB.prepare(
          `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
        )
          .bind(gs2.playerOId)
          .first<any>();

        const xElo = xRating?.elo ?? 1200;
        const oElo = oRating?.elo ?? 1200;
        const xGames = xRating?.games_played ?? 0;
        const oGames = oRating?.games_played ?? 0;

        if (role === "X") {
          eloChange = calculateMatchElo(xElo, oElo, xGames, oGames, false);
        } else {
          eloChange = calculateMatchElo(oElo, xElo, oGames, xGames, false);
        }
      }

      // Update game state to finished
      await this._updateGameState({
        status: "finished",
        winner: role,
        winReason,
        winLine: JSON.stringify(winLine),
        moveCount: gs.moveCount + 1,
        currentTurn: newTurnState.currentTurn,
        piecesPlacedThisTurn: newTurnState.piecesPlacedThisTurn,
      });

      // Persist to D1
      await this._persistToD1(role, winReason, eloChange);

      const finalState = await this._buildFullState();

      // Broadcast game over
      this._broadcast({
        type: "game_over",
        winner: role,
        reason: winReason,
        state: finalState,
        eloChange,
      });

      return { success: true, gameState: finalState };
    }

    // Check for tie (board full)
    const totalCells = 3 * BOARD_RADIUS * (BOARD_RADIUS + 1) + 1;
    if (newBoard.size >= totalCells) {
      const winReason: WinReason = "draw";

      // Calculate ELO for draw
      const gs2 = await this._loadGameState();
      let eloChange: EloChange | undefined;
      if (
        gs2 &&
        gs2.playerXId &&
        gs2.playerOId &&
        shouldCountForElo(gs.moveCount + 1)
      ) {
        const xRating = await this.env.DB.prepare(
          `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
        )
          .bind(gs2.playerXId)
          .first<any>();
        const oRating = await this.env.DB.prepare(
          `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
        )
          .bind(gs2.playerOId)
          .first<any>();

        const xElo = xRating?.elo ?? 1200;
        const oElo = oRating?.elo ?? 1200;
        const xGames = xRating?.games_played ?? 0;
        const oGames = oRating?.games_played ?? 0;

        eloChange = calculateMatchElo(xElo, oElo, xGames, oGames, true);
      }

      await this._updateGameState({
        status: "finished",
        winner: null,
        winReason,
        moveCount: gs.moveCount + 1,
        currentTurn: newTurnState.currentTurn,
        piecesPlacedThisTurn: newTurnState.piecesPlacedThisTurn,
      });

      await this._persistToD1(null, winReason, eloChange);

      const finalState = await this._buildFullState();

      this._broadcast({
        type: "game_over",
        winner: null,
        reason: winReason,
        state: finalState,
        eloChange,
      });

      return { success: true, gameState: finalState };
    }

    // Normal move — update turn state
    await this._updateGameState({
      moveCount: gs.moveCount + 1,
      currentTurn: newTurnState.currentTurn,
      piecesPlacedThisTurn: newTurnState.piecesPlacedThisTurn,
    });

    const newState = await this._buildFullState();

    // Broadcast the move to all connected clients
    this._broadcast({
      type: "move",
      q,
      r,
      player: role,
      moveIndex: gs.moveCount,
      state: newState,
    });

    // Also send turn_change
    this._broadcast({
      type: "turn_change",
      currentTurn: newTurnState.currentTurn,
      piecesRemaining: getPiecesRemaining(newTurnState),
    });

    return { success: true, gameState: newState };
  }

  /** Resign from the game */
  async resign(playerId: string): Promise<void> {
    const gs = await this._loadGameState();
    if (!gs || gs.status !== "active") return;

    const role = await this._getPlayerRole(playerId);
    if (!role) return;

    const winner: Player = role === "X" ? "O" : "X";
    const winReason: WinReason = "resignation";

    // Calculate ELO if game has enough moves
    let eloChange: EloChange | undefined;
    if (gs.playerXId && gs.playerOId && shouldCountForElo(gs.moveCount)) {
      const xRating = await this.env.DB.prepare(
        `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
      )
        .bind(gs.playerXId)
        .first<any>();
      const oRating = await this.env.DB.prepare(
        `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
      )
        .bind(gs.playerOId)
        .first<any>();

      const xElo = xRating?.elo ?? 1200;
      const oElo = oRating?.elo ?? 1200;
      const xGames = xRating?.games_played ?? 0;
      const oGames = oRating?.games_played ?? 0;

      if (winner === "X") {
        eloChange = calculateMatchElo(xElo, oElo, xGames, oGames, false);
      } else {
        eloChange = calculateMatchElo(oElo, xElo, oGames, xGames, false);
      }
    }

    await this._updateGameState({
      status: "finished",
      winner,
      winReason,
    });

    await this._persistToD1(winner, winReason, eloChange);

    const finalState = await this._buildFullState();

    this._broadcast({
      type: "game_over",
      winner,
      reason: winReason,
      state: finalState,
      eloChange,
    });
  }

  /** Offer a draw */
  async offerDraw(playerId: string): Promise<void> {
    const gs = await this._loadGameState();
    if (!gs || gs.status !== "active") return;

    const role = await this._getPlayerRole(playerId);
    if (!role) return;

    // Store who offered the draw
    await this.storage.put("drawOfferedBy", playerId);

    // Notify the opponent
    const opponentTag = role === "X" ? WS_PLAYER_O : WS_PLAYER_X;
    this._broadcastToTag(opponentTag, { type: "draw_offered" });
  }

  /** Respond to a draw offer */
  async respondDraw(playerId: string, accept: boolean): Promise<void> {
    const gs = await this._loadGameState();
    if (!gs || gs.status !== "active") return;

    const offeredBy = await this.storage.get<string>("drawOfferedBy");
    if (!offeredBy || offeredBy === playerId) return;

    // Clear the draw offer
    await this.storage.delete("drawOfferedBy");

    if (!accept) {
      const opponentTag = gs.playerXId === playerId ? WS_PLAYER_O : WS_PLAYER_X;
      this._broadcastToTag(opponentTag, { type: "draw_declined" });
      return;
    }

    // Accept draw
    const winReason: WinReason = "draw";

    let eloChange: EloChange | undefined;
    if (gs.playerXId && gs.playerOId && shouldCountForElo(gs.moveCount)) {
      const xRating = await this.env.DB.prepare(
        `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
      )
        .bind(gs.playerXId)
        .first<any>();
      const oRating = await this.env.DB.prepare(
        `SELECT elo, games_played FROM ratings WHERE user_id = ? AND game_mode = 'standard'`,
      )
        .bind(gs.playerOId)
        .first<any>();

      const xElo = xRating?.elo ?? 1200;
      const oElo = oRating?.elo ?? 1200;
      const xGames = xRating?.games_played ?? 0;
      const oGames = oRating?.games_played ?? 0;

      eloChange = calculateMatchElo(xElo, oElo, xGames, oGames, true);
    }

    await this._updateGameState({
      status: "finished",
      winner: null,
      winReason,
    });

    await this._persistToD1(null, winReason, eloChange);

    const finalState = await this._buildFullState();

    this._broadcast({
      type: "game_over",
      winner: null,
      reason: winReason,
      state: finalState,
      eloChange,
    });
  }

  // =========================================================================
  // WebSocket Handler (fetch is ONLY used for WebSocket connections)
  // =========================================================================

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 400 });
    }

    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Determine the tag for this connection
    let tag = WS_SPECTATOR;
    if (playerId) {
      const gs = await this._loadGameState();
      if (gs) {
        if (gs.playerXId === playerId) tag = WS_PLAYER_X;
        else if (gs.playerOId === playerId) tag = WS_PLAYER_O;
      }
    }

    // Accept the WebSocket with a tag for targeted messaging
    this.ctx.acceptWebSocket(server, [tag]);

    // Send the current full state immediately
    try {
      const state = await this._buildFullState();
      server.send(
        JSON.stringify({ type: "sync", state } satisfies ServerMessage),
      );
    } catch {
      // Game might not be initialized yet
      server.send(
        JSON.stringify({
          type: "error",
          message: "Game not initialized",
        } satisfies ServerMessage),
      );
    }

    // Notify opponent that this player connected
    if (tag === WS_PLAYER_X || tag === WS_PLAYER_O) {
      const opponentTag = tag === WS_PLAYER_X ? WS_PLAYER_O : WS_PLAYER_X;
      this._broadcastToTag(opponentTag, {
        type: "opponent_status",
        connected: true,
      });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // =========================================================================
  // WebSocket Hibernation API Handlers
  // =========================================================================

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message);
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid JSON",
        } satisfies ServerMessage),
      );
      return;
    }

    // Get the player ID from the WebSocket tags
    const tags = this.ctx.getTags(ws);
    let playerId: string | null = null;
    if (tags.includes(WS_PLAYER_X)) {
      const gs = await this._loadGameState();
      playerId = gs?.playerXId ?? null;
    } else if (tags.includes(WS_PLAYER_O)) {
      const gs = await this._loadGameState();
      playerId = gs?.playerOId ?? null;
    }

    switch (parsed.type) {
      case "place": {
        if (!playerId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not a player",
            } satisfies ServerMessage),
          );
          return;
        }
        const result = await this.placeMove(playerId, parsed.q, parsed.r);
        if (!result.success) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: result.error ?? "Invalid move",
            } satisfies ServerMessage),
          );
        }
        break;
      }

      case "resign": {
        if (!playerId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not a player",
            } satisfies ServerMessage),
          );
          return;
        }
        await this.resign(playerId);
        break;
      }

      case "draw_offer": {
        if (!playerId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not a player",
            } satisfies ServerMessage),
          );
          return;
        }
        await this.offerDraw(playerId);
        break;
      }

      case "draw_response": {
        if (!playerId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not a player",
            } satisfies ServerMessage),
          );
          return;
        }
        await this.respondDraw(playerId, parsed.accept);
        break;
      }

      case "ping": {
        ws.send(JSON.stringify({ type: "pong" } satisfies ServerMessage));
        break;
      }

      default: {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          } satisfies ServerMessage),
        );
      }
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    _wasClean: boolean,
  ) {
    // Notify opponent that this player disconnected
    const tags = this.ctx.getTags(ws);
    if (tags.includes(WS_PLAYER_X)) {
      this._broadcastToTag(WS_PLAYER_O, {
        type: "opponent_status",
        connected: false,
      });
    } else if (tags.includes(WS_PLAYER_O)) {
      this._broadcastToTag(WS_PLAYER_X, {
        type: "opponent_status",
        connected: false,
      });
    }

    ws.close(code, reason);
  }
}
