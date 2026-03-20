// ============================================================================
// Hexagonal Tic-Tac-Toe — Hex Math Tests
// ============================================================================

import { describe, it, expect } from "vite-plus/test";
import {
  axialToCube,
  cubeToAxial,
  hexDistance,
  isValidCell,
  getNeighbors,
  getValidNeighbors,
  getLine,
  getAxisLine,
  axialToKey,
  keyToAxial,
  forEachCell,
  getAllCells,
  cellCount,
  axialToPixel,
  pixelToAxial,
  hexRound,
  hexCorners,
  oppositeDirection,
  getDirectionIndex,
  getAxisDirections,
  walkDirection,
} from "../src/hex";
import { BOARD_RADIUS, HEX_DIRECTIONS } from "../src/types";

describe("axialToCube", () => {
  it("converts (0,0) to (0,0,0)", () => {
    expect(axialToCube({ q: 0, r: 0 })).toEqual({ q: 0, r: 0, s: 0 });
  });

  it("converts (3, -2) to (3, -2, -1)", () => {
    expect(axialToCube({ q: 3, r: -2 })).toEqual({ q: 3, r: -2, s: -1 });
  });

  it("s = -q - r always holds", () => {
    const coord = { q: 5, r: -3 };
    const cube = axialToCube(coord);
    expect(cube.s).toBe(-coord.q - coord.r);
  });
});

describe("cubeToAxial", () => {
  it("drops the s coordinate", () => {
    expect(cubeToAxial({ q: 2, r: -1, s: -1 })).toEqual({ q: 2, r: -1 });
  });

  it("roundtrips with axialToCube", () => {
    const original = { q: 4, r: -2 };
    const cube = axialToCube(original);
    const back = cubeToAxial(cube);
    expect(back).toEqual(original);
  });
});

describe("hexDistance", () => {
  it("distance from origin to origin is 0", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it("distance from origin to (1,0) is 1", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
  });

  it("distance from origin to (0,1) is 1", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
  });

  it("distance from origin to (1,-1) is 1", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1);
  });

  it("distance from origin to (2,0) is 2", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2);
  });

  it("distance is symmetric", () => {
    const a = { q: 3, r: -1 };
    const b = { q: -2, r: 4 };
    expect(hexDistance(a, b)).toBe(hexDistance(b, a));
  });

  it("distance from origin to (3, -2) is 3", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -2 })).toBe(3);
  });
});

describe("isValidCell", () => {
  it("origin is always valid", () => {
    expect(isValidCell({ q: 0, r: 0 }, 5)).toBe(true);
  });

  it("cell at radius edge is valid", () => {
    expect(isValidCell({ q: 5, r: 0 }, 5)).toBe(true);
    expect(isValidCell({ q: 0, r: 5 }, 5)).toBe(true);
    expect(isValidCell({ q: -5, r: 0 }, 5)).toBe(true);
  });

  it("cell beyond radius is invalid", () => {
    expect(isValidCell({ q: 6, r: 0 }, 5)).toBe(false);
    expect(isValidCell({ q: 0, r: 6 }, 5)).toBe(false);
  });

  it("cell at (5, -5) is invalid because s=0 but q=5 exceeds radius", () => {
    // Actually (5, -5) -> s = 0, all abs <= 5, so it IS valid
    expect(isValidCell({ q: 5, r: -5 }, 5)).toBe(true);
  });

  it("cell at (5, 5) is invalid because s=-10 exceeds radius", () => {
    expect(isValidCell({ q: 5, r: 5 }, 5)).toBe(false);
  });

  it("uses default BOARD_RADIUS when not specified", () => {
    expect(isValidCell({ q: 0, r: 0 })).toBe(true);
    expect(isValidCell({ q: BOARD_RADIUS, r: 0 })).toBe(true);
    expect(isValidCell({ q: BOARD_RADIUS + 1, r: 0 })).toBe(false);
  });
});

