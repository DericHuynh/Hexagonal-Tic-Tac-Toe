import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";
import { GameSession } from "./durable-object";
import { MatchmakingQueue } from "./matchmaking-queue";

export { GameSession, MatchmakingQueue };

/** Matches /game/:id/ws and extracts the game id */

export const WS_GAME_PATTERN = /^\/game\/([^/]+)\/ws$/;

/** Matches /matchmaking/ws for the matchmaking queue */

export const WS_MATCHMAKING_PATTERN = /^\/matchmaking\/ws$/;

export default createServerEntry({
  fetch(request) {
    const url = new URL(request.url);

    // Intercept WebSocket upgrade requests for game sessions.
    // Pattern: /game/:id/ws?playerId=xxx
    const gameMatch = url.pathname.match(WS_GAME_PATTERN);
    if (gameMatch && request.headers.get("Upgrade") === "websocket") {
      const gameId = gameMatch[1];
      const stub = env.GAME_SESSION.getByName(gameId);
      return stub.fetch(request);
    }

    // Intercept WebSocket upgrade requests for matchmaking.
    // Pattern: /matchmaking/ws?userId=xxx
    const matchmakingMatch = url.pathname.match(WS_MATCHMAKING_PATTERN);
    if (matchmakingMatch && request.headers.get("Upgrade") === "websocket") {
      const stub = env.MATCHMAKING_QUEUE.getByName("matchmaking-queue");
      return stub.fetch(request);
    }

    return handler.fetch(request);
  },
});
