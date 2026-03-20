// ============================================================================
// Hexagonal Tic-Tac-Toe — Board State Tests
// ============================================================================

import { describe, it, expect } from "vite-plus/test";
import {
  createBoard,
  getCell,
  isCellEmpty,
  isCellOccupied,
  setCell,
  removeCell,
  forceSetCell,
  countPieces,
  countPlayerPieces,
  isBoardFull,
  getOccupiedCells,
  getPlayerCells,
  getLastMove,
  boardToArray,
  boardFromArray,
  boardToString,
  boardFromString,
  isValidMove,
  boardToDebugString,
} from "../src/board";
import { axialToKey } from "../src/hex";
import { BOARD_RADIUS, type Player } from "../src/types";

describe("createBoard", () => {
  it("creates an empty board", () => {
    const board = createBoard();
    expect(board.size).toBe(0);
  });

  it("returns a new Map each time", () => {
    const board1 = createBoard();
    const board2 = createBoard();
    expect(board1).not.toBe(board2);
  });
});

describe("getCell", () => {
  it("returns null for empty cell", () => {
    const board = createBoard();
    expect(getCell(board, { q: 0, r: 0 })).toBeNull();
  });

  it("returns player for occupied cell", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 1, r: 0 }), "X");
    expect(getCell(board, { q: 1, r: 0 })).toBe("X");
  });

  it("handles different coordinates", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 3, r: -2 }), "O");
    expect(getCell(board, { q: 3, r: -2 })).toBe("O");
    expect(getCell(board, { q: 0, r: 0 })).toBeNull();
  });
});

describe("isCellEmpty", () => {
  it("returns true for empty cell", () => {
    const board = createBoard();
    expect(isCellEmpty(board, { q: 0, r: 0 })).toBe(true);
  });

  it("returns false for occupied cell", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 1, r: 0 }), "X");
    expect(isCellEmpty(board, { q: 1, r: 0 })).toBe(false);
  });
});

describe("isCellOccupied", () => {
  it("returns false for empty cell", () => {
    const board = createBoard();
    expect(isCellOccupied(board, { q: 0, r: 0 })).toBe(false);
  });

  it("returns true for occupied cell", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 2, r: -1 }), "O");
    expect(isCellOccupied(board, { q: 2, r: -1 })).toBe(true);
  });
});

describe("setCell", () => {
  it("adds a cell to empty board", () => {
    const board = createBoard();
    const next = setCell(board, { q: 0, r: 0 }, "X");
    expect(next.get(axialToKey({ q: 0, r: 0 }))).toBe("X");
    expect(next.size).toBe(1);
  });

  it("returns a new board (immutable)", () => {
    const board = createBoard();
    const next = setCell(board, { q: 1, r: 0 }, "X");
    expect(next).not.toBe(board);
    expect(board.size).toBe(0); // original unchanged
  });

  it("throws if cell is already occupied", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    expect(() => setCell(board, { q: 0, r: 0 }, "O")).toThrow("already occupied");
  });

  it("can set multiple cells sequentially", () => {
    const board = createBoard();
    const b1 = setCell(board, { q: 0, r: 0 }, "X");
    const b2 = setCell(b1, { q: 1, r: 0 }, "O");
    const b3 = setCell(b2, { q: 0, r: 1 }, "X");
    expect(b3.get(axialToKey({ q: 0, r: 0 }))).toBe("X");
    expect(b3.get(axialToKey({ q: 1, r: 0 }))).toBe("O");
    expect(b3.get(axialToKey({ q: 0, r: 1 }))).toBe("X");
    expect(b3.size).toBe(3);
  });
});

describe("removeCell", () => {
  it("removes an occupied cell", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    const next = removeCell(board, { q: 0, r: 0 });
    expect(next.get(axialToKey({ q: 0, r: 0 }))).toBeUndefined();
    expect(next.size).toBe(0);
  });

  it("returns same board if cell not occupied", () => {
    const board = createBoard();
    const next = removeCell(board, { q: 0, r: 0 });
    expect(next).toBe(board);
  });

  it("returns a new board when removing", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    const next = removeCell(board, { q: 0, r: 0 });
    expect(next).not.toBe(board);
  });
});

describe("forceSetCell", () => {
  it("sets cell regardless of occupancy", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    const next = forceSetCell(board, { q: 0, r: 0 }, "O");
    expect(next.get(axialToKey({ q: 0, r: 0 }))).toBe("O");
    expect(next.size).toBe(1); // overwrote, not added
  });

  it("can be used for replay/loading", () => {
    const board = createBoard();
    const cells: { q: number; r: number; player: Player }[] = [
      { q: 0, r: 0, player: "X" },
      { q: 1, r: 0, player: "O" },
      { q: 0, r: 1, player: "X" },
    ];
    let result = board;
    for (const cell of cells) {
      result = forceSetCell(result, { q: cell.q, r: cell.r }, cell.player);
    }
    expect(result.size).toBe(3);
    expect(getCell(result, { q: 0, r: 0 })).toBe("X");
    expect(getCell(result, { q: 1, r: 0 })).toBe("O");
  });
});

