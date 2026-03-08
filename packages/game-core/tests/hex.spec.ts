import { describe, it, expect } from "vitest";
import { hexDistance, isAdjacent, toCube, generateHexGrid } from "../src/math/hex";

describe("Hex Math (Axial/Cube)", () => {
  it("converts axial to cube correctly", () => {
    expect(toCube({ q: 1, r: -1 })).toEqual({ q: 1, r: -1, s: 0 });
    expect(toCube({ q: 2, r: 3 })).toEqual({ q: 2, r: 3, s: -5 });
  });

  it("calculates exact distance between hexes", () => {
    // origin to adjacent
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    // distance of 2
    expect(hexDistance({ q: -1, r: 0 }, { q: 1, r: 0 })).toBe(2);
    // diagonalish distance
    expect(hexDistance({ q: -2, r: 2 }, { q: 2, r: -2 })).toBe(4);
  });

  it("validates adjacency", () => {
    expect(isAdjacent({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(true);
    expect(isAdjacent({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(true);
    expect(isAdjacent({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(true);
    expect(isAdjacent({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(false);
  });

  it("generates a correct hex grid radius", () => {
    // Radius 0 = 1 center hex
    expect(generateHexGrid(0).length).toBe(1);
    // Radius 1 = 1 center + 6 surrounding = 7 hexes
    expect(generateHexGrid(1).length).toBe(7);
    // Radius 2 = 19 hexes
    expect(generateHexGrid(2).length).toBe(19);
  });
});