describe("getNeighbors", () => {
  it("returns 6 neighbors for origin", () => {
    const neighbors = getNeighbors({ q: 0, r: 0 });
    expect(neighbors).toHaveLength(6);
  });

  it("returns correct neighbors for origin", () => {
    const neighbors = getNeighbors({ q: 0, r: 0 });
    const expected = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];
    for (const exp of expected) {
      expect(neighbors).toContainEqual(exp);
    }
  });

  it("all neighbors are distance 1 from origin", () => {
    const neighbors = getNeighbors({ q: 0, r: 0 });
    for (const n of neighbors) {
      expect(hexDistance({ q: 0, r: 0 }, n)).toBe(1);
    }
  });

  it("neighbors of (3, -2) are correct", () => {
    const neighbors = getNeighbors({ q: 3, r: -2 });
    expect(neighbors).toContainEqual({ q: 4, r: -2 });
    expect(neighbors).toContainEqual({ q: 2, r: -2 });
    expect(neighbors).toContainEqual({ q: 3, r: -1 });
    expect(neighbors).toContainEqual({ q: 3, r: -3 });
  });
});

describe("getValidNeighbors", () => {
  it("filters out-of-bounds neighbors at board edge", () => {
    const neighbors = getValidNeighbors({ q: 5, r: 0 }, 5);
    // (6,0) is out of bounds, so should be filtered
    expect(neighbors).not.toContainEqual({ q: 6, r: 0 });
    expect(neighbors.length).toBeLessThan(6);
  });

  it("returns all 6 neighbors for interior cells", () => {
    const neighbors = getValidNeighbors({ q: 0, r: 0 }, 5);
    expect(neighbors).toHaveLength(6);
  });
});

