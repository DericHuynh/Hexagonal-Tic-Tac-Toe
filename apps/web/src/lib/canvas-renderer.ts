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
  background: "#0f172a",       // slate-900
  gridLine: "rgba(71,85,105,0.4)",
  gridLineInRange: "rgba(99,102,241,0.18)",  // subtle indigo tint for reachable cells
  gridLineOccupied: "rgba(71,85,105,0.6)",
  playerX: "#22d3ee",           // cyan-400
  playerO: "#fb923c",           // orange-400
  playerXGlow: "rgba(34,211,238,0.35)",
  playerOGlow: "rgba(251,146,60,0.35)",
  winLine: "rgba(253,224,71,0.85)",
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
// Placement validity helpers
// ---------------------------------------------------------------------------

/**
 * Compute the set of all cells that are valid placements given the current board.
 * Returns null if the board is empty (all cells are valid in that case).
 * Stored as a Set<string> of "q,r" keys for O(1) lookup during rendering.
 */
function buildReachableSet(
  cells: Map<string, unknown>,
  maxPlacementDistance: number,
): Set<string> | null {
  if (cells.size === 0) return null; // empty board → everywhere is valid

  const reachable = new Set<string>();
  for (const [key] of cells) {
    const parts = key.split(",");
    const oq = parseInt(parts[0], 10);
    const or = parseInt(parts[1], 10);
    // Iterate a bounding box of radius maxPlacementDistance in axial space
    for (let dq = -maxPlacementDistance; dq <= maxPlacementDistance; dq++) {
      const drMin = Math.max(-maxPlacementDistance, -dq - maxPlacementDistance);
      const drMax = Math.min(maxPlacementDistance, -dq + maxPlacementDistance);
      for (let dr = drMin; dr <= drMax; dr++) {
        const nk = `${oq + dq},${or + dr}`;
        if (!cells.has(nk)) {
          reachable.add(nk);
        }
      }
    }
  }
  return reachable;
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
    isMyTurn,
    gameStatus,
  } = state;

  // maxPlacementDistance comes from RenderState if present, else default to 8
  const maxPlacementDistance = (state as any).maxPlacementDistance ?? 8;

  const { centerX, centerY, zoom } = viewport;

  // Clear
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // Pixel origin for hex (0,0)
  const origin = { x: cx - centerX * zoom, y: cy - centerY * zoom };

  // ------------------------------------------------------------------
  // Determine which cells are visible on screen.
  // We iterate a hex-shaped band around the axial coordinate that sits
  // at the current screen center, sized to cover the full viewport.
  // No boardRadius clamp — the board is infinite.
  // ------------------------------------------------------------------
  const margin = 2;
  const screenCenterAxial = pixelToAxial({ x: cx, y: cy }, zoom, origin);
  // How many hex cells fit from center to edge of the screen
  const visibleR = Math.ceil(Math.max(width, height) / 2 / zoom) + margin;

  const cq = screenCenterAxial.q;
  const cr = screenCenterAxial.r;

  const toDraw: AxialCoord[] = [];
  for (let dq = -visibleR; dq <= visibleR; dq++) {
    const q = cq + dq;
    // Axial hex band: valid r range for this q offset
    for (
      let dr = Math.max(-visibleR, -dq - visibleR);
      dr <= Math.min(visibleR, -dq + visibleR);
      dr++
    ) {
      toDraw.push({ q, r: cr + dr });
    }
  }

  // ------------------------------------------------------------------
  // Build lookup structures
  // ------------------------------------------------------------------
  const winLineSet = winLine ? new Set(winLine.map((c) => `${c.q},${c.r}`)) : null;

  // Reachable set: cells within maxPlacementDistance of any occupied cell.
  // null means the board is empty and every cell is reachable.
  const reachableSet = isMyTurn && gameStatus === "active"
    ? buildReachableSet(cells as Map<string, unknown>, maxPlacementDistance)
    : null;

  // ------------------------------------------------------------------
  // Draw grid cells
  // ------------------------------------------------------------------
  for (const coord of toDraw) {
    const center = axialToPixel(coord, zoom, origin);

    // Cull cells whose center is off screen (pixel-space cull)
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

    // A cell is a valid placement target if:
    //  - the board is empty (reachableSet === null), OR
    //  - the cell is in the reachable set
    const isReachable = !player && (reachableSet === null || reachableSet.has(key));

    // ------ Cell background & border ------
    let cellFill: string | null = null;
    let cellStroke = COLORS.gridLine;
    let cellStrokeWidth = 0.8;

    if (isWinCell) {
      cellFill = "rgba(253,224,71,0.12)";
      cellStroke = COLORS.winLine;
      cellStrokeWidth = 2;
    } else if (isHover && isReachable && isMyTurn && gameStatus === "active") {
      cellFill = currentPlayer === "X" ? "rgba(34,211,238,0.12)" : "rgba(251,146,60,0.12)";
      cellStroke = currentPlayer === "X" ? "rgba(34,211,238,0.5)" : "rgba(251,146,60,0.5)";
      cellStrokeWidth = 1.2;
    } else if (isReachable && isMyTurn && gameStatus === "active") {
      // Subtle highlight on all reachable empty cells so the player can see
      // the playable zone expand organically from existing pieces.
      cellStroke = COLORS.gridLineInRange;
      cellStrokeWidth = 0.8;
    }

    drawHex(ctx, center, zoom * 0.95, cellFill, cellStroke, cellStrokeWidth);

    // Last move dot
    if (isLast) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, zoom * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.lastMove;
      ctx.fill();
    }

    // Win line border
    if (isWinCell) {
      drawHex(ctx, center, zoom * 0.92, null, COLORS.winLine, 2);
    }

    // Piece
    if (player) {
      const color = player === "X" ? COLORS.playerX : COLORS.playerO;
      const glow  = player === "X" ? COLORS.playerXGlow : COLORS.playerOGlow;
      drawPiece(ctx, center, zoom, color, glow);
    }

    // Hover preview ghost piece — only on valid placement cells
    if (isHover && isReachable && isMyTurn && gameStatus === "active" && piecesRemaining > 0) {
      const color = currentPlayer === "X" ? COLORS.playerX : COLORS.playerO;
      const glow  = currentPlayer === "X" ? COLORS.playerXGlow : COLORS.playerOGlow;
      drawPiece(ctx, center, zoom, color, glow, 0.4);
    }
  }
}

// ---------------------------------------------------------------------------
// Click → Axial conversion
// ---------------------------------------------------------------------------
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
