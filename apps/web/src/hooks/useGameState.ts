import { useState, useEffect, useRef, useCallback } from "react";
import type { GameState, ServerMessage, ClientMessage } from "@hex/game-core";

export interface UseGameStateReturn {
  gameState: GameState | null;
  isConnected: boolean;
  placeMove: (q: number, r: number) => void;
  resign: () => void;
  offerDraw: () => void;
  respondDraw: (accept: boolean) => void;
  drawOffered: boolean;
}

export function useGameState(gameId: string, userId: string): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!gameId || !userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/game/${gameId}/ws?userId=${encodeURIComponent(userId)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        switch (msg.type) {
          case "sync":
            setGameState(msg.state);
            break;
          case "move":
            setGameState(msg.state);
            break;
          case "turn_change":
            setGameState((prev) =>
              prev
                ? {
                    ...prev,
                    currentTurn: msg.currentTurn,
                    piecesPlacedThisTurn: 2 - msg.piecesRemaining,
                  }
                : prev,
            );
            break;
          case "game_over":
            setGameState(msg.state);
            break;
          case "draw_offered":
            setDrawOffered(true);
            break;
          case "draw_declined":
            setDrawOffered(false);
            break;
          case "opponent_status":
            // Could add opponent online indicator here
            break;
          default:
            break;
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setIsConnected(false);
      setDrawOffered(false);
    };
  }, [gameId, userId]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const placeMove = useCallback(
    (q: number, r: number) => {
      send({ type: "place", q, r });
    },
    [send],
  );

  const resign = useCallback(() => {
    send({ type: "resign" });
  }, [send]);

  const offerDraw = useCallback(() => {
    send({ type: "draw_offer" });
  }, [send]);

  const respondDraw = useCallback(
    (accept: boolean) => {
      send({ type: "draw_response", accept });
      setDrawOffered(false);
    },
    [send],
  );

  return { gameState, isConnected, placeMove, resign, offerDraw, respondDraw, drawOffered };
}
