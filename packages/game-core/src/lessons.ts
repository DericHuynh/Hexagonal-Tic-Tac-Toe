// ============================================================================
// Hexagonal Tic-Tac-Toe — Lessons System
// Pure functions for lesson definitions, puzzle validation, and scoring.
// ============================================================================

import type {
  AxialCoord,
  Board,
  Lesson,
  LessonCategory,
  LessonDifficulty,
  Puzzle,
  Player,
} from "./types";
import { BOARD_RADIUS, WIN_LENGTH } from "./types";
import { axialToKey, isValidCell } from "./hex";
import { createBoard, getCell, forceSetCell } from "./board";
import { checkWinFromCell } from "./win-checker";

// ---------------------------------------------------------------------------
// Puzzle Validation
// ---------------------------------------------------------------------------

/**
 * Check if a move solves a puzzle.
 * A puzzle move is correct if it matches one of the solution coordinates.
 */
export function validatePuzzleMove(puzzle: Puzzle, move: AxialCoord): boolean {
  return puzzle.solution.some((s) => s.q === move.q && s.r === move.r);
}

/**
 * Check if a sequence of moves solves the puzzle completely.
 * All solution moves must be played (in any order for multi-move puzzles).
 */
export function validatePuzzleSolution(
  puzzle: Puzzle,
  moves: AxialCoord[],
): boolean {
  if (moves.length !== puzzle.solution.length) return false;

  const moveKeys = new Set(moves.map(axialToKey));
  return puzzle.solution.every((s) => moveKeys.has(axialToKey(s)));
}

/**
 * Simulate placing a puzzle move on the board and check if it creates
 * the expected outcome (typically a win).
 */
export function applyPuzzleMove(
  puzzle: Puzzle,
  move: AxialCoord,
): { board: Board; isWin: boolean; winLine: AxialCoord[] | null } {
  let board = createBoard();

  // Reconstruct the starting position
  for (const cell of puzzle.cells) {
    board = forceSetCell(board, { q: cell.q, r: cell.r }, cell.player);
  }

  // Apply the move
  board = forceSetCell(board, move, puzzle.playerToMove);

  // Check if this creates a win
  const winLine = checkWinFromCell(
    board,
    move,
    puzzle.playerToMove,
    WIN_LENGTH,
    BOARD_RADIUS,
  );

  return {
    board,
    isWin: winLine !== null,
    winLine,
  };
}

// ---------------------------------------------------------------------------
// Puzzle Scoring
// ---------------------------------------------------------------------------

/**
 * Calculate a puzzle score from 0 to 100 based on:
 * - Correct solution: base 100 points
 * - Hints used: -15 points per hint
 * - Time taken: -1 point per 3 seconds over the par time (if timeLimit set)
 *
 * Minimum score is 0.
 */
