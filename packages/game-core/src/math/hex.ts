/**
 * Represents a Hex in Axial Coordinates (q, r).
 * The third coordinate 's' can be calculated as: s = -q - r
 */
export type HexCoord = {
  q: number;
  r: number;
};

/**
 * Returns the cube coordinates (q, r, s) from axial coordinates.
 */
export function toCube(hex: HexCoord) {
  return { q: hex.q, r: hex.r, s: -hex.q - hex.r };
}

/**
 * Calculates the exact distance between two hexes on an axial grid.
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const cubeA = toCube(a);
  const cubeB = toCube(b);

  return Math.max(
    Math.abs(cubeA.q - cubeB.q),
    Math.abs(cubeA.r - cubeB.r),
    Math.abs(cubeA.s - cubeB.s),
  );
}

/**
 * Validates if two hexes are adjacent (distance of exactly 1).
 */
export function isAdjacent(a: HexCoord, b: HexCoord): boolean {
  return hexDistance(a, b) === 1;
}

/**
 * Helper to check if two HexCoords are exactly equal.
 */
export function hexEqual(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Generates a standard hexagonal grid centered at (0,0) with a given radius.
 */
export function generateHexGrid(radius: number): HexCoord[] {
  const hexes: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      hexes.push({ q, r });
    }
  }
  return hexes;
}
