import { describe, it, expect } from "vitest";
import { checkWinPattern, WINNING_LENGTH, toKey, type BoardState } from "../src/math/winCondition";

describe("Win Condition Math", () => {
  it(`detects a ${WINNING_LENGTH}-in-a-row along the q axis`, () => {
    const board: BoardState = new Map();
    // Player 1 has a horizontal line (along q-axis)
    board.set(toKey({ q: 0, r: 0 }), "player1");
    board.set(toKey({ q: 1, r: 0 }), "player1");
    board.set(toKey({ q: 2, r: 0 }), "player1");

    // The winning move
    expect(checkWinPattern(board, { q: 3, r: 0 }, "player1")).toBe(true);
    // Not enough yet for P2
    expect(checkWinPattern(board, { q: 3, r: 0 }, "player2")).toBe(false);
  });

  it(`detects a ${WINNING_LENGTH}-in-a-row along the r axis`, () => {
    const board: BoardState = new Map();
    board.set(toKey({ q: 0, r: -1 }), "player2");
    board.set(toKey({ q: 0, r: 0 }), "player2");
    board.set(toKey({ q: 0, r: 1 }), "player2");
    board.set(toKey({ q: 0, r: 2 }), "player2");

    // Win is established
    expect(checkWinPattern(board, { q: 0, r: 0 }, "player2")).toBe(true);
  });

  it("fails to detect a win if the line is broken", () => {
    const board: BoardState = new Map();
    board.set(toKey({ q: 0, r: 0 }), "player1");
    board.set(toKey({ q: 1, r: 0 }), "player1");
    board.set(toKey({ q: 2, r: 0 }), "player2"); // Blocked!
    board.set(toKey({ q: 3, r: 0 }), "player1");

    expect(checkWinPattern(board, { q: 0, r: 0 }, "player1")).toBe(false);
  });
});