describe("countPieces", () => {
  it("counts 0 for empty board", () => {
    const board = createBoard();
    expect(countPieces(board)).toBe(0);
  });

  it("counts pieces correctly", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    board.set(axialToKey({ q: 0, r: 1 }), "X");
    expect(countPieces(board)).toBe(3);
  });
});

describe("countPlayerPieces", () => {
  it("counts 0 when player has no pieces", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    expect(countPlayerPieces(board, "O")).toBe(0);
  });

  it("counts pieces for a specific player", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    board.set(axialToKey({ q: 0, r: 1 }), "X");
    board.set(axialToKey({ q: -1, r: 1 }), "O");
    board.set(axialToKey({ q: 0, r: 2 }), "X");
    expect(countPlayerPieces(board, "X")).toBe(3);
    expect(countPlayerPieces(board, "O")).toBe(2);
  });
});

describe("isBoardFull", () => {
  it("returns false for empty board", () => {
    const board = createBoard();
    expect(isBoardFull(board)).toBe(false);
  });

  it("returns false for partially filled board", () => {
    const board = createBoard();
    for (let i = 0; i < 100; i++) {
      board.set(axialToKey({ q: i % 10, r: Math.floor(i / 10) }), (i % 2 === 0 ? "X" : "O") as Player);
    }
    expect(isBoardFull(board)).toBe(false);
  });

  it("returns true for completely filled board", () => {
    const board = createBoard();
    // Fill all cells for radius 2 (19 cells)
    for (let q = -2; q <= 2; q++) {
      for (let r = -2; r <= 2; r++) {
        if (Math.abs(-q - r) <= 2) {
          board.set(axialToKey({ q, r }), q % 2 === 0 ? "X" : "O");
        }
      }
    }
    expect(isBoardFull(board, 2)).toBe(true);
  });

  it("uses default BOARD_RADIUS", () => {
    const board = createBoard();
    expect(isBoardFull(board)).toBe(false); // 1261 cells would be huge to fill in test
  });
});

describe("getOccupiedCells", () => {
  it("returns empty array for empty board", () => {
    const board = createBoard();
    expect(getOccupiedCells(board)).toEqual([]);
  });

  it("returns all occupied cells with coordinates", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    const entries = getOccupiedCells(board);
    expect(entries).toHaveLength(2);
    expect(entries).toContainEqual({ coord: { q: 0, r: 0 }, player: "X" });
    expect(entries).toContainEqual({ coord: { q: 1, r: 0 }, player: "O" });
  });
});

describe("getPlayerCells", () => {
  it("returns empty array when player has no pieces", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    expect(getPlayerCells(board, "O")).toEqual([]);
  });

  it("returns all cells for specified player", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    board.set(axialToKey({ q: 0, r: 1 }), "X");
    board.set(axialToKey({ q: -1, r: 1 }), "O");
    const xCells = getPlayerCells(board, "X");
    const oCells = getPlayerCells(board, "O");
    expect(xCells).toHaveLength(2);
    expect(oCells).toHaveLength(2);
    expect(xCells).toContainEqual({ q: 0, r: 0 });
    expect(xCells).toContainEqual({ q: 0, r: 1 });
  });
});

describe("getLastMove", () => {
  it("returns null for empty history", () => {
    expect(getLastMove([])).toBeNull();
  });

  it("returns the move with highest moveIndex", () => {
    const history = [
      { q: 0, r: 0, moveIndex: 1 },
      { q: 1, r: 0, moveIndex: 3 },
      { q: 0, r: 1, moveIndex: 2 },
    ];
    const last = getLastMove(history);
    expect(last).toEqual({ q: 1, r: 0 });
  });

  it("handles single move", () => {
    const history = [{ q: 2, r: -1, moveIndex: 0 }];
    expect(getLastMove(history)).toEqual({ q: 2, r: -1 });
  });
});

