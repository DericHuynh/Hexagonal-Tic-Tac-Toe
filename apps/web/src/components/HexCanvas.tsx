import { useRef, useEffect, useCallback, useState } from "react";
import type { GameState, AxialCoord } from "@hex/game-core";
import { isValidMove, MAX_PLACEMENT_DISTANCE } from "@hex/game-core";
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

  // Keep a ref to the latest board so hover/click validation is never stale
  const boardRef = useRef(gameState.board);
  useEffect(() => { boardRef.current = gameState.board; }, [gameState.board]);

  const isPlayerX = gameState.playerXId === userId;
  const isPlayerO = gameState.playerOId === userId;
  const isMyTurn =
    gameState.status === "active" &&
    ((gameState.currentTurn === "X" && isPlayerX) ||
     (gameState.currentTurn === "O" && isPlayerO));

  // ------------------------------------------------------------------
  // Draw loop
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const loop = (ts: number) => {
      if (!running) return;

      // Resize canvas to match display size (handles DPR scaling once per resize)
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.scale(dpr, dpr);
      }

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
        // boardRadius is kept in RenderState for any legacy use but the renderer
        // no longer uses it to clamp the visible grid — the board is infinite.
        boardRadius: gameState.boardRadius,
        maxPlacementDistance: MAX_PLACEMENT_DISTANCE,
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

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /** Resolve a canvas mouse event to an axial coord. */
  const eventToAxial = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): AxialCoord | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return canvasClickToAxial(
        e.clientX,
        e.clientY,
        rect,
        viewport,
        rect.width,
        rect.height,
        viewport.zoom,
      );
    },
    [viewport],
  );

  /** Return true if placing on `coord` is legal given the current board. */
  const isPlacementValid = useCallback((coord: AxialCoord): boolean => {
    return isValidMove(boardRef.current, coord, MAX_PLACEMENT_DISTANCE).valid;
  }, []);

  // ------------------------------------------------------------------
  // Mouse hover
  // ------------------------------------------------------------------
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coord = eventToAxial(e);
      if (!coord) {
        hoverRef.current = null;
        setHoverCell(null);
        return;
      }

      // Only show hover on cells that are actually legal to place on.
      // This prevents the ghost-piece preview from appearing in unreachable space
      // and implicitly shows the playable zone boundary.
      if (isMyTurn && gameState.status === "active" && isPlacementValid(coord)) {
        hoverRef.current = coord;
        setHoverCell(coord);
      } else {
        hoverRef.current = null;
        setHoverCell(null);
      }
    },
    [eventToAxial, isPlacementValid, isMyTurn, gameState.status],
  );

  const onMouseLeave = useCallback(() => {
    hoverRef.current = null;
    setHoverCell(null);
  }, []);

  // ------------------------------------------------------------------
  // Click
  // ------------------------------------------------------------------
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || !onCellClick) return;
      // Ignore click if the user was dragging (panning the board)
      if (viewport.isDragging) return;

      const coord = eventToAxial(e);
      if (!coord) return;

      // Enforce placement rules: must be within MAX_PLACEMENT_DISTANCE of any
      // existing piece (or anywhere if the board is empty).
      if (!isPlacementValid(coord)) return;

      onCellClick(coord);
    },
    [isMyTurn, onCellClick, viewport.isDragging, eventToAxial, isPlacementValid],
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
