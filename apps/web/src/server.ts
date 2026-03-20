import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";
import { GameSession } from "./durable-object";
import { MatchmakingQueue } from "./matchmaking-queue";

// Re-export DOs so wrangler can find them
export { GameSession, MatchmakingQueue };

/** Matches /game/:id/ws  */
const WS_GAME_PATTERN = /^\/game\/([^/]+)\/ws$/;

export default createServerEntry({
  fetch(request) {
    const url = new URL(request.url);

    // Intercept WebSocket upgrade for game real-time sync
    const wsMatch = url.pathname.match(WS_GAME_PATTERN);
    if (wsMatch && request.headers.get("Upgrade") === "websocket") {
      const gameId = wsMatch[1];
      const doId = env.GAME_SESSION.idFromName(gameId);
      const stub = env.GAME_SESSION.get(doId);
      return stub.fetch(request);
    }

    return handler.fetch(request);
  },
});
