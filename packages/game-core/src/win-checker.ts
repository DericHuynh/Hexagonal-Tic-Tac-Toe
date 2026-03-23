// ============================================================================
// Hexagonal Tic-Tac-Toe — Win Checker
// Pure functions for detecting 6-in-a-row wins along the 3 hex axes.
// ============================================================================

import type { AxialCoord, Board, Player } from "./types";
import { WIN_LENGTH, HEX_DIRECTIONS } from "./types";
import { axialToKey, getAxisDirections, isValidCell, walkDirection } from "./hex";
import { getCell } from "./board";

// ---------------------------------------------------------------------------
// Core Win Detection
// ---------------------------------------------------------------------------

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
    1000, // Safe limit for consecutive lines (no longer needs board diameter)
    radius,
    (coord) => getCell(board, coord) === player,
  );
}

export function checkWinFromCell(
  board: Board,
  coord: AxialCoord,
  player: Player,
  winLength: number = WIN_LENGTH,
  radius: number = Infinity,
): AxialCoord[] | null {
  for (let axis = 0; axis < 3; axis++) {
    const [dirPos, dirNeg] = getAxisDirections(axis);

    const posCells = walkConsecutive(board, coord, dirPos, player, radius);
    const negCells = walkConsecutive(board, coord, dirNeg, player, radius);

    const totalLength = negCells.length + 1 + posCells.length;

    if (totalLength >= winLength) {
      const line: AxialCoord[] = [...negCells.reverse(), coord, ...posCells];
      return line;
    }
  }
  return null;
}

export function checkAnyWin(
  board: Board,
  winLength: number = WIN_LENGTH,
  radius: number = Infinity,
  lastMove?: AxialCoord,
): { player: Player; line: AxialCoord[] } | null {
  if (lastMove) {
    const player = getCell(board, lastMove);
    if (!player) return null;

    const line = checkWinFromCell(board, lastMove, player, winLength, radius);
    if (line) {
      return { player, line };
    }
    return null;
  }

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

export function getWinLines(
  board: Board,
  coord: AxialCoord,
  winLength: number = WIN_LENGTH,
  radius: number = Infinity,
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

export function getPotentialLines(
  coord: AxialCoord,
  length: number = WIN_LENGTH,
  radius: number = Infinity,
): AxialCoord[][] {
  const lines: AxialCoord[][] = [];

  for (let axis = 0; axis < 3; axis++) {
    const [dirPos] = getAxisDirections(axis);
    const dir = HEX_DIRECTIONS[dirPos];

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

    const allCells = [...backward.reverse(), ...forward];
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

export function countOpenLines(
  board: Board,
  coord: AxialCoord,
  player: Player,
  winLength: number = WIN_LENGTH,
  radius: number = Infinity,
): number {
  const opponent: Player = player === "X" ? "O" : "X";
  let openLines = 0;

  for (let axis = 0; axis < 3; axis++) {
    const [dirPos, dirNeg] = getAxisDirections(axis);

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

    const total = 1 + posCount + negCount;

    if (total >= winLength) {
      openLines++;
    }
  }

  return openLines;
}

export function findWinningMoves(
  board: Board,
  player: Player,
  winLength: number = WIN_LENGTH,
  radius: number = Infinity,
): AxialCoord[] {
  const winningMoves: AxialCoord[] = [];
  const checked = new Set<string>();

  for (const [key] of board) {
    const parts = key.split(",");
    const coord: AxialCoord = {
      q: parseInt(parts[0], 10),
      r: parseInt(parts[1], 10),
    };

    // Because any winning gap mathematically must reside immediately next to
    // an established piece from that line, checking immediate neighbors covers all win cases.
    for (const dir of HEX_DIRECTIONS) {
      const neighbor: AxialCoord = { q: coord.q + dir.q, r: coord.r + dir.r };
      const nKey = axialToKey(neighbor);

      if (checked.has(nKey)) continue;
      checked.add(nKey);

      if (!isValidCell(neighbor, radius)) continue;
      if (getCell(board, neighbor) !== null) continue;

      const testBoard = new Map(board);
      testBoard.set(nKey, player);

      const line = checkWinFromCell(testBoard, neighbor, player, winLength, radius);
      if (line) {
        winningMoves.push(neighbor);
      }
    }
  }

  return winningMoves;
}
