// ============================================================================
// Hexagonal Tic-Tac-Toe — Win Checker
// Pure functions for detecting 6-in-a-row wins along the 3 hex axes.
// ============================================================================

import type { AxialCoord, Board, Player } from "./types";
import { BOARD_RADIUS, WIN_LENGTH, HEX_DIRECTIONS } from "./types";
import {
  axialToKey,
  getAxisDirections,
  isValidCell,
  walkDirection,
} from "./hex";
import { getCell } from "./board";

// ---------------------------------------------------------------------------
// Core Win Detection
// ---------------------------------------------------------------------------

/**
 * Walk along one direction from `start`, collecting consecutive cells occupied
 * by `player`. Stops at board edge or a different player / empty cell.
 */
function walkConsecutive(
  board: Board,
  start: AxialCoord,
  dirIndex: number,
  player: Player,
  radius: number,
): AxialCoord[] {
  return walkDirection(
    start,
    dirIndex,
    radius, // max steps bounded by board size
    radius,
    (coord) => getCell(board, coord) === player,
  );
}

/**
 * Check if placing a piece at `coord` creates a win for `player`.
 * Returns the array of winning cell coordinates (length >= WIN_LENGTH),
 * or null if no win.
 *
 * Algorithm: for each of the 3 axes, walk positive and negative directions
 * counting consecutive same-player pieces. If total >= WIN_LENGTH, it's a win.
 */
export function checkWinFromCell(
  board: Board,
  coord: AxialCoord,
  player: Player,
  winLength: number = WIN_LENGTH,
  radius: number = BOARD_RADIUS,
): AxialCoord[] | null {
  // Check each of the 3 axes
  for (let axis = 0; axis < 3; axis++) {
    const [dirPos, dirNeg] = getAxisDirections(axis);

    // Walk in positive direction
    const posCells = walkConsecutive(board, coord, dirPos, player, radius);

    // Walk in negative direction
    const negCells = walkConsecutive(board, coord, dirNeg, player, radius);

    // Total line = neg (reversed) + [coord] + pos
    const totalLength = negCells.length + 1 + posCells.length;

    if (totalLength >= winLength) {
      // Build the full winning line
      const line: AxialCoord[] = [...negCells.reverse(), coord, ...posCells];
      return line;
    }
  }

  return null;
}

/**
 * Check if there is any win on the board.
 * Optionally only checks around the most recently placed cell for efficiency.
 * Returns { player, line } if a win exists, null otherwise.
 */
