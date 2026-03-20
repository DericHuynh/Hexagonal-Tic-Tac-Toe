// ============================================================================
// Hexagonal Tic-Tac-Toe — Matchmaking Tests
// ============================================================================

import { describe, it, expect } from "vite-plus/test";
import {
  getSearchRange,
  shouldMatch,
  canMatch,
  findBestMatch,
  findMatches,
  assignRoles,
  generateGameId,
  estimateWaitTime,
} from "../src/matchmaking";
import type { QueueEntry } from "../src/types";

// ---------------------------------------------------------------------------
// getSearchRange
// ---------------------------------------------------------------------------

describe("getSearchRange", () => {
  it("returns 200 for wait time < 30 seconds", () => {
    expect(getSearchRange(0)).toBe(200);
    expect(getSearchRange(10)).toBe(200);
    expect(getSearchRange(29)).toBe(200);
  });

  it("returns 300 for wait time 30-59 seconds", () => {
    expect(getSearchRange(30)).toBe(300);
    expect(getSearchRange(45)).toBe(300);
    expect(getSearchRange(59)).toBe(300);
  });

  it("returns 500 for wait time 60-119 seconds", () => {
    expect(getSearchRange(60)).toBe(500);
    expect(getSearchRange(90)).toBe(500);
    expect(getSearchRange(119)).toBe(500);
  });

  it("returns Infinity for wait time >= 120 seconds", () => {
    expect(getSearchRange(120)).toBe(Infinity);
    expect(getSearchRange(180)).toBe(Infinity);
    expect(getSearchRange(300)).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// shouldMatch
// ---------------------------------------------------------------------------

describe("shouldMatch", () => {
  it("returns true when ELO difference is within range", () => {
    expect(shouldMatch(1000, 1100, 30)).toBe(true); // diff 100, range 200
    expect(shouldMatch(1000, 1200, 30)).toBe(true); // diff 200, exactly at limit
    expect(shouldMatch(1000, 1250, 60)).toBe(true); // diff 250, range 300
    expect(shouldMatch(1000, 1400, 60)).toBe(true); // diff 400, range 500
  });

  it("returns false when ELO difference exceeds range", () => {
    expect(shouldMatch(1000, 1250, 0)).toBe(false); // diff 250 > 200
    expect(shouldMatch(1000, 1500, 30)).toBe(false); // diff 500 > 300
    expect(shouldMatch(1000, 1600, 60)).toBe(false); // diff 600 > 500
  });

  it("returns true for any difference when wait time >= 120", () => {
    expect(shouldMatch(1000, 2000, 120)).toBe(true);
    expect(shouldMatch(1000, 3000, 180)).toBe(true);
  });

  it("handles equal ratings", () => {
    expect(shouldMatch(1000, 1000, 0)).toBe(true);
    expect(shouldMatch(1200, 1200, 30)).toBe(true);
  });

  it("handles reverse order (eloA < eloB)", () => {
    expect(shouldMatch(1100, 1000, 30)).toBe(true);
    expect(shouldMatch(1250, 1000, 0)).toBe(false); // diff 250 > 200
  });
});

// ---------------------------------------------------------------------------
// canMatch
// ---------------------------------------------------------------------------

describe("canMatch", () => {
  const now = 1000;

  it("returns true when both players are within combined wait time range", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 900,
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1150,
      gameMode: "standard",
      enqueuedAt: 950,
    };
    // waitA = 100, waitB = 50, maxWait = 100 -> range 200
    expect(canMatch(a, b, now)).toBe(true);
  });

  it("returns false when ELO difference exceeds max wait time range", () => {
    const a: QueueEntry = {
      userId: "a2",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 990,
    };
    const b: QueueEntry = {
      userId: "b2",
      elo: 1300,
      gameMode: "standard",
      enqueuedAt: 995,
    };
    // waitA2 = 10, waitB2 = 5, maxWait = 10 -> range 200, diff 300 -> false
    expect(canMatch(a, b, now)).toBe(false);
  });

  it("uses the longer wait time of the two players", () => {
    const a: QueueEntry = {
      userId: "a2",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 998,
    }; // wait 2
    const b: QueueEntry = {
      userId: "b2",
      elo: 1250,
      gameMode: "standard",
      enqueuedAt: 995,
    }; // wait 5, maxWait=5 -> range 200, diff 250 -> false
    expect(canMatch(a, b, now)).toBe(false);
  });

  it("handles same player (should not match with self)", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 900,
    };
    // Same userId, but different enqueuedAt - technically could match but shouldn't in practice
    expect(canMatch(a, a, now)).toBe(true); // function doesn't check userId
  });
});

