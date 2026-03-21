import { Outlet } from "@tanstack/react-router";
import Header from "../Header";
import { HexCanvas } from "../HexCanvas";
import { useState, useEffect, useCallback } from "react";
import type { GameState, AxialCoord } from "@hex/game-core";

const BOARD_RADIUS = 20;

// Helper to generate all valid coordinates once
const ALL_COORDS: AxialCoord[] = (() => {
  const coords: AxialCoord[] = [];
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    for (let r = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS); r <= Math.min(BOARD_RADIUS, -q + BOARD_RADIUS); r++) {
      coords.push({ q, r });
    }
  }
  return coords;
})();

const createInitialBgState = (): GameState => ({
  board: new Map(),
  playerXId: "bg-x",
  playerOId: "bg-o",
  status: "active",
  currentTurn: "X",
  moveCount: 0,
  piecesPlacedThisTurn: 0,
  boardRadius: BOARD_RADIUS,
  winLine: null,
});

export default function MainLayout() {
  const [bgGameState, setBgGameState] = useState<GameState>(createInitialBgState);

  const makeRandomMove = useCallback(() => {
    setBgGameState((prev) => {
      // Fix: If board is full or game won, reset to initial object structure
      if (prev.board.size > 400 || prev.status === "finished") {
        return createInitialBgState();
      }

      // Optimization: Pick random spots instead of filtering 1200+ coords every tick
      let randomCoord = ALL_COORDS[Math.floor(Math.random() * ALL_COORDS.length)];
      let attempts = 0;
      // Try to find an empty spot up to 10 times
      while (prev.board.has(`${randomCoord.q},${randomCoord.r}`) && attempts < 10) {
        randomCoord = ALL_COORDS[Math.floor(Math.random() * ALL_COORDS.length)];
        attempts++;
      }

      const newBoard = new Map(prev.board);
      newBoard.set(`${randomCoord.q},${randomCoord.r}`, prev.currentTurn);

      // Game Logic: X starts with 1, then everyone gets 2
      const isFirstMove = prev.moveCount === 0;
      const maxPiecesThisTurn = isFirstMove ? 1 : 2;

      let nextTurn = prev.currentTurn;
      let nextPiecesPlaced = prev.piecesPlacedThisTurn + 1;
      let nextMoveCount = prev.moveCount;

      if (nextPiecesPlaced >= maxPiecesThisTurn) {
        nextTurn = prev.currentTurn === "X" ? "O" : "X";
        nextPiecesPlaced = 0;
        nextMoveCount++;
      }

      return {
        ...prev,
        board: newBoard,
        currentTurn: nextTurn,
        piecesPlacedThisTurn: nextPiecesPlaced,
        moveCount: nextMoveCount,
      };
    });
  }, []);

  // Background Game Loop
  useEffect(() => {
    const timer = setInterval(makeRandomMove, 150);
    return () => clearInterval(timer);
  }, [makeRandomMove]);

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Full-screen animated background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <HexCanvas
          gameState={bgGameState}
          userId="spectator"
        />
        {/* Deep vignette: covers edges and top (under header) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_60%,rgba(2,6,23,0.9)_90%,rgba(2,6,23,1)_100%)]" />
      </div>

      {/* Fixed header on top of background */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>

      {/* Main content area with padding top to clear header */}
      <main className="relative z-10 pt-20">
        <Outlet />
      </main>
    </div>
  );
}