describe("getLine", () => {
  it("generates a line of 3 cells along direction 0", () => {
    const line = getLine({ q: 0, r: 0 }, 0, 3);
    expect(line).toEqual([
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
  });

  it("generates a line of 3 cells along direction 2", () => {
    const line = getLine({ q: 0, r: 0 }, 2, 3);
    expect(line).toEqual([
      { q: 0, r: 0 },
      { q: 0, r: -1 },
      { q: 0, r: -2 },
    ]);
  });

  it("generates a single cell for length 1", () => {
    const line = getLine({ q: 3, r: -1 }, 0, 1);
    expect(line).toEqual([{ q: 3, r: -1 }]);
  });
});

describe("getAxisLine", () => {
  it("generates q-axis line through origin", () => {
    const line = getAxisLine({ q: 0, r: 0 }, 0, 3);
    // Should include cells along both directions of q-axis
    expect(line).toContainEqual({ q: 0, r: 0 });
    expect(line).toContainEqual({ q: 1, r: 0 });
    expect(line).toContainEqual({ q: -1, r: 0 });
    expect(line).toContainEqual({ q: 2, r: 0 });
    expect(line).toContainEqual({ q: -2, r: 0 });
    expect(line).toContainEqual({ q: 3, r: 0 });
    expect(line).toContainEqual({ q: -3, r: 0 });
  });

  it("generates r-axis line through origin", () => {
    const line = getAxisLine({ q: 0, r: 0 }, 1, 2);
    expect(line).toContainEqual({ q: 0, r: 0 });
    expect(line).toContainEqual({ q: 1, r: -1 });
    expect(line).toContainEqual({ q: -1, r: 1 });
  });

  it("generates s-axis line through origin", () => {
    const line = getAxisLine({ q: 0, r: 0 }, 2, 2);
    expect(line).toContainEqual({ q: 0, r: 0 });
    expect(line).toContainEqual({ q: 0, r: -1 });
    expect(line).toContainEqual({ q: 0, r: 1 });
  });

  it("respects board bounds", () => {
    const line = getAxisLine({ q: 4, r: 0 }, 0, 5);
    // Positive direction: (5,0) is valid, (6,0) is not
    expect(line).toContainEqual({ q: 5, r: 0 });
    expect(line).not.toContainEqual({ q: 6, r: 0 });
  });
});

describe("axialToKey / keyToAxial", () => {
  it('serializes (0,0) to "0,0"', () => {
    expect(axialToKey({ q: 0, r: 0 })).toBe("0,0");
  });

  it('serializes (3, -2) to "3,-2"', () => {
    expect(axialToKey({ q: 3, r: -2 })).toBe("3,-2");
  });

  it('deserializes "0,0" to (0,0)', () => {
    expect(keyToAxial("0,0")).toEqual({ q: 0, r: 0 });
  });

  it('deserializes "3,-2" to (3,-2)', () => {
    expect(keyToAxial("3,-2")).toEqual({ q: 3, r: -2 });
  });

  it("roundtrips correctly", () => {
    const coord = { q: -7, r: 12 };
    expect(keyToAxial(axialToKey(coord))).toEqual(coord);
  });
});

describe("forEachCell", () => {
  it("iterates the correct number of cells for radius 1", () => {
    let count = 0;
    forEachCell(1, () => count++);
    expect(count).toBe(7); // 3*1*2 + 1 = 7
  });

  it("iterates the correct number of cells for radius 2", () => {
    let count = 0;
    forEachCell(2, () => count++);
    expect(count).toBe(19); // 3*2*3 + 1 = 19
  });

  it("all iterated cells are valid", () => {
    forEachCell(3, (coord) => {
      expect(isValidCell(coord, 3)).toBe(true);
    });
  });

  it("includes origin", () => {
    let foundOrigin = false;
    forEachCell(5, (coord) => {
      if (coord.q === 0 && coord.r === 0) foundOrigin = true;
    });
    expect(foundOrigin).toBe(true);
  });
});

describe("getAllCells", () => {
  it("returns correct count for radius 1", () => {
    expect(getAllCells(1)).toHaveLength(7);
  });

  it("returns correct count for radius 2", () => {
    expect(getAllCells(2)).toHaveLength(19);
  });

  it("returns correct count for radius 20", () => {
    expect(getAllCells(20)).toHaveLength(1261);
  });

  it("all cells are valid", () => {
    const cells = getAllCells(5);
    for (const cell of cells) {
      expect(isValidCell(cell, 5)).toBe(true);
    }
  });
});

describe("cellCount", () => {
  it("returns 1 for radius 0", () => {
    expect(cellCount(0)).toBe(1);
  });

  it("returns 7 for radius 1", () => {
    expect(cellCount(1)).toBe(7);
  });

  it("returns 19 for radius 2", () => {
    expect(cellCount(2)).toBe(19);
  });

  it("returns 1261 for radius 20", () => {
    expect(cellCount(20)).toBe(1261);
  });

  it("matches getAllCells length", () => {
    for (let r = 0; r <= 5; r++) {
      expect(cellCount(r)).toBe(getAllCells(r).length);
    }
  });
});

describe("axialToPixel", () => {
  it("origin maps to (0, 0)", () => {
    const pixel = axialToPixel({ q: 0, r: 0 }, 30);
    expect(pixel.x).toBeCloseTo(0);
    expect(pixel.y).toBeCloseTo(0);
  });

  it("(1, 0) maps to (size * 1.5, size * sqrt(3)/2)", () => {
    const size = 30;
    const pixel = axialToPixel({ q: 1, r: 0 }, size);
    expect(pixel.x).toBeCloseTo(size * 1.5);
    expect(pixel.y).toBeCloseTo(size * (Math.sqrt(3) / 2));
  });

  it("(0, 1) maps to (0, size * sqrt(3))", () => {
    const size = 30;
    const pixel = axialToPixel({ q: 0, r: 1 }, size);
    expect(pixel.x).toBeCloseTo(0);
    expect(pixel.y).toBeCloseTo(size * Math.sqrt(3));
  });
});

describe("pixelToAxial / hexRound", () => {
  it("pixel (0, 0) maps back to origin", () => {
    const coord = pixelToAxial({ x: 0, y: 0 }, 30);
    expect(coord).toEqual({ q: 0, r: 0 });
  });

  it("roundtrips axial to pixel to axial for origin", () => {
    const size = 30;
    const original = { q: 0, r: 0 };
    const pixel = axialToPixel(original, size);
    const recovered = pixelToAxial(pixel, size);
    expect(recovered).toEqual(original);
  });

  it("roundtrips axial to pixel to axial for (3, -1)", () => {
    const size = 30;
    const original = { q: 3, r: -1 };
    const pixel = axialToPixel(original, size);
    const recovered = pixelToAxial(pixel, size);
    expect(recovered).toEqual(original);
  });

  it("rounds fractional cube coordinates correctly", () => {
    // hexRound should snap to nearest valid hex
    expect(hexRound({ q: 0.4, r: 0.1, s: -0.5 })).toEqual({ q: 0, r: 0 });
    expect(hexRound({ q: 0.6, r: 0.1, s: -0.7 })).toEqual({ q: 1, r: 0 });
  });
});

describe("hexCorners", () => {
  it("returns 6 corners", () => {
    const corners = hexCorners({ x: 0, y: 0 }, 30);
    expect(corners).toHaveLength(6);
  });

  it("all corners are at distance hexSize from center", () => {
    const size = 30;
    const center = { x: 100, y: 100 };
    const corners = hexCorners(center, size);
    for (const corner of corners) {
      const dist = Math.sqrt((corner.x - center.x) ** 2 + (corner.y - center.y) ** 2);
      expect(dist).toBeCloseTo(size, 5);
    }
  });
});

describe("oppositeDirection", () => {
  it("returns the opposite direction index", () => {
    expect(oppositeDirection(0)).toBe(3);
    expect(oppositeDirection(1)).toBe(4);
    expect(oppositeDirection(2)).toBe(5);
    expect(oppositeDirection(3)).toBe(0);
    expect(oppositeDirection(4)).toBe(1);
    expect(oppositeDirection(5)).toBe(2);
  });
});

describe("getDirectionIndex", () => {
  it("returns correct index for adjacent cells", () => {
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(0);
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1);
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: 0, r: -1 })).toBe(2);
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: -1, r: 0 })).toBe(3);
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(4);
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(5);
  });

  it("returns -1 for non-adjacent cells", () => {
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(-1);
    expect(getDirectionIndex({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(-1);
  });
});

describe("getAxisDirections", () => {
  it("axis 0 returns directions 0 and 3", () => {
    const [pos, neg] = getAxisDirections(0);
    expect(pos).toBe(0);
    expect(neg).toBe(3);
  });

  it("axis 1 returns directions 1 and 4", () => {
    const [pos, neg] = getAxisDirections(1);
    expect(pos).toBe(1);
    expect(neg).toBe(4);
  });

  it("axis 2 returns directions 2 and 5", () => {
    const [pos, neg] = getAxisDirections(2);
    expect(pos).toBe(2);
    expect(neg).toBe(5);
  });

  it("opposing directions are always 3 apart", () => {
    for (let axis = 0; axis < 3; axis++) {
      const [pos, neg] = getAxisDirections(axis);
      expect((pos + 3) % 6).toBe(neg);
    }
  });
});

describe("walkDirection", () => {
  it("walks in direction 0 from origin", () => {
    const cells = walkDirection({ q: 0, r: 0 }, 0, 5, 5, () => true);
    expect(cells).toEqual([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 3, r: 0 },
      { q: 4, r: 0 },
      { q: 5, r: 0 },
    ]);
  });

  it("stops at board edge", () => {
    const cells = walkDirection({ q: 4, r: 0 }, 0, 5, 5, () => true);
    expect(cells).toEqual([{ q: 5, r: 0 }]);
  });

  it("stops when predicate returns false", () => {
    const cells = walkDirection({ q: 0, r: 0 }, 0, 5, 5, (coord) => coord.q < 3);
    expect(cells).toEqual([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
  });

  it("returns empty array if first step fails predicate", () => {
    const cells = walkDirection({ q: 0, r: 0 }, 0, 5, 5, () => false);
    expect(cells).toEqual([]);
  });
});

describe("HEX_DIRECTIONS", () => {
  it("has exactly 6 directions", () => {
    expect(HEX_DIRECTIONS).toHaveLength(6);
  });

  it("all directions are valid neighbors of origin", () => {
    for (const dir of HEX_DIRECTIONS) {
      expect(hexDistance({ q: 0, r: 0 }, dir)).toBe(1);
    }
  });

  it("opposite directions sum to zero", () => {
    for (let i = 0; i < 3; i++) {
      const a = HEX_DIRECTIONS[i];
      const b = HEX_DIRECTIONS[i + 3];
      expect(a.q + b.q).toBe(0);
      expect(a.r + b.r).toBe(0);
    }
  });
});