// ---------------------------------------------------------------------------
// findBestMatch
// ---------------------------------------------------------------------------

describe("findBestMatch", () => {
  it("returns null for empty queue", () => {
    expect(findBestMatch(1000, [], 0)).toBeNull();
  });

  it("returns closest ELO match", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1050, gameMode: "standard", enqueuedAt: 200 },
      { userId: "c", elo: 1200, gameMode: "standard", enqueuedAt: 300 },
    ];
    const best = findBestMatch(1000, queue, 0);
    expect(best?.userId).toBe("a"); // diff 0
  });

  it("filters out opponents outside ELO range", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1500, gameMode: "standard", enqueuedAt: 200 }, // too far
      { userId: "c", elo: 1050, gameMode: "standard", enqueuedAt: 300 },
    ];
    const best = findBestMatch(1000, queue, 0);
    expect(best?.userId).toBe("a"); // not 'b' because out of range
  });

  it("sorts by ELO distance first, then wait time", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1050, gameMode: "standard", enqueuedAt: 100 }, // diff 50, wait 100

      { userId: "b", elo: 1050, gameMode: "standard", enqueuedAt: 200 }, // diff 50, wait 200

      { userId: "c", elo: 1100, gameMode: "standard", enqueuedAt: 50 }, // diff 100, wait 50
    ];

    const best = findBestMatch(1000, queue, 0);

    expect(best?.userId).toBe("a"); // same diff as 'b' but longer wait (100 > 200? Actually 100 is smaller enqueuedAt = longer wait)
  });

  it("returns any eligible match when range is Infinity", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 3000, gameMode: "standard", enqueuedAt: 200 },
    ];
    const best = findBestMatch(1000, queue, 120); // wait time >= 120 -> Infinity
    expect(best).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findMatches
// ---------------------------------------------------------------------------

