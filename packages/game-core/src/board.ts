// ============================================================================
// Hexagonal Tic-Tac-Toe — Board State
// Pure functions for managing the sparse board state (Map<string, Player>).
// ============================================================================

import type { AxialCoord, Board, CellEntry, Player } from "./types";
import { MAX_PLACEMENT_DISTANCE } from "./types";
import { axialToKey, keyToAxial, hexDistance } from "./hex";

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export function createBoard(): Board {
  return new Map<string, Player>();
}

// ---------------------------------------------------------------------------
// Cell Access
// ---------------------------------------------------------------------------

export function getCell(board: Board, coord: AxialCoord): Player | null {
  return board.get(axialToKey(coord)) ?? null;
}

export function isCellEmpty(board: Board, coord: AxialCoord): boolean {
  return !board.has(axialToKey(coord));
}

export function isCellOccupied(board: Board, coord: AxialCoord): boolean {
  return board.has(axialToKey(coord));
}

// ---------------------------------------------------------------------------
// Mutation (immutable — returns new Map)
// ---------------------------------------------------------------------------

export function setCell(board: Board, coord: AxialCoord, player: Player): Board {
  const key = axialToKey(coord);
  if (board.has(key)) {
    throw new Error(`Cell (${coord.q}, ${coord.r}) is already occupied`);
  }
  const next = new Map(board);
  next.set(key, player);
  return next;
}

export function removeCell(board: Board, coord: AxialCoord): Board {
  const key = axialToKey(coord);
  if (!board.has(key)) {
    return board; // no change needed
  }
  const next = new Map(board);
  next.delete(key);
  return next;
}

export function forceSetCell(board: Board, coord: AxialCoord, player: Player): Board {
  const next = new Map(board);
  next.set(axialToKey(coord), player);
  return next;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function countPieces(board: Board): number {
  return board.size;
}

export function countPlayerPieces(board: Board, player: Player): number {
  let count = 0;
  for (const p of board.values()) {
    if (p === player) count++;
  }
  return count;
}

export function isBoardFull(board: Board, radius: number = Infinity): boolean {
  if (!Number.isFinite(radius)) return false; // Dynamic/infinite boards don't natively fill up
  const totalCells = 3 * radius * (radius + 1) + 1;
  return board.size >= totalCells;
}

export function getOccupiedCells(board: Board): CellEntry[] {
  const entries: CellEntry[] = [];
  for (const [key, player] of board) {
    entries.push({ coord: keyToAxial(key), player });
  }
  return entries;
}

export function getPlayerCells(board: Board, player: Player): AxialCoord[] {
  const cells: AxialCoord[] = [];
  for (const [key, p] of board) {
    if (p === player) {
      cells.push(keyToAxial(key));
    }
  }
  return cells;
}

export function getLastMove(
  moveHistory: { q: number; r: number; moveIndex: number }[],
): AxialCoord | null {
  if (moveHistory.length === 0) return null;
  const last = moveHistory.reduce((a, b) => (a.moveIndex > b.moveIndex ? a : b));
  return { q: last.q, r: last.r };
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export function boardToArray(board: Board): { q: number; r: number; player: Player }[] {
  const result: { q: number; r: number; player: Player }[] = [];
  for (const [key, player] of board) {
    const coord = keyToAxial(key);
    result.push({ q: coord.q, r: coord.r, player });
  }
  return result;
}

export function boardFromArray(cells: { q: number; r: number; player: Player }[]): Board {
  const board = createBoard();
  for (const cell of cells) {
    board.set(axialToKey({ q: cell.q, r: cell.r }), cell.player);
  }
  return board;
}

export function boardToString(board: Board): string {
  return JSON.stringify(boardToArray(board));
}

export function boardFromString(str: string): Board {
  const cells = JSON.parse(str) as { q: number; r: number; player: Player }[];
  return boardFromArray(cells);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isValidMove(
  board: Board,
  coord: AxialCoord,
  maxDistance: number = MAX_PLACEMENT_DISTANCE,
): { valid: boolean; error?: string } {
  if (!isCellEmpty(board, coord)) {
    return { valid: false, error: `Cell (${coord.q}, ${coord.r}) is already occupied` };
  }

  // Dynamic Size placement logic: Valid moves must fall within X hexes of ANY existing piece.
  if (board.size > 0) {
    let withinRange = false;
    for (const [key] of board) {
      const occ = keyToAxial(key);
      if (hexDistance(coord, occ) <= maxDistance) {
        withinRange = true;
        break;
      }
    }

    if (!withinRange) {
      return { valid: false, error: `Move must be within ${maxDistance} hexes of an existing piece` };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Debug / Display
// ---------------------------------------------------------------------------

export function boardToDebugString(board: Board, radius: number = 5): string {
  const lines: string[] = [];
  for (let r = -radius; r <= radius; r++) {
    const indent = Math.abs(r);
    let line = " ".repeat(indent);
    for (let q = -radius; q <= radius; q++) {
      if (Math.abs(-q - r) > radius) continue;
      const cell = getCell(board, { q, r });
      if (cell === "X") line += "X ";
      else if (cell === "O") line += "O ";
      else line += ". ";
    }
    lines.push(line.trimEnd());
  }
  return lines.join("\n");
}