describe("boardToArray / boardFromArray", () => {
  it("roundtrips empty board", () => {
    const board = createBoard();
    const arr = boardToArray(board);
    const next = boardFromArray(arr);
    expect(next.size).toBe(0);
  });

  it("serializes board to array correctly", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    const arr = boardToArray(board);
    expect(arr).toHaveLength(2);
    expect(arr).toContainEqual({ q: 0, r: 0, player: "X" });
    expect(arr).toContainEqual({ q: 1, r: 0, player: "O" });
  });

  it("deserializes array to board correctly", () => {
    const cells: { q: number; r: number; player: Player }[] = [
      { q: 0, r: 0, player: "X" },
      { q: 1, r: 0, player: "O" },
      { q: 0, r: 1, player: "X" },
    ];
    const board = boardFromArray(cells);
    expect(board.size).toBe(3);
    expect(board.get(axialToKey({ q: 0, r: 0 }))).toBe("X");
    expect(board.get(axialToKey({ q: 1, r: 0 }))).toBe("O");
  });

  it("handles complex board state", () => {
    const board = createBoard();
    // Add various cells
    for (let i = 0; i < 20; i++) {
      const q = (i % 5) - 2;
      const r = Math.floor(i / 5) - 2;
      board.set(axialToKey({ q, r }), (i % 2 === 0 ? "X" : "O") as Player);
    }
    const arr = boardToArray(board);
    const next = boardFromArray(arr);
    expect(next.size).toBe(board.size);
    for (const [key, player] of board) {
      expect(next.get(key)).toBe(player);
    }
  });
});

describe("boardToString / boardFromString", () => {
  it("roundtrips empty board", () => {
    const board = createBoard();
    const str = boardToString(board);
    const next = boardFromString(str);
    expect(next.size).toBe(0);
  });

  it("serializes to valid JSON string", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    const str = boardToString(board);
    expect(typeof str).toBe("string");
    expect(JSON.parse(str)).toBeDefined();
  });

  it("deserializes from JSON string", () => {
    const str = '[{"q":0,"r":0,"player":"X"},{"q":1,"r":0,"player":"O"}]';
    const board = boardFromString(str);
    expect(board.size).toBe(2);
    expect(board.get(axialToKey({ q: 0, r: 0 }))).toBe("X");
  });
});

describe("isValidMove", () => {
  it("returns valid for empty cell on empty board", () => {
    const board = createBoard();
    const result = isValidMove(board, { q: 0, r: 0 });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns invalid for occupied cell", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    const result = isValidMove(board, { q: 0, r: 0 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("already occupied");
  });

  it("returns invalid for out-of-bounds cell", () => {
    const board = createBoard();
    const result = isValidMove(board, { q: BOARD_RADIUS + 1, r: 0 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("outside the board");
  });

  it("returns valid for in-bounds empty cell", () => {
    const board = createBoard();
    const result = isValidMove(board, { q: 5, r: 0 });
    expect(result.valid).toBe(true);
  });

  it("respects custom radius", () => {
    const board = createBoard();
    const result = isValidMove(board, { q: 6, r: 0 }, 5);
    expect(result.valid).toBe(false);
  });
});

describe("boardToDebugString", () => {
  it("creates a valid string representation", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    const str = boardToDebugString(board, 2);
    expect(typeof str).toBe("string");
    expect(str.length).toBeGreaterThan(0);
  });

  it("shows X and O for occupied cells", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    board.set(axialToKey({ q: 1, r: 0 }), "O");
    const str = boardToDebugString(board, 2);
    expect(str).toContain("X");
    expect(str).toContain("O");
  });

  it("shows dots for empty cells", () => {
    const board = createBoard();
    const str = boardToDebugString(board, 2);
    expect(str).toContain(".");
  });
});

describe("Board edge cases", () => {
  it("handles board with many cells efficiently", () => {
    const board = createBoard();
    // Add 100 cells (distinct coordinates)
    for (let i = 0; i < 100; i++) {
      const q = i % 10;
      const r = Math.floor(i / 10);
      board.set(axialToKey({ q, r }), (i % 2 === 0 ? "X" : "O") as Player);
    }
    expect(countPieces(board)).toBe(100);
    expect(boardToArray(board)).toHaveLength(100);
  });

  it("handles negative coordinates correctly", () => {
    const board = createBoard();
    board.set(axialToKey({ q: -3, r: 2 }), "X");
    expect(getCell(board, { q: -3, r: 2 })).toBe("X");
    const arr = boardToArray(board);
    expect(arr).toContainEqual({ q: -3, r: 2, player: "X" });
  });

  it("maintains immutability across operations", () => {
    const board = createBoard();
    board.set(axialToKey({ q: 0, r: 0 }), "X");
    const b2 = setCell(board, { q: 1, r: 0 }, "O");
    const b3 = removeCell(b2, { q: 0, r: 0 });
    // Original board unchanged
    expect(board.size).toBe(1);
    expect(board.get(axialToKey({ q: 0, r: 0 }))).toBe("X");
    // b2 has 2 cells
    expect(b2.size).toBe(2);
    // b3 has 1 cell
    expect(b3.size).toBe(1);
    expect(b3.get(axialToKey({ q: 0, r: 0 }))).toBeUndefined();
  });
});
