import { useRef, useEffect, useCallback, useState } from "react";
import type { GameState, AxialCoord } from "@hex/game-core";
import { render, canvasClickToAxial } from "../lib/canvas-renderer";
import { useCanvasViewport } from "../hooks/useCanvasViewport";

interface HexCanvasProps {
  gameState: GameState;
  userId: string;
  onCellClick?: (coord: AxialCoord) => void;
}

export function HexCanvas({ gameState, userId, onCellClick }: HexCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { viewport } = useCanvasViewport(canvasRef);
  const rafRef = useRef<number | null>(null);
  const [_hoverCell, setHoverCell] = useState<AxialCoord | null>(null);
  const hoverRef = useRef<AxialCoord | null>(null);

  const isPlayerX = gameState.playerXId === userId;
  const isPlayerO = gameState.playerOId === userId;
  const isMyTurn =
    gameState.status === "active" &&
    ((gameState.currentTurn === "X" && isPlayerX) || (gameState.currentTurn === "O" && isPlayerO));

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const loop = (ts: number) => {
      if (!running) return;

      // Resize canvas to display size
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Build render state
      const renderState = {
        cells: gameState.board,
        viewport,
        hoverCell: hoverRef.current,
        lastMove: gameState.winLine?.[0] ?? null,
        winLine: gameState.winLine,
        currentPlayer: gameState.currentTurn,
        piecesRemaining:
          gameState.status === "active"
            ? (gameState.moveCount === 0 ? 1 : 2) - gameState.piecesPlacedThisTurn
            : 0,
        boardRadius: gameState.boardRadius,
        isMyTurn,
        gameStatus: gameState.status,
      };

      render(ctx, renderState, width, height, ts);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, viewport, isMyTurn]);

  // Mouse hover tracking
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const coord = canvasClickToAxial(
        e.clientX,
        e.clientY,
        rect,
        viewport,
        rect.width,
        rect.height,
        viewport.zoom,
      );
      // validate coord
      const { BOARD_RADIUS } = { BOARD_RADIUS: gameState.boardRadius };
      if (
        Math.abs(coord.q) <= BOARD_RADIUS &&
        Math.abs(coord.r) <= BOARD_RADIUS &&
        Math.abs(coord.q + coord.r) <= BOARD_RADIUS
      ) {
        hoverRef.current = coord;
        setHoverCell(coord);
      } else {
        hoverRef.current = null;
        setHoverCell(null);
      }
    },
    [viewport, gameState.boardRadius],
  );

  const onMouseLeave = useCallback(() => {
    hoverRef.current = null;
    setHoverCell(null);
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || !onCellClick) return;
      if (viewport.isDragging) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const coord = canvasClickToAxial(
        e.clientX,
        e.clientY,
        rect,
        viewport,
        rect.width,
        rect.height,
        viewport.zoom,
      );
      onCellClick(coord);
    },
    [isMyTurn, onCellClick, viewport],
  );

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        cursor: isMyTurn ? "crosshair" : "grab",
        touchAction: "none",
      }}
    />
  );
}
