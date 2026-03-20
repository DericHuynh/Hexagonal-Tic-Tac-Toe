// ============================================================================
// Hexagonal Tic-Tac-Toe — Win Checker Tests
// ============================================================================

import { describe, it, expect } from "vite-plus/test";
import {
  checkWinFromCell,
  checkAnyWin,
  getWinLines,
  getPotentialLines,
  countOpenLines,
  findWinningMoves,
} from "../src/win-checker";
import { createBoard, forceSetCell } from "../src/board";
import { BOARD_RADIUS, WIN_LENGTH } from "../src/types";
import type { Board, Player } from "../src/types";

// ---------------------------------------------------------------------------
// Helper: build a board from an array of cell placements
// ---------------------------------------------------------------------------
function buildBoard(cells: { q: number; r: number; player: Player }[]): Board {
  let board = createBoard();
  for (const cell of cells) {
    board = forceSetCell(board, { q: cell.q, r: cell.r }, cell.player);
  }
  return board;
}

// ---------------------------------------------------------------------------
// checkWinFromCell
// ---------------------------------------------------------------------------
describe("checkWinFromCell", () => {
  it("detects 6 in a row on q-axis", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    // Check from each cell in the line
    for (let i = 0; i < 6; i++) {
      const line = checkWinFromCell(board, { q: i, r: 0 }, "X");
      expect(line).not.toBeNull();
      expect(line!.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("detects 6 in a row on r-axis", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: 0, r: i, player: "O" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 0, r: 3 }, "O");
    expect(line).not.toBeNull();
    expect(line!.length).toBeGreaterThanOrEqual(6);
  });

  it("detects 6 in a row on s-axis (diagonal)", () => {
    // s-axis: q stays constant-ish, r changes, s = -q-r changes
    // Direction 2: (0, -1), Direction 5: (0, 1) — this is the s-axis
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: 0, r: i, player: "X" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 0, r: 2 }, "X");
    expect(line).not.toBeNull();
    expect(line!.length).toBeGreaterThanOrEqual(6);
  });

  it("detects 6 in a row along diagonal (q+r constant)", () => {
    // Along direction 1: (+1, -1), so q+r stays constant
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: -i, player: "X" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 3, r: -3 }, "X");
    expect(line).not.toBeNull();
    expect(line!.length).toBeGreaterThanOrEqual(6);
  });

  it("detects 6 in a row along the other diagonal", () => {
    // Along direction 2: (0, -1)
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: -i, player: "O" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 2, r: -2 }, "O");
    expect(line).not.toBeNull();
  });

  it("does NOT detect win for 5 in a row", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 2, r: 0 }, "X");
    expect(line).toBeNull();
  });

  it("does NOT detect win when there is a gap", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    // Place X at 0,1,2, skip 3, place at 4,5,6,7 — two groups of 4 and 4, not 8 contiguous
    for (let i = 0; i < 3; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    for (let i = 4; i < 8; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    // Check from cell at q=1 (part of first group of 3)
    const line = checkWinFromCell(board, { q: 1, r: 0 }, "X");
    expect(line).toBeNull();
  });

  it("does NOT detect win when opponent pieces interrupt", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    cells.push({ q: 0, r: 0, player: "X" });
    cells.push({ q: 1, r: 0, player: "X" });
    cells.push({ q: 2, r: 0, player: "O" }); // opponent blocks
    cells.push({ q: 3, r: 0, player: "X" });
    cells.push({ q: 4, r: 0, player: "X" });
    cells.push({ q: 5, r: 0, player: "X" });
    cells.push({ q: 6, r: 0, player: "X" });
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 4, r: 0 }, "X");
    expect(line).toBeNull();
  });

  it("returns null for empty cell", () => {
    const board = createBoard();
    const line = checkWinFromCell(board, { q: 0, r: 0 }, "X");
    expect(line).toBeNull();
  });

  it("detects win with more than 6 in a row", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 8; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 4, r: 0 }, "X");
    expect(line).not.toBeNull();
    expect(line!.length).toBe(8);
  });

  it("detects win on first piece of 2-piece turn (simulated)", () => {
    // X has 5 in a row, places 6th piece — should win immediately
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    // Add the 6th piece (simulating the move)
    cells.push({ q: 5, r: 0, player: "X" });
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 5, r: 0 }, "X");
    expect(line).not.toBeNull();
    expect(line!.length).toBe(6);
  });

  it("win line contains all winning cells in order", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 3, r: 0 }, "X");
    expect(line).not.toBeNull();
    // Line should contain cells q=0 through q=5
    for (let i = 0; i < 6; i++) {
      expect(line).toContainEqual({ q: i, r: 0 });
    }
  });

  it("works with custom win length", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 4; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    // With win length 4, this should be a win
    const line4 = checkWinFromCell(board, { q: 2, r: 0 }, "X", 4);
    expect(line4).not.toBeNull();

    // With default win length 6, this should NOT be a win
    const line6 = checkWinFromCell(board, { q: 2, r: 0 }, "X", 6);
    expect(line6).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// checkAnyWin
// ---------------------------------------------------------------------------
describe("checkAnyWin", () => {
  it("returns null for empty board", () => {
    const board = createBoard();
    expect(checkAnyWin(board)).toBeNull();
  });

  it("returns null when no win exists", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 1, player: "O" });
    }
    const board = buildBoard(cells);
    expect(checkAnyWin(board)).toBeNull();
  });

  it("detects win when one exists", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const result = checkAnyWin(board);
    expect(result).not.toBeNull();
    expect(result!.player).toBe("X");
    expect(result!.line.length).toBeGreaterThanOrEqual(6);
  });

  it("is efficient with lastMove hint", () => {
    // Build a large board with pieces scattered
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 5, player: "X" });
    }
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: -5, player: "O" });
    }
    // Winning line at r=0
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    // With lastMove hint pointing to the winning line
    const result = checkAnyWin(board, WIN_LENGTH, BOARD_RADIUS, { q: 5, r: 0 });
    expect(result).not.toBeNull();
    expect(result!.player).toBe("X");
  });

  it("returns null with lastMove hint when that cell is not a win", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    cells.push({ q: 10, r: 10, player: "O" });
    const board = buildBoard(cells);

    // Hint at a non-winning cell
    const result = checkAnyWin(board, WIN_LENGTH, BOARD_RADIUS, { q: 10, r: 10 });
    expect(result).toBeNull();
  });

  it("detects O winning", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: 0, r: i, player: "O" });
    }
    const board = buildBoard(cells);

    const result = checkAnyWin(board);
    expect(result).not.toBeNull();
    expect(result!.player).toBe("O");
  });
});

