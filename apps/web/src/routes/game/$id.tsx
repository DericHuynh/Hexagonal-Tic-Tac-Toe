import { createFileRoute, useParams } from "@tanstack/react-router";
import { useGameState } from "../../hooks/useGameState";
import { HexCanvas } from "../../components/HexCanvas";
import { GameHUD } from "../../components/GameHUD";
import type { AxialCoord } from "@hex/game-core";

export const Route = createFileRoute("/game/$id")({
  component: GamePage,
});

function GamePage() {
  const { id } = useParams({ from: "/game/$id" });
  // For demo: use a stable guest user id based on session storage
  const userId = (() => {
    if (typeof window === "undefined") return "guest";
    let uid = sessionStorage.getItem("hex_user_id");
    if (!uid) {
      uid = `guest_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("hex_user_id", uid);
    }
    return uid;
  })();

  const { gameState, isConnected, placeMove, resign, offerDraw, respondDraw, drawOffered } =
    useGameState(id, userId);

  const handleCellClick = (coord: AxialCoord) => {
    placeMove(coord.q, coord.r);
  };

  if (!gameState) {
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
        <HexCanvas gameState={gameState} userId={userId} onCellClick={handleCellClick} />

        {/* HUD overlay */}
        <GameHUD
          gameState={gameState}
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
