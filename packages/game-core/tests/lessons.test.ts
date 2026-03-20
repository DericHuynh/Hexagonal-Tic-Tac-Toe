// ============================================================================
// Hexagonal Tic-Tac-Toe — Lessons System Tests
// ============================================================================

import { describe, it, expect } from "vite-plus/test";
import {
  validatePuzzleMove,
  validatePuzzleSolution,
  applyPuzzleMove,
  calculatePuzzleScore,
  getStarRating,
  getTotalXp,
  filterByCategory,
  sortLessons,
  getNextLesson,
  DEFAULT_LESSONS,
} from "../src/lessons";
import type { Puzzle, Lesson, AxialCoord } from "../src/types";

// ---------------------------------------------------------------------------
// validatePuzzleMove
// ---------------------------------------------------------------------------

describe("validatePuzzleMove", () => {
  it("returns true for a correct move that matches solution", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 2, r: 0 }],
      hints: [],
    };
    expect(validatePuzzleMove(puzzle, { q: 2, r: 0 })).toBe(true);
  });

  it("returns false for incorrect move", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 2, r: 0 }],
      hints: [],
    };
    expect(validatePuzzleMove(puzzle, { q: 3, r: 0 })).toBe(false);
  });

  it("handles multi-move puzzles (any order)", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
      hints: [],
    };
    expect(validatePuzzleMove(puzzle, { q: 1, r: 0 })).toBe(true);
    expect(validatePuzzleMove(puzzle, { q: 3, r: 0 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validatePuzzleSolution
// ---------------------------------------------------------------------------

describe("validatePuzzleSolution", () => {
  it("returns true when all solution moves are played", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
      hints: [],
    };
    const moves: AxialCoord[] = [
      { q: 2, r: 0 },
      { q: 0, r: 0 },
      { q: 1, r: 0 },
    ];
    expect(validatePuzzleSolution(puzzle, moves)).toBe(true);
  });

  it("returns false when moves are incomplete", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
      hints: [],
    };
    const moves: AxialCoord[] = [{ q: 0, r: 0 }];
    expect(validatePuzzleSolution(puzzle, moves)).toBe(false);
  });

  it("returns false when extra moves are played", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
    };
    const moves: AxialCoord[] = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
    ];
    expect(validatePuzzleSolution(puzzle, moves)).toBe(false);
  });

  it("handles empty solution", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [],
      hints: [],
    };
    expect(validatePuzzleSolution(puzzle, [])).toBe(true);
    expect(validatePuzzleSolution(puzzle, [{ q: 0, r: 0 }])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyPuzzleMove
// ---------------------------------------------------------------------------

describe("applyPuzzleMove", () => {
  it("reconstructs board and applies move correctly", () => {
    const puzzle: Puzzle = {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "O" },
      ],
      playerToMove: "X",
      solution: [{ q: 2, r: 0 }],
      hints: [],
    };
    const result = applyPuzzleMove(puzzle, { q: 2, r: 0 });
    expect(result.board.get("0,0")).toBe("X");
    expect(result.board.get("1,0")).toBe("O");
    expect(result.board.get("2,0")).toBe("X");
  });

  it("detects win correctly", () => {
    // Create a puzzle where the move creates a 6-in-a-row
    const puzzle: Puzzle = {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "X" },
        { q: 2, r: 0, player: "X" },
        { q: 3, r: 0, player: "X" },
        { q: 4, r: 0, player: "X" },
      ],
      playerToMove: "X",
      solution: [{ q: 5, r: 0 }],
      hints: [],
    };
    const result = applyPuzzleMove(puzzle, { q: 5, r: 0 });
    expect(result.isWin).toBe(true);
    expect(result.winLine).not.toBeNull();
    expect(result.winLine!.length).toBeGreaterThanOrEqual(6);
  });

  it("returns no win when move does not complete six", () => {
    const puzzle: Puzzle = {
      cells: [
        { q: 0, r: 0, player: "X" },
        { q: 1, r: 0, player: "X" },
      ],
      playerToMove: "X",
      solution: [{ q: 2, r: 0 }],
      hints: [],
    };
    const result = applyPuzzleMove(puzzle, { q: 2, r: 0 });
    expect(result.isWin).toBe(false);
    expect(result.winLine).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// calculatePuzzleScore
// ---------------------------------------------------------------------------

describe("calculatePuzzleScore", () => {
  it("returns 100 for perfect solution with no hints and within time", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
      timeLimit: 60,
    };
    expect(calculatePuzzleScore(puzzle, 0, 30)).toBe(100);
  });

  it("deducts 15 points per hint used", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
    };
    expect(calculatePuzzleScore(puzzle, 1, 10)).toBe(85);
    expect(calculatePuzzleScore(puzzle, 2, 10)).toBe(70);
    expect(calculatePuzzleScore(puzzle, 3, 10)).toBe(55);
  });

  it("deducts 1 point per 3 seconds over par time", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
      timeLimit: 30, // par time
    };
    // 45 seconds = 15 seconds over = 5 point deduction
    expect(calculatePuzzleScore(puzzle, 0, 45)).toBe(95);
    expect(calculatePuzzleScore(puzzle, 0, 60)).toBe(90);
  });

  it("combines hint and time penalties", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
      timeLimit: 30,
    };
    // 2 hints = -30, 15s over = -5, total -35, min 0
    expect(calculatePuzzleScore(puzzle, 2, 45)).toBe(65);
  });

  it("floors score at 0", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
    };
    // 10 hints = -150, already negative
    expect(calculatePuzzleScore(puzzle, 10, 100)).toBe(0);
  });

  it("handles puzzles without time limit", () => {
    const puzzle: Puzzle = {
      cells: [],
      playerToMove: "X",
      solution: [{ q: 0, r: 0 }],
      hints: [],
    };
    // No timeLimit means no time penalty
    expect(calculatePuzzleScore(puzzle, 0, 1000)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// getStarRating
// ---------------------------------------------------------------------------

describe("getStarRating", () => {
  it("returns 1 star for score 0-59", () => {
    expect(getStarRating(0)).toBe(1);
    expect(getStarRating(30)).toBe(1);
    expect(getStarRating(59)).toBe(1);
  });

  it("returns 2 stars for score 60-84", () => {
    expect(getStarRating(60)).toBe(2);
    expect(getStarRating(70)).toBe(2);
    expect(getStarRating(84)).toBe(2);
  });

  it("returns 3 stars for score 85-100", () => {
    expect(getStarRating(85)).toBe(3);
    expect(getStarRating(90)).toBe(3);
    expect(getStarRating(100)).toBe(3);
  });

  it("clamps score to 0-100 range", () => {
    expect(getStarRating(-10)).toBe(1);
    expect(getStarRating(150)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getTotalXp
// ---------------------------------------------------------------------------

describe("getTotalXp", () => {
  it("returns sum of xpReward from all lessons", () => {
    const lessons: Lesson[] = [
      {
        id: "1",
        title: "Lesson 1",
        description: "",
        category: "basics",
        difficulty: 1,
        orderIndex: 0,
        slides: [],
        puzzle: null,
        xpReward: 100,
      },
      {
        id: "2",
        title: "Lesson 2",
        description: "",
        category: "tactics",
        difficulty: 2,
        orderIndex: 1,
        slides: [],
        puzzle: null,
        xpReward: 150,
      },
    ];
    expect(getTotalXp(lessons)).toBe(250);
  });

  it("returns 0 for empty array", () => {
    expect(getTotalXp([])).toBe(0);
  });

  it("handles lessons with varying xpReward", () => {
    const lessons: Lesson[] = [
      {
        id: "1",
        title: "Lesson 1",
        description: "",
        category: "basics",
        difficulty: 1,
        orderIndex: 0,
        slides: [],
        puzzle: null,
        xpReward: 50,
      },
      {
        id: "2",
        title: "Lesson 2",
        description: "",
        category: "tactics",
        difficulty: 2,
        orderIndex: 1,
        slides: [],
        puzzle: null,
        xpReward: 75,
      },
      {
        id: "3",
        title: "Lesson 3",
        description: "",
        category: "strategy",
        difficulty: 3,
        orderIndex: 2,
        slides: [],
        puzzle: null,
        xpReward: 100,
      },
    ];
    expect(getTotalXp(lessons)).toBe(225);
  });
});

// ---------------------------------------------------------------------------
// filterByCategory
// ---------------------------------------------------------------------------

describe("filterByCategory", () => {
  const lessons: Lesson[] = [
    {
      id: "1",
      title: "Lesson 1",
      description: "",
      category: "basics",
      difficulty: 1,
      orderIndex: 0,
      slides: [],
      puzzle: null,
      xpReward: 0,
    },
    {
      id: "2",
      title: "Lesson 2",
      description: "",
      category: "tactics",
      difficulty: 2,
      orderIndex: 1,
      slides: [],
      puzzle: null,
      xpReward: 0,
    },
    {
      id: "3",
      title: "Lesson 3",
      description: "",
      category: "basics",
      difficulty: 3,
      orderIndex: 2,
      slides: [],
      puzzle: null,
      xpReward: 0,
    },
  ];

  it("filters lessons by category", () => {
    const basics = filterByCategory(lessons, "basics");
    expect(basics).toHaveLength(2);
    expect(basics.map((l) => l.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when no matches", () => {
    const strategy = filterByCategory(lessons, "strategy");
    expect(strategy).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// sortLessons
// ---------------------------------------------------------------------------

describe("sortLessons", () => {
  it("sorts lessons by orderIndex ascending", () => {
    const lessons: Lesson[] = [
      {
        id: "3",
        title: "Third",
        description: "",
        category: "basics",
        difficulty: 3,
        orderIndex: 2,
        slides: [],
        puzzle: null,
        xpReward: 0,
      },
      {
        id: "1",
        title: "First",
        description: "",
        category: "basics",
        difficulty: 1,
        orderIndex: 0,
        slides: [],
        puzzle: null,
        xpReward: 0,
      },
      {
        id: "2",
        title: "Second",
        description: "",
        category: "basics",
        difficulty: 2,
        orderIndex: 1,
        slides: [],
        puzzle: null,
        xpReward: 0,
      },
    ];
    const sorted = sortLessons(lessons);
    expect(sorted.map((l) => l.id)).toEqual(["1", "2", "3"]);
  });

  it("does not mutate original array", () => {
    const lessons: Lesson[] = [
      {
        id: "1",
        title: "First",
        description: "",
        category: "basics",
        difficulty: 1,
        orderIndex: 1,
        slides: [],
        puzzle: null,
        xpReward: 0,
      },
      {
        id: "2",
        title: "Second",
        description: "",
        category: "basics",
        difficulty: 2,
        orderIndex: 0,
        slides: [],
        puzzle: null,
        xpReward: 0,
      },
    ];
    const originalOrder = lessons.map((l) => l.id);
    sortLessons(lessons);
    expect(lessons.map((l) => l.id)).toEqual(originalOrder);
  });

  it("handles empty array", () => {
    expect(sortLessons([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getNextLesson
// ---------------------------------------------------------------------------

describe("getNextLesson", () => {
  const lessons: Lesson[] = [
    {
      id: "1",
      title: "Lesson 1",
      description: "",
      category: "basics",
      difficulty: 1,
      orderIndex: 0,
      slides: [],
      puzzle: null,
      xpReward: 0,
    },
    {
      id: "2",
      title: "Lesson 2",
      description: "",
      category: "basics",
      difficulty: 2,
      orderIndex: 1,
      slides: [],
      puzzle: null,
      xpReward: 0,
    },
    {
      id: "3",
      title: "Lesson 3",
      description: "",
      category: "tactics",
      difficulty: 3,
      orderIndex: 2,
      slides: [],
      puzzle: null,
      xpReward: 0,
    },
  ];

  it("returns the lesson with the smallest orderIndex", () => {
    const next = getNextLesson(lessons, new Set());
    expect(next?.id).toBe("1");
  });

  it("skips completed lesson IDs", () => {
    const next = getNextLesson(lessons, new Set(["1"]));
    expect(next?.id).toBe("2");
  });

  it("skips multiple completed lessons", () => {
    const next = getNextLesson(lessons, new Set(["1", "2"]));
    expect(next?.id).toBe("3");
  });

  it("returns null when all lessons are completed", () => {
    const next = getNextLesson(lessons, new Set(["1", "2", "3"]));
    expect(next).toBeNull();
  });

  it("handles empty lessons array", () => {
    const next = getNextLesson([], new Set());
    expect(next).toBeNull();
  });

  it("handles non-existent completed IDs gracefully", () => {
    const next = getNextLesson(lessons, new Set(["999"]));
    expect(next?.id).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_LESSONS sanity checks
// ---------------------------------------------------------------------------

describe("DEFAULT_LESSONS", () => {
  it("contains at least one lesson", () => {
    expect(DEFAULT_LESSONS.length).toBeGreaterThan(0);
  });

  it("all lessons have required fields", () => {
    for (const lesson of DEFAULT_LESSONS) {
      expect(lesson.id).toBeDefined();
      expect(lesson.title).toBeDefined();
      expect(lesson.description).toBeDefined();
      expect(lesson.category).toBeDefined();
      expect(lesson.difficulty).toBeDefined();
      expect(lesson.orderIndex).toBeDefined();
      expect(lesson.slides).toBeDefined();
      expect(Array.isArray(lesson.slides)).toBe(true);
      expect(lesson.puzzle).toBeDefined();
      expect(lesson.xpReward).toBeDefined();
      expect(typeof lesson.xpReward).toBe("number");
    }
  });

  it("all lessons have unique IDs", () => {
    const ids = DEFAULT_LESSONS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all lessons have valid categories", () => {
    const validCategories = ["basics", "tactics", "strategy", "endgame", "puzzles"];
    for (const lesson of DEFAULT_LESSONS) {
      expect(validCategories).toContain(lesson.category);
    }
  });

  it("all lessons have difficulty in range 1-10", () => {
    for (const lesson of DEFAULT_LESSONS) {
      expect(lesson.difficulty).toBeGreaterThanOrEqual(1);
      expect(lesson.difficulty).toBeLessThanOrEqual(10);
    }
  });

  it("all slides have valid types", () => {
    const validTypes = ["text", "board", "interactive"];
    for (const lesson of DEFAULT_LESSONS) {
      for (const slide of lesson.slides) {
        expect(validTypes).toContain(slide.type);
      }
    }
  });

  it("lessons with puzzle have valid puzzle structure", () => {
    for (const lesson of DEFAULT_LESSONS) {
      if (lesson.puzzle) {
        expect(lesson.puzzle.cells).toBeDefined();
        expect(Array.isArray(lesson.puzzle.cells)).toBe(true);
        expect(lesson.puzzle.playerToMove).toMatch(/^[XO]$/);
        expect(lesson.puzzle.solution).toBeDefined();
        expect(Array.isArray(lesson.puzzle.solution)).toBe(true);
        expect(lesson.puzzle.hints).toBeDefined();
        expect(Array.isArray(lesson.puzzle.hints)).toBe(true);
      }
    }
  });

  it("lessons without puzzle have null puzzle", () => {
    for (const lesson of DEFAULT_LESSONS) {
      if (lesson.slides.some((s) => s.type === "interactive")) {
        // Interactive slides imply a puzzle
        expect(lesson.puzzle).not.toBeNull();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Integration: Full lesson flow
// ---------------------------------------------------------------------------

describe("lesson flow integration", () => {
  it("can complete a puzzle lesson from start to finish", () => {
    // Find a puzzle lesson in DEFAULT_LESSONS
    const puzzleLesson = DEFAULT_LESSONS.find((l) => l.puzzle !== null);
    expect(puzzleLesson).toBeDefined();

    if (!puzzleLesson || !puzzleLesson.puzzle) {
      throw new Error("No puzzle lesson found");
    }

    // Validate the puzzle solution
    const solution = puzzleLesson.puzzle.solution;
    expect(validatePuzzleSolution(puzzleLesson.puzzle, solution)).toBe(true);

    // Apply the solution moves one by one
    let result = applyPuzzleMove(puzzleLesson.puzzle, solution[0]);
    let board = result.board;
    for (let i = 1; i < solution.length; i++) {
      const cells = Array.from(board.entries()).map(([key, player]) => ({
        q: parseInt(key.split(",")[0]),
        r: parseInt(key.split(",")[1]),
        player,
      }));
      const nextPuzzle = { ...puzzleLesson.puzzle, cells };
      result = applyPuzzleMove(nextPuzzle, solution[i]);
      board = result.board;
    }

    // Final board should have all solution cells occupied by correct players
    for (const cell of solution) {
      const key = `${cell.q},${cell.r}`;
      expect(board.get(key)).toBe(puzzleLesson.puzzle.playerToMove);
    }
  });

  it("can calculate total XP for a lesson set", () => {
    const totalXp = getTotalXp(DEFAULT_LESSONS);
    expect(totalXp).toBeGreaterThan(0);
    expect(typeof totalXp).toBe("number");
  });

  it("can get next lesson after completing current", () => {
    const completed = new Set([DEFAULT_LESSONS[0].id]);
    const next = getNextLesson(DEFAULT_LESSONS, completed);
    expect(next).not.toBeNull();
    expect(next!.id).not.toBe(Array.from(completed)[0]);
  });
});