describe("findMatches", () => {
  const now = 1000;

  it("returns empty array for queue with < 2 players", () => {
    expect(findMatches([], now)).toEqual([]);
    expect(
      findMatches([{ userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 }], now),
    ).toEqual([]);
  });

  it("matches two players with compatible ELO", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1050, gameMode: "standard", enqueuedAt: 200 },
    ];
    const pairs = findMatches(queue, now);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].playerA.userId).toBe("a");
    expect(pairs[0].playerB.userId).toBe("b");
  });

  it("does not match players with incompatible ELO", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 900 },

      { userId: "b", elo: 2000, gameMode: "standard", enqueuedAt: 950 },
    ];

    const pairs = findMatches(queue, now);

    expect(pairs).toHaveLength(0);
  });

  it("pairs multiple players optimally", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1010, gameMode: "standard", enqueuedAt: 200 },
      { userId: "c", elo: 2000, gameMode: "standard", enqueuedAt: 300 },
      { userId: "d", elo: 2010, gameMode: "standard", enqueuedAt: 400 },
    ];
    const pairs = findMatches(queue, now);
    expect(pairs).toHaveLength(2);
    // Check that pairs are (a,b) and (c,d)
    const pairElos = pairs.map((p) => [p.playerA.elo, p.playerB.elo].sort((a, b) => a - b));
    expect(pairElos).toContainEqual([1000, 1010]);
    expect(pairElos).toContainEqual([2000, 2010]);
  });

  it("leaves odd player unmatched", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1050, gameMode: "standard", enqueuedAt: 200 },
      { userId: "c", elo: 2000, gameMode: "standard", enqueuedAt: 300 }, // no match
    ];
    const pairs = findMatches(queue, now);
    expect(pairs).toHaveLength(1);
  });

  it("prefers closer ELO matches in greedy algorithm", () => {
    // Three players: 1000, 1050, 1100
    // Should match 1000-1050 (diff 50) rather than 1000-1100 (diff 100)
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1050, gameMode: "standard", enqueuedAt: 200 },
      { userId: "c", elo: 1100, gameMode: "standard", enqueuedAt: 300 },
    ];

    const pairs = findMatches(queue, now);

    expect(pairs).toHaveLength(1);

    const matched = new Set([pairs[0].playerA.userId, pairs[0].playerB.userId]);

    expect(matched.has("a")).toBe(true);

    expect(matched.has("b")).toBe(true);

    expect(matched.has("c")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assignRoles
// ---------------------------------------------------------------------------

describe("assignRoles", () => {
  it("assigns lower ELO player to X (first mover)", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 100,
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1200,
      gameMode: "standard",
      enqueuedAt: 200,
    };
    const { playerX, playerO } = assignRoles(a, b);
    expect(playerX.userId).toBe("a");
    expect(playerO.userId).toBe("b");
  });

  it("assigns higher ELO player to O (second mover)", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1500,
      gameMode: "standard",
      enqueuedAt: 100,
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1300,
      gameMode: "standard",
      enqueuedAt: 200,
    };
    const { playerX, playerO } = assignRoles(a, b);
    expect(playerX.userId).toBe("b");
    expect(playerO.userId).toBe("a");
  });

  it("breaks ELO ties by enqueue time (earlier gets X)", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 100,
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 200,
    };
    const { playerX, playerO } = assignRoles(a, b);
    expect(playerX.userId).toBe("a");
    expect(playerO.userId).toBe("b");
  });

  it("handles equal enqueue time (second param gets O)", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 100,
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 100,
    };
    const { playerX, playerO } = assignRoles(a, b);
    // Since a.enqueuedAt <= b.enqueuedAt, a gets X
    expect(playerX.userId).toBe("a");
    expect(playerO.userId).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// generateGameId
// ---------------------------------------------------------------------------

