// ============================================================================
// Canvas Renderer — pure stateless render functions
// Zero React state. HexCanvas owns the ref and drives frames.
// ============================================================================

import type { RenderState, AxialCoord } from "@hex/game-core";
import { axialToPixel, hexCorners, pixelToAxial } from "./hex-to-pixel";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const COLORS = {
  background: "#0f172a", // slate-900
  gridLine: "rgba(71,85,105,0.4)", // slate-600 faint
  gridHover: "rgba(99,102,241,0.3)", // indigo hover
  playerX: "#22d3ee", // cyan-400
  playerO: "#fb923c", // orange-400
  playerXGlow: "rgba(34,211,238,0.35)",
  playerOGlow: "rgba(251,146,60,0.35)",
  winLine: "rgba(253,224,71,0.85)", // yellow-300
  winLineGlow: "rgba(253,224,71,0.4)",
  lastMove: "rgba(255,255,255,0.25)",
};

// ---------------------------------------------------------------------------
// Draw single hex cell
// ---------------------------------------------------------------------------
function drawHex(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  size: number,
  fill: string | null,
  stroke: string | null,
  strokeWidth = 1,
) {
  const corners = hexCorners(center, size);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Draw piece circle
// ---------------------------------------------------------------------------
function drawPiece(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  size: number,
  color: string,
  glowColor: string,
  alpha = 1,
) {
  const radius = size * 0.38;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = size * 0.8;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------
export function render(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  width: number,
  height: number,
  _timestamp: number,
) {
  const {
    viewport,
    cells,
    hoverCell,
    lastMove,
    winLine,
    currentPlayer,
    piecesRemaining,
    boardRadius,
    isMyTurn,
    gameStatus,
  } = state;
  const { centerX, centerY, zoom } = viewport;

  // Clear
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // Viewport origin: the pixel that corresponds to hex (0,0)
  const origin = { x: cx - centerX * zoom, y: cy - centerY * zoom };

  // Determine visible cells
  const margin = 2;
  const visibleR = Math.ceil(Math.max(width, height) / 2 / zoom) + margin;
  const drawRadius = Math.min(boardRadius, visibleR);

  // All cells in a hex bounding box around origin
  const toDraw: AxialCoord[] = [];
  for (let q = -drawRadius; q <= drawRadius; q++) {
    for (
      let r = Math.max(-drawRadius, -q - drawRadius);
      r <= Math.min(drawRadius, -q + drawRadius);
      r++
    ) {
      if (
        Math.abs(q) <= boardRadius &&
        Math.abs(r) <= boardRadius &&
        Math.abs(q + r) <= boardRadius
      ) {
        toDraw.push({ q, r });
      }
    }
  }

  // Determine win line set for fast lookup
  const winLineSet = winLine ? new Set(winLine.map((c) => `${c.q},${c.r}`)) : null;

  // Draw grid cells
  for (const coord of toDraw) {
    const center = axialToPixel(coord, zoom, origin);

    // Skip off-screen cells
    if (
      center.x < -zoom ||
      center.x > width + zoom ||
      center.y < -zoom ||
      center.y > height + zoom
    ) {
      continue;
    }

    const key = `${coord.q},${coord.r}`;
    const player = (cells as Map<string, any>).get(key) ?? null;
    const isHover = hoverCell && hoverCell.q === coord.q && hoverCell.r === coord.r;
    const isLast = lastMove && lastMove.q === coord.q && lastMove.r === coord.r;
    const isWinCell = winLineSet?.has(key) ?? false;

    // Cell background
    let cellFill: string | null = null;
    if (isWinCell) {
      cellFill = "rgba(253,224,71,0.12)";
    } else if (isHover && !player && isMyTurn && gameStatus === "active") {
      cellFill = currentPlayer === "X" ? "rgba(34,211,238,0.08)" : "rgba(251,146,60,0.08)";
    }

    drawHex(ctx, center, zoom * 0.95, cellFill, COLORS.gridLine, 0.8);

    // Last move dot
    if (isLast) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, zoom * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.lastMove;
      ctx.fill();
    }

    // Win line highlight
    if (isWinCell) {
      drawHex(ctx, center, zoom * 0.92, null, COLORS.winLine, 2);
    }

    // Piece
    if (player) {
      const color = player === "X" ? COLORS.playerX : COLORS.playerO;
      const glow = player === "X" ? COLORS.playerXGlow : COLORS.playerOGlow;
      drawPiece(ctx, center, zoom, color, glow);
    }

    // Hover preview
    if (isHover && !player && isMyTurn && gameStatus === "active" && piecesRemaining > 0) {
      const color = currentPlayer === "X" ? COLORS.playerX : COLORS.playerO;
      const glow = currentPlayer === "X" ? COLORS.playerXGlow : COLORS.playerOGlow;
      drawPiece(ctx, center, zoom, color, glow, 0.4);
    }
  }
}

/**
 * Convert a canvas pixel click to axial coordinates.
 */
export function canvasClickToAxial(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  viewport: RenderState["viewport"],
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
): AxialCoord {
  const px = clientX - canvasRect.left;
  const py = clientY - canvasRect.top;
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const origin = { x: cx - viewport.centerX * zoom, y: cy - viewport.centerY * zoom };
  return pixelToAxial({ x: px, y: py }, zoom, origin);
}
