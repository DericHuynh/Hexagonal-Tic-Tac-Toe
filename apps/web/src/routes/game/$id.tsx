import { createFileRoute, useParams } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useGameState } from "../../hooks/useGameState";
import { HexCanvas } from "../../components/HexCanvas";
import { GameHUD } from "../../components/GameHUD";
import type { AxialCoord, GameState, Player } from "@hex/game-core";
import { rpcGetGameState, rpcJoinGame } from "../../lib/server-rpc.server";

/** JSON round-trips turn Map -> plain object. This restores board to Map<string, Player>. */
function deserializeBoardMap(state: GameState): GameState {
  const rawBoard = state.board as unknown as Record<string, Player>;
  return { ...state, board: new Map<string, Player>(Object.entries(rawBoard)) };
}

const getGameFn = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<GameState> => {
    const res = await rpcGetGameState(id);
    return JSON.parse(JSON.stringify(res)) as GameState;
  });

const joinGameFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; userId: string; role: "X" | "O" }) => d)
  .handler(async ({ data }) => {
    const res = await rpcJoinGame(data.id, data.userId, data.role);
    return { ok: res.ok, error: res.error } as { ok: boolean; error?: string };
  });


export const Route = createFileRoute("/game/$id")({
  component: GamePage,
  loader: async ({ params }) => {
    return await getGameFn({ data: params.id });
  },
});

function GamePage() {
  const { id } = useParams({ from: "/game/$id" });
  const rawInitialState = Route.useLoaderData();
  const initialGameState = deserializeBoardMap(rawInitialState);

  const [userId, setUserId] = useState("guest");
  useEffect(() => {
    if (typeof window !== "undefined") {
      let uid = sessionStorage.getItem("hex_user_id");
      if (!uid) {
        uid = `guest_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem("hex_user_id", uid);
      }
      setUserId(uid);
    }
  }, []);

  const { gameState, isConnected, placeMove, resign, offerDraw, respondDraw, drawOffered } =
    useGameState(id, userId);

  useEffect(() => {
    if (!initialGameState || userId === "guest") return;
    const currentState = gameState || initialGameState;

    if (currentState.status === "waiting") {
      const isPlayerX = currentState.playerXId === userId;
      const isPlayerO = currentState.playerOId === userId;

      if (!isPlayerX && !isPlayerO) {
        const roleToTake = !currentState.playerXId ? "X" : "O";
        void joinGameFn({ data: { id, userId, role: roleToTake } });
      }
    }
  }, [gameState, initialGameState, id, userId]);

  const handleCellClick = (coord: AxialCoord) => {
    placeMove(coord.q, coord.r);
  };

  const currentState = gameState || initialGameState;

  if (!currentState) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connecting to game…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden">
      <div className="relative w-full h-full">
        {/* Canvas game board */}
        <HexCanvas gameState={currentState} userId={userId} onCellClick={handleCellClick} />

        {/* HUD overlay */}
        <GameHUD
          gameState={currentState}
          userId={userId}
          isConnected={isConnected}
          onResign={resign}
          onOfferDraw={offerDraw}
          drawOffered={drawOffered}
          onRespondDraw={respondDraw}
        />

        {/* Game ID info */}
        <div className="absolute bottom-2 left-4 text-slate-600 text-xs font-mono">Game: {id}</div>
      </div>
    </div>
  );
}