export function checkAnyWin(
  board: Board,
  winLength: number = WIN_LENGTH,
  radius: number = BOARD_RADIUS,
  lastMove?: AxialCoord,
): { player: Player; line: AxialCoord[] } | null {
  // If we have a last move, only check around that cell
  if (lastMove) {
    const player = getCell(board, lastMove);
    if (!player) return null;

    const line = checkWinFromCell(board, lastMove, player, winLength, radius);
    if (line) {
      return { player, line };
    }
    return null;
  }

  // Otherwise check every occupied cell (expensive — use only for validation)
  for (const [key, player] of board) {
    const parts = key.split(",");
    const coord: AxialCoord = {
      q: parseInt(parts[0], 10),
      r: parseInt(parts[1], 10),
    };
    const line = checkWinFromCell(board, coord, player, winLength, radius);
    if (line) {
      return { player, line };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Multiple Win Lines (for lesson highlighting)
// ---------------------------------------------------------------------------

/**
 * Get ALL lines of `winLength` that pass through a given cell.
 * Used for lesson puzzles where we want to highlight all possible winning lines.
 */
export function getWinLines(
  board: Board,
  coord: AxialCoord,
  winLength: number = WIN_LENGTH,
  radius: number = BOARD_RADIUS,
): AxialCoord[][] {
  const player = getCell(board, coord);
  if (!player) return [];

  const lines: AxialCoord[][] = [];

  for (let axis = 0; axis < 3; axis++) {
    const [dirPos, dirNeg] = getAxisDirections(axis);

    const posCells = walkConsecutive(board, coord, dirPos, player, radius);
    const negCells = walkConsecutive(board, coord, dirNeg, player, radius);

    const totalLength = negCells.length + 1 + posCells.length;

    if (totalLength >= winLength) {
      const line: AxialCoord[] = [...negCells.reverse(), coord, ...posCells];
      lines.push(line);
    }
  }

  return lines;
}

/**
 * Get all potential winning lines through a cell, regardless of current
 * board state. Returns lines of `length` cells extending in both directions
 * along each axis (only cells within board bounds).
 *
 * Useful for threat detection and lesson puzzle generation.
 */
export function getPotentialLines(
  coord: AxialCoord,
  length: number = WIN_LENGTH,
  radius: number = BOARD_RADIUS,
): AxialCoord[][] {
  const lines: AxialCoord[][] = [];

  for (let axis = 0; axis < 3; axis++) {
    const [dirPos, dirNeg] = getAxisDirections(axis);
    const dir = HEX_DIRECTIONS[dirPos];

    // Generate all contiguous segments of `length` cells that include `coord`
    // along this axis, within board bounds.
    // Walk backward from coord to find all possible starting positions
    const backward: AxialCoord[] = [coord];
    for (let i = 1; i < length; i++) {
      const cell: AxialCoord = {
        q: coord.q - dir.q * i,
        r: coord.r - dir.r * i,
      };
      if (!isValidCell(cell, radius)) break;
      backward.push(cell);
    }

    const forward: AxialCoord[] = [];
    for (let i = 1; i < length; i++) {
      const cell: AxialCoord = {
        q: coord.q + dir.q * i,
        r: coord.r + dir.r * i,
      };
      if (!isValidCell(cell, radius)) break;
      forward.push(cell);
    }

    // Total available cells along this axis through coord
    const allCells = [...backward.reverse(), ...forward];

    // Extract all contiguous segments of `length` that include coord's position
    const coordIndex = backward.length - 1;
    for (let start = 0; start <= allCells.length - length; start++) {
      const end = start + length - 1;
      if (start <= coordIndex && coordIndex <= end) {
        lines.push(allCells.slice(start, start + length));
      }
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Threat Detection
// ---------------------------------------------------------------------------

/**

 * Count how many "open" lines of `winLength` a player has through a cell.

 * An open line has no opponent pieces blocking it (only empty or same-player cells).

 * Used for evaluating board positions and AI difficulty.

 */

export function countOpenLines(
  board: Board,

  coord: AxialCoord,

  player: Player,

  winLength: number = WIN_LENGTH,

  radius: number = BOARD_RADIUS,
): number {
  const opponent: Player = player === "X" ? "O" : "X";

  let openLines = 0;

  for (let axis = 0; axis < 3; axis++) {
    const [dirPos, dirNeg] = getAxisDirections(axis);

    // Count cells in positive direction that are not opponent (empty or same player)
    let posCount = 0;
    for (let step = 1; step < winLength; step++) {
      const next: AxialCoord = {
        q: coord.q + HEX_DIRECTIONS[dirPos].q * step,

        r: coord.r + HEX_DIRECTIONS[dirPos].r * step,
      };

      if (!isValidCell(next, radius)) break;
      const cell = getCell(board, next);

      if (cell === opponent) break;
      posCount++;
    }

    // Count cells in negative direction that are not opponent
    let negCount = 0;
    for (let step = 1; step < winLength; step++) {
      const next: AxialCoord = {
        q: coord.q + HEX_DIRECTIONS[dirNeg].q * step,

        r: coord.r + HEX_DIRECTIONS[dirNeg].r * step,
      };
      if (!isValidCell(next, radius)) break;
      const cell = getCell(board, next);
      if (cell === opponent) break;
      negCount++;
    }

    // Total cells available along this axis (coord + both directions)

    const total = 1 + posCount + negCount;

    if (total >= winLength) {
      openLines++;
    }
  }

  return openLines;
}

/**
 * Find all cells where placing a piece would create a win for `player`.
 * Returns an array of coordinates (winning moves).
 */
export function findWinningMoves(
  board: Board,
  player: Player,
  winLength: number = WIN_LENGTH,
  radius: number = BOARD_RADIUS,
): AxialCoord[] {
  const winningMoves: AxialCoord[] = [];

  // Only need to check empty cells adjacent to existing pieces
  const checked = new Set<string>();

  for (const [key] of board) {
    const parts = key.split(",");
    const coord: AxialCoord = {
      q: parseInt(parts[0], 10),
      r: parseInt(parts[1], 10),
    };

    for (const dir of HEX_DIRECTIONS) {
      const neighbor: AxialCoord = { q: coord.q + dir.q, r: coord.r + dir.r };
      const nKey = axialToKey(neighbor);

      if (checked.has(nKey)) continue;
      checked.add(nKey);

      if (!isValidCell(neighbor, radius)) continue;
      if (getCell(board, neighbor) !== null) continue;

      // Simulate placing the piece
      const testBoard = new Map(board);
      testBoard.set(nKey, player);

      const line = checkWinFromCell(
        testBoard,
        neighbor,
        player,
        winLength,
        radius,
      );
      if (line) {
        winningMoves.push(neighbor);
      }
    }
  }

  return winningMoves;
}
