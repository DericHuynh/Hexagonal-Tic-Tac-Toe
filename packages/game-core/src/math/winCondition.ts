import type { HexCoord } from "./hex";

// A standard Hexagonal Tic-Tac-Toe requires N pieces in a line to win.
export const WINNING_LENGTH = 4;

export type PlayerId = "player1" | "player2";

export type BoardState = Map<string, PlayerId>; // Using stringified `${q},${r}` as keys

// The 3 primary axes (directions) in a hexagonal grid
// (spanning out from the center to represent a line)
const DIRECTIONS = [
  { dq: 1, dr: 0 }, // +q axis
  { dq: 0, dr: 1 }, // +r axis
  { dq: 1, dr: -1 }, // +s axis
];

/**
 * Helpers to serialize and deserialize HexCoords for the Map key.
 */
export const toKey = (hex: HexCoord) => `${hex.q},${hex.r}`;
export const fromKey = (key: string): HexCoord => {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
};

/**
 * Checks if the last move resulted in a win.
 */
export function checkWinPattern(board: BoardState, lastMove: HexCoord, player: PlayerId): boolean {
  for (const { dq, dr } of DIRECTIONS) {
    let count = 1; // The current piece

    // Check forward in the current direction
    let currentQ = lastMove.q + dq;
    let currentR = lastMove.r + dr;
    while (board.get(toKey({ q: currentQ, r: currentR })) === player) {
      count++;
      currentQ += dq;
      currentR += dr;
    }

    // Check backward in the current direction
    currentQ = lastMove.q - dq;
    currentR = lastMove.r - dr;
    while (board.get(toKey({ q: currentQ, r: currentR })) === player) {
      count++;
      currentQ -= dq;
      currentR -= dr;
    }

    if (count >= WINNING_LENGTH) {
      return true;
    }
  }

  return false;
}
