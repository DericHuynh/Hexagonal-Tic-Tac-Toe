import { env } from "cloudflare:workers";
import type { GameState } from "@hex/game-core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGameStub(gameId: string) {
  const doId = env.GAME_SESSION.idFromName(gameId);
  return env.GAME_SESSION.get(doId);
}

function getMatchmakingStub() {
  // Use a singleton instance name for the matchmaking queue DO
  const doId = env.MATCHMAKING_QUEUE.idFromName("matchmaking-queue");
  return env.MATCHMAKING_QUEUE.get(doId);
}

// ---------------------------------------------------------------------------
// Game Session RPCs
// ---------------------------------------------------------------------------

export async function rpcGetGameState(gameId: string): Promise<GameState> {
  const stub = getGameStub(gameId);
  return await stub.getGameState();
}

export async function rpcJoinGame(gameId: string, userId: string, role: "X" | "O") {
  // Security: verify this userId was actually matched to this gameId by the matchmaking system
  const mmStub = getMatchmakingStub();
  const matchStatus = await mmStub.checkStatus(userId);
  if (matchStatus.status !== "matched" || matchStatus.gameId !== gameId) {
    return { ok: false, error: "Not authorized to join this game" };
  }

  const stub = getGameStub(gameId);
  const result = await stub.joinGame(userId, role);

  if (result.ok) {
    // Acknowledge match server-side so re-queuing gives a fresh game
    await mmStub.acknowledgeMatch(userId);
  }

  return result;
}

// Note: placeMove, resign, and draw offers are handled via WebSocket messages
// inside GameSession's webSocketMessage(), but could be added here if needed.

// ---------------------------------------------------------------------------
// Matchmaking Queue RPCs
// ---------------------------------------------------------------------------

export async function rpcJoinQueue(userId: string, elo: number, gameMode: string = "standard") {
  const stub = getMatchmakingStub();
  return await stub.joinQueue(userId, elo, gameMode);
}

export async function rpcCheckQueueStatus(userId: string) {
  const stub = getMatchmakingStub();
  return await stub.checkStatus(userId);
}

export async function rpcLeaveQueue(userId: string) {
  const stub = getMatchmakingStub();
  return await stub.leaveQueue(userId);
}