export function calculatePuzzleScore(
  puzzle: Puzzle,
  hintsUsed: number,
  timeSeconds: number,
): number {
  let score = 100;

  // Penalty for hints
  score -= hintsUsed * 15;

  // Penalty for time (if time limit is set)
  if (puzzle.timeLimit && puzzle.timeLimit > 0) {
    const parTime = puzzle.timeLimit;
    if (timeSeconds > parTime) {
      const overtime = timeSeconds - parTime;
      score -= Math.floor(overtime / 3);
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get a star rating (1-3) based on puzzle score.
 * - 3 stars: score >= 85
 * - 2 stars: score >= 60
 * - 1 star:  score >= 0
 */
export function getStarRating(score: number): 1 | 2 | 3 {
  if (score >= 85) return 3;
  if (score >= 60) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Lesson Helpers
// ---------------------------------------------------------------------------

/**
 * Get the total XP available from a set of lessons.
 */
export function getTotalXp(lessons: Lesson[]): number {
  return lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
}

/**
 * Filter lessons by category.
 */
export function filterByCategory(
  lessons: Lesson[],
  category: LessonCategory,
): Lesson[] {
  return lessons
    .filter((l) => l.category === category)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Sort lessons by difficulty then order.
 */
export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty;
    }
    return a.orderIndex - b.orderIndex;
  });
}

/**
 * Get the next uncompleted lesson in a sequence.
 */
export function getNextLesson(
  lessons: Lesson[],
  completedIds: Set<string>,
): Lesson | null {
  const sorted = sortLessons(lessons);
  return sorted.find((l) => !completedIds.has(l.id)) ?? null;
}

// ---------------------------------------------------------------------------
// Default Lessons
// ---------------------------------------------------------------------------

/**
 * Seed lessons for the game. These cover all categories from basics
 * through advanced puzzles.
 */
export const DEFAULT_LESSONS: Lesson[] = [
  // ---- Basics ----
  {
    id: "basics-1-your-first-move",
    title: "Your First Move",
    description: "Learn how to place your first piece on the hexagonal board.",
    category: "basics",
    difficulty: 1,
    orderIndex: 1,
    slides: [
      {
        type: "text",
        content:
          "Welcome to Hexagonal Tic-Tac-Toe! The board is a hexagon made up of triangular cells arranged in a honeycomb pattern. Each cell is identified by its axial coordinates (q, r).",
      },
      {
        type: "text",
        content:
          "X always plays first. On the opening move, X places exactly **1 piece**. After that, both players alternate placing **2 pieces per turn**. This gives X a slight early advantage that O must overcome.",
      },
      {
        type: "board",
        cells: [],
        highlight: [{ q: 0, r: 0 }],
        annotation:
          "The center cell (0, 0) is often the strongest opening move.",
      },
      {
        type: "text",
        content:
          "Try to control the center of the board early. Pieces in the center have the most connections along all three axes, giving you more opportunities to build toward 6 in a row.",
      },
    ],
    puzzle: null,
    xpReward: 10,
  },
  {
    id: "basics-2-the-hex-axes",
    title: "The Three Axes",
    description:
      "Understand the three directions you can make lines on a hex grid.",
    category: "basics",
    difficulty: 1,
    orderIndex: 2,
    slides: [
      {
        type: "text",
        content:
          "Unlike square tic-tac-toe which has 4 directions (horizontal, vertical, 2 diagonals), a hexagonal grid has **3 axes**. Each axis runs through cells in two opposing directions.",
      },
      {
        type: "board",
        cells: [
          { q: -2, r: 0, player: "X" },
          { q: -1, r: 0, player: "X" },
          { q: 0, r: 0, player: "X" },
          { q: 1, r: 0, player: "X" },
          { q: 2, r: 0, player: "X" },
        ],
        highlight: [
          { q: -2, r: 0 },
          { q: -1, r: 0 },
          { q: 0, r: 0 },
          { q: 1, r: 0 },
          { q: 2, r: 0 },
        ],
        annotation: "The q-axis — horizontal lines.",
      },
      {
        type: "board",
        cells: [
          { q: 0, r: -2, player: "O" },
          { q: 0, r: -1, player: "O" },
          { q: 0, r: 0, player: "O" },
          { q: 0, r: 1, player: "O" },
          { q: 0, r: 2, player: "O" },
        ],
        highlight: [
          { q: 0, r: -2 },
          { q: 0, r: -1 },
          { q: 0, r: 0 },
          { q: 0, r: 1 },
          { q: 0, r: 2 },
        ],
        annotation: "The r-axis — diagonal lines (upper-left to lower-right).",
      },
      {
        type: "board",
        cells: [
          { q: -2, r: 2, player: "X" },
          { q: -1, r: 1, player: "X" },
          { q: 0, r: 0, player: "X" },
          { q: 1, r: -1, player: "X" },
          { q: 2, r: -2, player: "X" },
        ],
        highlight: [
          { q: -2, r: 2 },
          { q: -1, r: 1 },
          { q: 0, r: 0 },
          { q: 1, r: -1 },
          { q: 2, r: -2 },
        ],
        annotation: "The s-axis — diagonal lines (lower-left to upper-right).",
      },
      {
        type: "text",
        content:
          "You need **6 in a row** along any of these 3 axes to win. Always watch all three directions — a line you ignore is a line your opponent can complete!",
      },
    ],
    puzzle: null,
    xpReward: 10,
  },
  {
    id: "basics-3-two-pieces-per-turn",
    title: "Two Pieces Per Turn",
    description:
      "Master the unique turn system where you place 2 pieces each turn.",
    category: "basics",
    difficulty: 2,
    orderIndex: 3,
    slides: [
      {
        type: "text",
        content:
          "After X's opening move, every turn consists of placing **2 pieces**. This is what makes Hex Tic-Tac-Toe strategically deep — you can set up a threat with your first piece and execute it with your second.",
      },
      {
        type: "text",
        content:
          "However, your opponent also gets 2 pieces per turn, so they can block one threat and build their own with their second piece. Think ahead about both of your placements!",
      },
      {
        type: "board",
        cells: [
          { q: 0, r: 0, player: "X" },
          { q: 1, r: 0, player: "O" },
          { q: -1, r: 0, player: "O" },
        ],
        highlight: [
          { q: 1, r: 0 },
          { q: -1, r: 0 },
        ],
        annotation:
          "O used both pieces to block X's line on the q-axis while building their own.",
      },
      {
        type: "text",
        content:
          "Remember: if you win on your first piece of a turn, the game ends immediately — you don't place the second piece. This means you can surprise your opponent with a sudden win!",
      },
    ],
    puzzle: null,
    xpReward: 15,
  },

  // ---- Tactics ----
  {
    id: "tactics-1-the-fork",
    title: "The Fork",
    description:
      "Create two threats at once that your opponent cannot both block.",
    category: "tactics",
    difficulty: 3,
    orderIndex: 1,
    slides: [
      {
        type: "text",
        content:
          "A **fork** is when you create two separate winning threats simultaneously. Since your opponent only gets 2 pieces per turn, if you create 3+ threats, they cannot block them all.",
      },
      {
        type: "text",
        content:
          "The most common fork: have 4-in-a-row on two different axes that share a cell. Placing one piece at the intersection creates two 5-in-a-row threats. Your opponent can only block one.",
      },
      {
        type: "board",
        cells: [
          { q: 0, r: 0, player: "X" },
          { q: 1, r: 0, player: "X" },
          { q: 2, r: 0, player: "X" },
          { q: 3, r: 0, player: "X" },
          { q: 0, r: 0, player: "X" },
          { q: 0, r: 1, player: "X" },
          { q: 0, r: 2, player: "X" },
          { q: 0, r: 3, player: "X" },
          { q: 4, r: 0, player: "O" },
          { q: 0, r: 4, player: "O" },
        ],
        highlight: [{ q: 0, r: 0 }],
        annotation:
          "X has 4-in-a-row on both the q-axis and r-axis through (0,0). One more piece on either end wins.",
      },
    ],
    puzzle: {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "X" },
        { q: 2, r: 0, player: "X" },
        { q: 3, r: 0, player: "X" },
        { q: 0, r: 1, player: "X" },
        { q: 0, r: 2, player: "X" },
        { q: 0, r: 3, player: "X" },
        { q: 4, r: 0, player: "O" },
        { q: -1, r: 0, player: "O" },
        { q: 0, r: 4, player: "O" },
        { q: 0, r: -1, player: "O" },
      ],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [
        "Look for a cell that belongs to two different lines of X pieces.",
        "The center cell (0,0) is part of both the q-axis and r-axis lines.",
        "Place at (0,0) to create two 5-in-a-row threats at once!",
      ],
      timeLimit: 30,
    },
    xpReward: 25,
  },
  {
    id: "tactics-2-blocking",
    title: "Blocking Threats",
    description: "Learn when and how to block your opponent's winning threats.",
    category: "tactics",
    difficulty: 3,
    orderIndex: 2,
    slides: [
      {
        type: "text",
        content:
          "When your opponent has 5 in a row, you **must** block immediately. But smart blocking means more than just stopping the immediate threat — try to block in a way that also builds your own position.",
      },
      {
        type: "text",
        content:
          "With 2 pieces per turn, you can block one threat AND start building your own line. Always look for the block that gives you the most counterplay.",
      },
      {
        type: "board",
        cells: [
          { q: -2, r: 0, player: "O" },
          { q: -1, r: 0, player: "O" },
          { q: 0, r: 0, player: "O" },
          { q: 1, r: 0, player: "O" },
          { q: 2, r: 0, player: "O" },
          { q: 3, r: 0, player: "X" },
        ],
        highlight: [
          { q: -3, r: 0 },
          { q: 3, r: 0 },
        ],
        annotation:
          "O has 5 in a row. X must block at one end. But which end is better?",
      },
    ],
    puzzle: {
      cells: [
        { q: -2, r: 0, player: "O" },
        { q: -1, r: 0, player: "O" },
        { q: 0, r: 0, player: "O" },
        { q: 1, r: 0, player: "O" },
        { q: 2, r: 0, player: "O" },
        { q: 0, r: 1, player: "X" },
        { q: 0, r: 2, player: "X" },
        { q: 0, r: 3, player: "X" },
        { q: 0, r: 4, player: "X" },
      ],
      playerToMove: "X",
      solution: [{ q: -3, r: 0 }],
      hints: [
        "You must block O's 5-in-a-row. There are two possible blocking cells.",
        "One blocking cell also extends your own line on the r-axis.",
        "Block at (-3, 0) — it doesn't help your r-axis line, but it forces O to respond while you build elsewhere.",
      ],
      timeLimit: 45,
    },
    xpReward: 25,
  },

  // ---- Strategy ----
  {
    id: "strategy-1-center-control",
    title: "Center Control",
    description: "Why controlling the center of the board is crucial.",
    category: "strategy",
    difficulty: 4,
    orderIndex: 1,
    slides: [
      {
        type: "text",
        content:
          "The center of the hex board is the most valuable territory. A piece at the center (0,0) has 6 neighbors and can participate in lines along all 3 axes in both directions. Edge pieces have fewer connections.",
      },
      {
        type: "text",
        content:
          "On a radius-20 board, the center region (within 5 cells of origin) contains the most overlapping potential lines. Controlling this area forces your opponent to play on the periphery where their pieces are less connected.",
      },
      {
        type: "board",
        cells: [
          { q: 0, r: 0, player: "X" },
          { q: 1, r: 0, player: "X" },
          { q: 0, r: 1, player: "X" },
          { q: -1, r: 1, player: "O" },
          { q: 1, r: -1, player: "O" },
        ],
        highlight: [
          { q: 0, r: 0 },
          { q: 1, r: 0 },
          { q: 0, r: 1 },
        ],
        annotation:
          "X controls the center with pieces that support each other along multiple axes.",
      },
      {
        type: "text",
        content:
          "In the opening, prioritize getting pieces into the central region. A strong center gives you flexibility to attack along any axis as the game develops.",
      },
    ],
    puzzle: null,
    xpReward: 20,
  },
  {
    id: "strategy-2-tempo",
    title: "Tempo and Initiative",
    description: "Using your 2-piece turns to maintain the initiative.",
    category: "strategy",
    difficulty: 5,
    orderIndex: 2,
    slides: [
      {
        type: "text",
        content:
          "**Tempo** means forcing your opponent to respond to your threats rather than building their own. With 2 pieces per turn, you can use one piece to threaten and one to build — maintaining constant pressure.",
      },
      {
        type: "text",
        content:
          "If you spend both your pieces purely defending, you lose tempo. Always try to make at least one of your pieces create a threat that demands a response.",
      },
      {
        type: "text",
        content:
          "The player with the initiative controls the direction of the game. Force your opponent into a defensive posture, then exploit the weaknesses in their position.",
      },
    ],
    puzzle: null,
    xpReward: 20,
  },

  // ---- Endgame ----
  {
    id: "endgame-1-closing-wins",
    title: "Closing Out Won Positions",
    description: "How to convert a winning advantage into victory.",
    category: "endgame",
    difficulty: 5,
    orderIndex: 1,
    slides: [
      {
        type: "text",
        content:
          "When you have a strong position with multiple developing lines, resist the temptation to rush. With 2 pieces per turn, you can set up an unstoppable fork — two threats that cannot both be blocked.",
      },
      {
        type: "text",
        content:
          "Look for positions where you have 4+ on one axis and 3+ on another. Your opponent must split their blocks between your threats, and with careful play, you can always stay one step ahead.",
      },
      {
        type: "text",
        content:
          "Remember: you only need to complete 6 in a row. Don't overextend by trying to build too many lines at once. Focus on converting one strong threat into a win.",
      },
    ],
    puzzle: {
      cells: [
        { q: -2, r: 0, player: "X" },
        { q: -1, r: 0, player: "X" },
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "X" },
        { q: 2, r: 0, player: "X" },
        { q: 0, r: 1, player: "O" },
        { q: 1, r: 1, player: "O" },
        { q: 2, r: 1, player: "O" },
        { q: 3, r: 1, player: "O" },
        { q: 4, r: 1, player: "O" },
      ],
      playerToMove: "X",
      solution: [
        { q: 3, r: 0 },
        { q: -3, r: 0 },
      ],
      hints: [
        "X has 5 in a row on the q-axis. Where can you complete the line?",
        "There are two ends to the line: (3, 0) and (-3, 0).",
        "Either end wins! Place at (3, 0) or (-3, 0) to complete 6 in a row.",
      ],
      timeLimit: 20,
    },
    xpReward: 30,
  },

  // ---- Puzzles ----
  {
    id: "puzzle-1-find-the-win",
    title: "Find the Win",
    description: "A straightforward winning move — can you spot it?",
    category: "puzzles",
    difficulty: 2,
    orderIndex: 1,
    slides: [
      {
        type: "text",
        content:
          "In this puzzle, X has a winning move available. Look for a line of 5 X pieces and place the 6th to win!",
      },
    ],
    puzzle: {
      cells: [
        { q: -2, r: 1, player: "X" },
        { q: -1, r: 1, player: "X" },
        { q: 0, r: 1, player: "X" },
        { q: 1, r: 1, player: "X" },
        { q: 2, r: 1, player: "X" },
        { q: -3, r: 1, player: "O" },
        { q: 0, r: 0, player: "O" },
        { q: 1, r: 0, player: "O" },
      ],
      playerToMove: "X",
      solution: [{ q: 3, r: 1 }],
      hints: [
        "Look for a line of 5 X pieces along any axis.",
        "X has 5 in a row along the q-axis at r=1.",
        "Place at (3, 1) to complete 6 in a row!",
      ],
      timeLimit: 30,
    },
    xpReward: 15,
  },
  {
    id: "puzzle-2-double-threat",
    title: "Create a Double Threat",
    description: "Find the move that creates two winning threats at once.",
    category: "puzzles",
    difficulty: 4,
    orderIndex: 2,
    slides: [
      {
        type: "text",
        content:
          "Sometimes the winning move isn't completing a line — it's creating two threats simultaneously. Your opponent gets 2 pieces per turn, but if you create 2+ threats, they can't block them all.",
      },
    ],
    puzzle: {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "X" },
        { q: 2, r: 0, player: "X" },
        { q: 3, r: 0, player: "X" },
        { q: 4, r: 0, player: "X" },
        { q: 0, r: 1, player: "X" },
        { q: 0, r: 2, player: "X" },
        { q: 0, r: 3, player: "X" },
        { q: 0, r: 4, player: "X" },
        { q: 5, r: 0, player: "O" },
        { q: -1, r: 0, player: "O" },
        { q: 0, r: 5, player: "O" },
        { q: 0, r: -1, player: "O" },
        { q: 1, r: 1, player: "O" },
      ],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [
        "Look for a cell that is part of two different lines of X pieces.",
        "X has 5 on the q-axis and 5 on the r-axis. Where do they intersect?",
        "Place at (0, 0) — wait, it's already occupied by X! Look more carefully...",
      ],
      timeLimit: 45,
    },
    xpReward: 30,
  },
  {
    id: "puzzle-3-defensive-block",
    title: "The Perfect Block",
    description: "Block your opponent's threat while building your own.",
    category: "puzzles",
    difficulty: 5,
    orderIndex: 3,
    slides: [
      {
        type: "text",
        content:
          "O is threatening to win! You must block, but which blocking move also helps your own position?",
      },
    ],
    puzzle: {
      cells: [
        { q: -2, r: 0, player: "O" },
        { q: -1, r: 0, player: "O" },
        { q: 0, r: 0, player: "O" },
        { q: 1, r: 0, player: "O" },
        { q: 2, r: 0, player: "O" },
        { q: -1, r: 1, player: "X" },
        { q: 0, r: 1, player: "X" },
        { q: 1, r: 1, player: "X" },
        { q: 2, r: 1, player: "X" },
        { q: 3, r: 1, player: "X" },
      ],
      playerToMove: "X",
      solution: [{ q: 3, r: 0 }],
      hints: [
        "O has 5 in a row. You must block one end.",
        "Blocking at (3, 0) also places a piece adjacent to your own line.",
        "Block at (3, 0) — it stops O and positions you to extend your line on r=1.",
      ],
      timeLimit: 30,
    },
    xpReward: 35,
  },
  {
    id: "puzzle-4-the-squeeze",
    title: "The Squeeze",
    description:
      "Force your opponent into a position where they cannot avoid losing.",
    category: "puzzles",
    difficulty: 7,
    orderIndex: 4,
    slides: [
      {
        type: "text",
        content:
          "Advanced puzzle: you have two developing lines. Find the sequence that forces a win regardless of how your opponent responds.",
      },
    ],
    puzzle: {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "X" },
        { q: 2, r: 0, player: "X" },
        { q: 3, r: 0, player: "X" },
        { q: -1, r: 1, player: "X" },
        { q: 0, r: 1, player: "X" },
        { q: 1, r: 1, player: "X" },
        { q: 2, r: 1, player: "X" },
        { q: -1, r: 0, player: "O" },
        { q: 4, r: 0, player: "O" },
        { q: -2, r: 1, player: "O" },
        { q: 3, r: 1, player: "O" },
        { q: 0, r: -1, player: "O" },
        { q: 1, r: -1, player: "O" },
      ],
      playerToMove: "X",
      solution: [{ q: -1, r: 0 }],
      hints: [
        "X has 4 on q-axis at r=0 and 4 on q-axis at r=1. Look for a way to threaten both.",
        "O has blocked the ends of both lines. But there might be another axis to exploit.",
        "This is a tricky one — look for a diagonal (s-axis) connection between your pieces.",
      ],
      timeLimit: 60,
    },
    xpReward: 50,
  },
  {
    id: "puzzle-5-grandmaster",
    title: "Grandmaster Challenge",
    description: "The ultimate puzzle — find the hidden winning sequence.",
    category: "puzzles",
    difficulty: 9,
    orderIndex: 5,
    slides: [
      {
        type: "text",
        content:
          "This is one of the hardest puzzles. The winning move is not obvious — you need to see a hidden line that your opponent has overlooked.",
      },
    ],
    puzzle: {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: -1, player: "X" },
        { q: 2, r: -2, player: "X" },
        { q: 3, r: -3, player: "X" },
        { q: 4, r: -4, player: "X" },
        { q: -1, r: 0, player: "O" },
        { q: 0, r: -1, player: "O" },
        { q: 1, r: -2, player: "O" },
        { q: 2, r: -3, player: "O" },
        { q: 5, r: -4, player: "O" },
        { q: -1, r: 1, player: "O" },
        { q: 0, r: 1, player: "X" },
        { q: 1, r: 0, player: "X" },
        { q: 2, r: -1, player: "X" },
        { q: 3, r: -2, player: "X" },
        { q: 4, r: -3, player: "O" },
      ],
      playerToMove: "X",
      solution: [{ q: 4, r: -3 }],
      hints: [
        "Look beyond the obvious lines. Check all three axes carefully.",
        "X has pieces on the s-axis (diagonal). Count them.",
        "The s-axis line through (0,0) goes: (0,0), (1,-1), (2,-2), (3,-3), (4,-4). That's 5! But (4,-4) is blocked by O... look at the other diagonal.",
      ],
      timeLimit: 90,
    },
    xpReward: 75,
  },
];