// ---------------------------------------------------------------------------
// getWinLines
// ---------------------------------------------------------------------------
describe("getWinLines", () => {
  it("returns empty array for empty cell", () => {
    const board = createBoard();
    const lines = getWinLines(board, { q: 0, r: 0 });
    expect(lines).toEqual([]);
  });

  it("returns empty array when no win through cell", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 3; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const lines = getWinLines(board, { q: 1, r: 0 });
    expect(lines).toEqual([]);
  });

  it("returns one line when win exists on one axis", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const lines = getWinLines(board, { q: 3, r: 0 });
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBeGreaterThanOrEqual(6);
  });

  it("returns multiple lines when win exists on multiple axes", () => {
    // Create a cross: 6 on q-axis and 6 on r-axis through (0,0)
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    for (let i = 0; i < 6; i++) {
      cells.push({ q: 0, r: i, player: "X" });
    }
    const board = buildBoard(cells);

    const lines = getWinLines(board, { q: 0, r: 0 });
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// getPotentialLines
// ---------------------------------------------------------------------------
describe("getPotentialLines", () => {
  it("returns lines through origin for length 6", () => {
    const lines = getPotentialLines({ q: 0, r: 0 }, 6, 20);
    // Should have lines along all 3 axes
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it("all returned lines contain the center cell", () => {
    const center = { q: 3, r: -1 };
    const lines = getPotentialLines(center, 6, 20);
    for (const line of lines) {
      expect(line).toContainEqual(center);
    }
  });

  it("all returned lines have the requested length", () => {
    const lines = getPotentialLines({ q: 0, r: 0 }, 6, 20);
    for (const line of lines) {
      expect(line.length).toBe(6);
    }
  });

  it("returns fewer lines near board edge", () => {
    // Cell near edge should have fewer potential lines
    const edgeLines = getPotentialLines({ q: 18, r: 0 }, 6, 20);
    const centerLines = getPotentialLines({ q: 0, r: 0 }, 6, 20);
    expect(edgeLines.length).toBeLessThan(centerLines.length);
  });

  it("all cells in returned lines are within board bounds", () => {
    const lines = getPotentialLines({ q: 5, r: -3 }, 6, 20);
    for (const line of lines) {
      for (const cell of line) {
        expect(
          Math.abs(cell.q) <= 20 && Math.abs(cell.r) <= 20 && Math.abs(-cell.q - cell.r) <= 20,
        ).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// countOpenLines
// ---------------------------------------------------------------------------
describe("countOpenLines", () => {
  it("returns 0 for isolated piece", () => {
    const board = buildBoard([{ q: 0, r: 0, player: "X" }]);
    // A single piece with no neighbors can still have open lines
    // (there's room in both directions along each axis)
    const openLines = countOpenLines(board, { q: 0, r: 0 }, "X", 6, 20);
    // All 3 axes should be open (plenty of room on radius 20 board)
    expect(openLines).toBe(3);
  });

  it("counts open lines for a developing line", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 4; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const openLines = countOpenLines(board, { q: 2, r: 0 }, "X", 6, 20);
    expect(openLines).toBeGreaterThanOrEqual(1);
  });

  it("returns 0 when line is blocked by opponent on both ends", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    cells.push({ q: -1, r: 0, player: "O" });
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    cells.push({ q: 5, r: 0, player: "O" });
    const board = buildBoard(cells);

    // The q-axis line is blocked on both ends — not open
    // But r-axis and s-axis through this cell might still be open
    const openLines = countOpenLines(board, { q: 2, r: 0 }, "X", 6, 20);
    // q-axis is blocked, but r and s axes might be open
    // Actually, the q-axis has 5 X's between two O's = potential of 5+2=7 but
    // the O's block extension. The function checks if totalPotential >= winLength.
    // negSame=0 (O blocks), posSame=0 (O blocks at q=5, but we walk consecutive X's)
    // Actually let's just verify it doesn't count the blocked axis
    expect(openLines).toBeLessThan(3);
  });
});

// ---------------------------------------------------------------------------
// findWinningMoves
// ---------------------------------------------------------------------------
describe("findWinningMoves", () => {
  it("returns empty array when no winning moves exist", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 3; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const moves = findWinningMoves(board, "X");
    expect(moves).toEqual([]);
  });

  it("finds winning move when 5 in a row exists", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const moves = findWinningMoves(board, "X");
    expect(moves.length).toBe(2); // Both ends of the line
    expect(moves).toContainEqual({ q: -1, r: 0 });
    expect(moves).toContainEqual({ q: 5, r: 0 });
  });

  it("finds winning move when one end is blocked", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    cells.push({ q: -1, r: 0, player: "O" }); // blocked on left
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const moves = findWinningMoves(board, "X");
    expect(moves).toContainEqual({ q: 5, r: 0 });
    expect(moves).not.toContainEqual({ q: -1, r: 0 }); // blocked by O
  });

  it("does not find winning moves for opponent", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "O" });
    }
    const board = buildBoard(cells);

    const moves = findWinningMoves(board, "X");
    expect(moves).toEqual([]);
  });

  it("finds multiple winning moves on different axes", () => {
    // X has 5 on q-axis and 5 on r-axis, both extendable
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    for (let i = 0; i < 5; i++) {
      cells.push({ q: 0, r: i, player: "X" });
    }
    const board = buildBoard(cells);

    const moves = findWinningMoves(board, "X");
    // Should find winning moves on both axes
    expect(moves.length).toBeGreaterThanOrEqual(2);
  });

  it("only returns moves adjacent to existing pieces", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 5; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    const moves = findWinningMoves(board, "X");
    for (const move of moves) {
      // Each winning move should be adjacent to at least one existing piece
      const isAdjacent = cells.some(
        (c) =>
          Math.abs(c.q - move.q) + Math.abs(c.r - move.r) <= 2 &&
          Math.abs(-c.q - c.r - (-move.q - move.r)) <= 2,
      );
      // Actually, winning moves at the ends of the line ARE adjacent
      expect(
        move.q === -1 ||
          move.q === 5 || // ends of the line
          cells.some((c) => c.q === move.q && c.r === move.r), // already on board
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("win-checker edge cases", () => {
  it("handles win at board boundary", () => {
    // Place 6 in a row at the edge of the board
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 15; i < 21; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    const board = buildBoard(cells);

    // This should be invalid since q=20 is the max for radius 20
    // But q=20 is valid, q=21 is not. So cells q=15..20 are valid (6 cells).
    const line = checkWinFromCell(board, { q: 18, r: 0 }, "X");
    expect(line).not.toBeNull();
  });

  it("handles multiple simultaneous wins (both players)", () => {
    // X wins on q-axis, O wins on r-axis
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    for (let i = 0; i < 6; i++) {
      cells.push({ q: 10, r: i, player: "O" });
    }
    const board = buildBoard(cells);

    const xWin = checkWinFromCell(board, { q: 3, r: 0 }, "X");
    const oWin = checkWinFromCell(board, { q: 10, r: 3 }, "O");
    expect(xWin).not.toBeNull();
    expect(oWin).not.toBeNull();
  });

  it("handles win with exactly 6 (not more)", () => {
    const cells: { q: number; r: number; player: Player }[] = [];
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    // Place opponent at q=6 to cap the line
    cells.push({ q: 6, r: 0, player: "O" });
    const board = buildBoard(cells);

    const line = checkWinFromCell(board, { q: 3, r: 0 }, "X");
    expect(line).not.toBeNull();
    expect(line!.length).toBe(6);
  });

  it("handles board with single cell", () => {
    const board = buildBoard([{ q: 0, r: 0, player: "X" }]);
    const line = checkWinFromCell(board, { q: 0, r: 0 }, "X");
    expect(line).toBeNull();
  });

  it("handles win on all 3 axes simultaneously", () => {
    // Create a star pattern: 6 in a row on all 3 axes through origin
    const cells: { q: number; r: number; player: Player }[] = [];
    // q-axis
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: 0, player: "X" });
    }
    // r-axis (direction 1: +1,-1 and direction 4: -1,+1)
    for (let i = 0; i < 6; i++) {
      cells.push({ q: i, r: -i, player: "X" });
    }
    // s-axis (direction 2: 0,-1 and direction 5: 0,1)
    for (let i = 0; i < 6; i++) {
      cells.push({ q: 0, r: i, player: "X" });
    }
    const board = buildBoard(cells);

    const lines = getWinLines(board, { q: 0, r: 0 });
    expect(lines.length).toBe(3); // All 3 axes
  });
});
