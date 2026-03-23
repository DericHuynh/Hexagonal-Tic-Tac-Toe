// components/layout/MainLayout.tsx
import { Outlet } from "@tanstack/react-router";
import Header from "../Header";
import { HexCanvas } from "../HexCanvas";
import { useState, useEffect, useCallback } from "react";
import type { GameState, AxialCoord } from "@hex/game-core";

const BOARD_RADIUS = 20;

// Pre-generate all valid coordinates once at module load (not on every render)
const ALL_COORDS: AxialCoord[] = (() => {
  const coords: AxialCoord[] = [];
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    for (
      let r = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
      r <= Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
      r++
    ) {
      coords.push({ q, r });
    }
  }
  return coords;
})();

// FIX: Include ALL required GameState fields so TypeScript doesn't complain
// and the HexCanvas renderer never hits undefined property access.
const createInitialBgState = (): GameState => ({
  gameId: "bg",
  board: new Map(),
  playerXId: "bg-x",
  playerOId: "bg-o",
  status: "active",
  currentTurn: "X",
  moveCount: 0,
  piecesPlacedThisTurn: 0,
  boardRadius: BOARD_RADIUS,
  winLine: null,
  winner: null,
  winReason: null,
  startedAt: null,
  updatedAt: Date.now(),
});

export default function MainLayout() {
  // FIX: Initialize with a function so the Map is only created once,
  // and the state is stable across SSR/client without hydration issues
  // (background canvas is client-only behind a pointer-events-none overlay).
  const [bgGameState, setBgGameState] = useState<GameState>(createInitialBgState);

  const makeRandomMove = useCallback(() => {
    setBgGameState((prev) => {
      // Reset if board is filling up or game somehow finished
      if (prev.board.size > 400 || prev.status === "finished") {
        return createInitialBgState();
      }

      // Pick a random empty cell (up to 10 attempts, then skip this tick)
      let randomCoord = ALL_COORDS[Math.floor(Math.random() * ALL_COORDS.length)];
      let attempts = 0;
      while (prev.board.has(`${randomCoord.q},${randomCoord.r}`) && attempts < 10) {
        randomCoord = ALL_COORDS[Math.floor(Math.random() * ALL_COORDS.length)];
        attempts++;
      }
      // If we couldn't find an empty cell in 10 tries, skip this tick
      if (prev.board.has(`${randomCoord.q},${randomCoord.r}`)) return prev;

      const newBoard = new Map(prev.board);
      newBoard.set(`${randomCoord.q},${randomCoord.r}`, prev.currentTurn);

      // Replicate the real turn rules: X starts with 1 piece, then 2 per turn
      const isFirstMove = prev.moveCount === 0;
      const maxPiecesThisTurn = isFirstMove ? 1 : 2;
      const nextPiecesPlaced = prev.piecesPlacedThisTurn + 1;

      let nextTurn = prev.currentTurn;
      let nextPiecesPlacedState = nextPiecesPlaced;
      let nextMoveCount = prev.moveCount;

      if (nextPiecesPlaced >= maxPiecesThisTurn) {
        nextTurn = prev.currentTurn === "X" ? "O" : "X";
        nextPiecesPlacedState = 0;
        nextMoveCount = prev.moveCount + 1;
      }

      return {
        ...prev,
        board: newBoard,
        currentTurn: nextTurn,
        piecesPlacedThisTurn: nextPiecesPlacedState,
        moveCount: nextMoveCount,
        updatedAt: Date.now(),
      };
    });
  }, []);

  // Background animation loop
  useEffect(() => {
    const timer = setInterval(makeRandomMove, 150);
    return () => clearInterval(timer);
  }, [makeRandomMove]);

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-x-hidden flex flex-col">
      {/* Full-screen animated background — pointer-events-none so it never intercepts clicks */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <HexCanvas gameState={bgGameState} userId="spectator" />
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_60%,rgba(2,6,23,0.9)_90%,rgba(2,6,23,1)_100%)]" />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 left-0 w-full z-50">
        <Header />
      </div>

      {/* Page content */}
      <main className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
