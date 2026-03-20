import { useState, useEffect, useRef, useCallback } from "react";
import type { GameState, ServerMessage, ClientMessage, Player } from "@hex/game-core";

/** JSON turns Map -> plain object. This restores the board back to Map<string, Player> */
function deserializeGameState(state: GameState): GameState {
  const rawBoard = state.board as unknown as Record<string, Player>;
  const board = new Map<string, Player>(Object.entries(rawBoard));
  return { ...state, board };
}

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
    if (!gameId || !userId || userId === "guest") return;

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
            setGameState(deserializeGameState(msg.state));
            break;
          case "move":
            // Delta update: merge new cell into existing board Map
            setGameState((prev) => {
              if (!prev) return prev;
              const newBoard = new Map(prev.board);
              newBoard.set(`${msg.q},${msg.r}`, msg.player);
              return {
                ...prev,
                board: newBoard,
                currentTurn: msg.currentTurn,
                piecesPlacedThisTurn: msg.piecesPlacedThisTurn,
                moveCount: msg.moveCount,
              };
            });
            break;
          case "game_over":
            setGameState((prev) =>
              prev
                ? {
                    ...prev,
                    status: "finished",
                    winner: msg.winner,
                    winReason: msg.reason,
                    winLine: msg.winLine,
                  }
                : prev,
            );
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
