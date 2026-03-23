import { describe, it, expect, vi } from "vitest";
import {
  getAIConfig,
  findBestMove,
  type AIConfig,
  type AIEvaluation,
} from "../src/ai/minimax";
import { createBoard, setCell, createTurnState, placePiece } from "../src";
import type { Board, TurnState, Player } from "../src/types";

describe("AI Module", () => {
  describe("getAIConfig", () => {
    it("should return correct config for easy difficulty", () => {
      const config = getAIConfig("easy", "X");
      expect(config.player).toBe("X");
      expect(config.depth).toBe(1);
      expect(config.randomness).toBe(0.3);
    });

    it("should return correct config for medium difficulty", () => {
      const config = getAIConfig("medium", "O");
      expect(config.player).toBe("O");
      expect(config.depth).toBe(2);
      expect(config.randomness).toBe(0.1);
    });

    it("should return correct config for hard difficulty", () => {
      const config = getAIConfig("hard", "X");
      expect(config.player).toBe("X");
      expect(config.depth).toBe(4);
      expect(config.randomness).toBe(0);
    });

    it("should return correct config for master difficulty", () => {
      const config = getAIConfig("master", "O");
      expect(config.player).toBe("O");
      expect(config.depth).toBe(6);
      expect(config.randomness).toBe(0);
    });
  });

  describe("findBestMove", () => {
    it("should return center move for opening position", () => {
      const board = createBoard();
      const turnState = createTurnState();
      const config: AIConfig = { player: "X", depth: 2, randomness: 0 };

      const result = findBestMove(board, turnState, config);

      expect(result.move).not.toBeNull();
      expect(result.move?.q).toBe(0);
      expect(result.move?.r).toBe(0);
    });

    it("should find winning move when available", () => {
      // Create a board where X can win by placing at (0, 0)
      // Hexagonal Tic-Tac-Toe win length is 6. We provide 5 pieces in a row.
      let board = createBoard();
      board = setCell(board, { q: -2, r: 0 }, "X");
      board = setCell(board, { q: -1, r: 0 }, "X");
      board = setCell(board, { q: 1, r: 0 }, "X");
      board = setCell(board, { q: 2, r: 0 }, "X");
      board = setCell(board, { q: 3, r: 0 }, "X");

      // O has some pieces elsewhere
      board = setCell(board, { q: 0, r: 2 }, "O");

      const turnState = createTurnState();
      // Need to set turnState to X's turn with proper move count
      let ts = turnState;
      for (let i = 0; i < 4; i++) {
        ts = placePiece(ts);
      }

      const config: AIConfig = { player: "X", depth: 2, randomness: 0 };

      const result = findBestMove(board, ts, config);

      expect(result.move).not.toBeNull();
      // The winning move should be at (0, 0)
      expect(result.move?.q).toBe(0);
      expect(result.move?.r).toBe(0);
    });

    it("should block opponent's winning move", () => {
      // O is about to win (has 5 pieces in a row), X should prioritize blocking
      let board = createBoard();
      board = setCell(board, { q: -2, r: 0 }, "O");
      board = setCell(board, { q: -1, r: 0 }, "O");
      board = setCell(board, { q: 1, r: 0 }, "O");
      board = setCell(board, { q: 2, r: 0 }, "O");
      board = setCell(board, { q: 3, r: 0 }, "O");

      // X has some pieces elsewhere
      board = setCell(board, { q: 0, r: 2 }, "X");

      const turnState = createTurnState();
      // It's X's turn
      let ts = turnState;
      for (let i = 0; i < 4; i++) {
        ts = placePiece(ts);
      }

      const config: AIConfig = { player: "X", depth: 2, randomness: 0 };

      const result = findBestMove(board, ts, config);

      expect(result.move).not.toBeNull();
      // X MUST block at (0, 0) to avoid immediate loss
      expect(result.move?.q).toBe(0);
      expect(result.move?.r).toBe(0);
    });

    it("should return a valid move for mid-game position", () => {
      let board = createBoard();
      // Add some pieces
      board = setCell(board, { q: 0, r: 0 }, "X");
      board = setCell(board, { q: 1, r: 0 }, "O");
      board = setCell(board, { q: 0, r: 1 }, "X");
      board = setCell(board, { q: -1, r: 1 }, "O");

      // It's X's turn
      let ts = createTurnState();
      for (let i = 0; i < 3; i++) {
        ts = placePiece(ts);
      }

      const config: AIConfig = { player: "X", depth: 2, randomness: 0 };

      const result = findBestMove(board, ts, config);

      expect(result.move).not.toBeNull();
      expect(result.move).toBeDefined();
      expect(typeof result.move!.q).toBe("number");
      expect(typeof result.move!.r).toBe("number");
    });

    it("should return null move when no legal moves available", () => {
      let board = createBoard();
      const RADIUS = 20; // Default BOARD_RADIUS

      // Physically fill the entire board to eliminate all legal moves
      for (let q = -RADIUS; q <= RADIUS; q++) {
        for (let r = -RADIUS; r <= RADIUS; r++) {
          if (Math.abs(q + r) <= RADIUS) {
            board = setCell(board, { q, r }, "X");
          }
        }
      }

      const turnState = createTurnState();
      const config: AIConfig = { player: "O", depth: 1, randomness: 0 };

      const result = findBestMove(board, turnState, config);

      expect(result.move).toBeNull();
    });
  });

  describe("AI Difficulty Levels", () => {
    it("easy AI should sometimes make random moves", () => {
      let board = createBoard();
      // We must place at least 1 piece so `getLegalMoves` returns multiple neighbors
      board = setCell(board, { q: 0, r: 0 }, "X");

      let ts = createTurnState();
      ts = placePiece(ts); // Switch to O's turn

      const config = getAIConfig("easy", "O");

      // Run multiple times to check randomness (probability 0.3)
      const moves = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = findBestMove(board, ts, config);
        if (result.move) {
          moves.add(`${result.move.q},${result.move.r}`);
        }
      }

      // With randomness 0.3 among 6 neighbors, we should confidently see multiple distinct choices
      expect(moves.size).toBeGreaterThan(1);
    });

    it("hard AI should always pick the same move for same position", () => {
      let board = createBoard();
      board = setCell(board, { q: 0, r: 0 }, "X");
      board = setCell(board, { q: 1, r: 0 }, "O");

      let ts = createTurnState();
      ts = placePiece(ts); // X placed
      ts = placePiece(ts); // O placed

      const config = getAIConfig("hard", "X");

      // Mock random to prevent `shuffleArray` tie-breaking differences under the hood
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const result1 = findBestMove(board, ts, config);
      const result2 = findBestMove(board, ts, config);

      randomSpy.mockRestore();

      expect(result1.move).not.toBeNull();
      expect(result2.move).not.toBeNull();
      expect(result1.move?.q).toBe(result2.move?.q);
      expect(result1.move?.r).toBe(result2.move?.r);
    });
  });
});