describe("generateGameId", () => {
  it("generates unique IDs", () => {
    const id1 = generateGameId();
    const id2 = generateGameId();
    expect(id1).not.toBe(id2);
  });

  it('starts with "game_" prefix', () => {
    const id = generateGameId();
    expect(id.startsWith("game_")).toBe(true);
  });

  it("contains timestamp component", () => {
    const id = generateGameId();
    const timestampPart = parseInt(id.split("_")[1], 36);
    // Not a strict test but verifies format
    expect(id).toMatch(/^game_[a-z0-9]+_[a-z0-9]+$/);
  });

  it("includes random suffix for uniqueness", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateGameId());
    }
    // Should have 100 unique IDs (no collisions)
    expect(ids.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// estimateWaitTime
// ---------------------------------------------------------------------------

describe("estimateWaitTime", () => {
  it("returns 0 for position 0", () => {
    expect(estimateWaitTime(0)).toBe(0);
  });

  it("estimates wait based on matches ahead", () => {
    // position 0: 0 matches ahead -> 0s
    expect(estimateWaitTime(0)).toBe(0);
    // position 1: ceil(1/2) = 1 match ahead -> 10s
    expect(estimateWaitTime(1)).toBe(10);
    // position 2: ceil(2/2) = 1 match ahead -> 10s
    expect(estimateWaitTime(2)).toBe(10);
    // position 3: ceil(3/2) = 2 matches ahead -> 20s
    expect(estimateWaitTime(3)).toBe(20);
    // position 4: ceil(4/2) = 2 matches ahead -> 20s
    expect(estimateWaitTime(4)).toBe(20);
  });

  it("uses custom average match interval", () => {
    expect(estimateWaitTime(3, 15)).toBe(30); // 2 matches * 15s = 30s
    expect(estimateWaitTime(5, 20)).toBe(60); // ceil(5/2)=3 * 20 = 60
  });

  it("handles large queue positions", () => {
    expect(estimateWaitTime(100, 10)).toBe(500); // ceil(100/2)=50 * 10
    expect(estimateWaitTime(101, 10)).toBe(510); // ceil(101/2)=51 * 10
  });
});

// ---------------------------------------------------------------------------
// Integration scenarios
// ---------------------------------------------------------------------------

describe("matchmaking flow integration", () => {
  const now = 1000;

  it("finds matches in expanding ELO ranges over time", () => {
    // Create a queue with two players whose ELO difference is 250

    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },

      { userId: "b", elo: 1250, gameMode: "standard", enqueuedAt: 100 },
    ];

    // At wait time 10s (now=110), range is 200 -> diff 250 exceeds, no match

    expect(findMatches(queue, 110)).toHaveLength(0);

    // At wait time 30s (now=130), range expands to 300 -> diff 250 within, match found

    // But note: findMatches sorts by wait time (both same), then tries to match

    // With wait=30, range=300, diff=250 -> they can match
    expect(findMatches(queue, 130)).toHaveLength(1);
  });

  it("handles mixed game modes", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1050, gameMode: "rapid", enqueuedAt: 200 }, // different mode
    ];
    // In real system, queue would be separated by mode; this function doesn't filter
    // But in practice you'd call findMatches on mode-filtered queue
    const pairs = findMatches(queue, now);
    expect(pairs).toHaveLength(1); // This function doesn't check gameMode
  });

  it("assigns roles correctly after matching", () => {
    const playerA: QueueEntry = {
      userId: "a",
      elo: 1100,
      gameMode: "standard",
      enqueuedAt: 100,
    };
    const playerB: QueueEntry = {
      userId: "b",
      elo: 1000,
      gameMode: "standard",
      enqueuedAt: 200,
    };

    const { playerX, playerO } = assignRoles(playerA, playerB);
    expect(playerX.elo).toBe(1000); // lower ELO gets X
    expect(playerO.elo).toBe(1100); // higher ELO gets O
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  const now = 1000;

  it("handles negative ELO values", () => {
    expect(shouldMatch(-100, 100, 0)).toBe(true); // diff 200
    expect(shouldMatch(-100, 150, 0)).toBe(false); // diff 250
  });

  it("handles very large ELO differences with Infinity range", () => {
    expect(shouldMatch(0, 10000, 120)).toBe(true);
    expect(shouldMatch(0, 100000, 180)).toBe(true);
  });

  it("handles queue with duplicate users (shouldn't happen but function doesn't check)", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 100 },
      { userId: "a", elo: 1000, gameMode: "standard", enqueuedAt: 200 }, // same userId
    ];
    const pairs = findMatches(queue, now);
    // Could match them, but in reality this shouldn't happen
    expect(pairs).toHaveLength(1);
  });

  it("handles exact boundary ELO differences", () => {
    // Exactly 200 diff with range 200 -> should match
    expect(shouldMatch(1000, 1200, 0)).toBe(true);
    expect(shouldMatch(1200, 1000, 0)).toBe(true);
    // Exactly 201 diff -> should not match
    expect(shouldMatch(1000, 1201, 0)).toBe(false);
  });

  it("findBestMatch returns first eligible when all same distance", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1050, gameMode: "standard", enqueuedAt: 100 },
      { userId: "b", elo: 1050, gameMode: "standard", enqueuedAt: 200 },
      { userId: "c", elo: 1050, gameMode: "standard", enqueuedAt: 300 },
    ];
    const best = findBestMatch(1000, queue, 0);
    // All have diff 50, should pick longest wait (smallest enqueuedAt)
    expect(best?.userId).toBe("a");
  });
});
