// ============================================================================
// Hexagonal Tic-Tac-Toe — Hex Math
// Pure functions for axial/cube coordinate operations on a hexagonal grid.
// ============================================================================

import type { AxialCoord, CubeCoord, Player } from "./types";
import { BOARD_RADIUS, HEX_DIRECTIONS } from "./types";

// ---------------------------------------------------------------------------
// Coordinate Conversions
// ---------------------------------------------------------------------------

/** Convert axial (q, r) to cube (q, r, s) where s = -q - r */
export function axialToCube(coord: AxialCoord): CubeCoord {
  const s = -coord.q - coord.r;
  return { q: coord.q, r: coord.r, s: s === 0 ? 0 : s };
}

/** Convert cube (q, r, s) to axial (q, r) — drop s */
export function cubeToAxial(coord: CubeCoord): AxialCoord {
  return { q: coord.q, r: coord.r };
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/** Hex distance between two axial coordinates */
export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(
    Math.abs(ac.q - bc.q),
    Math.abs(ac.r - bc.r),
    Math.abs(ac.s - bc.s),
  );
}

// ---------------------------------------------------------------------------
// Validity
// ---------------------------------------------------------------------------

/** Check if an axial coordinate is within a hex board of given radius */
export function isValidCell(
  coord: AxialCoord,
  radius: number = BOARD_RADIUS,
): boolean {
  return (
    Math.abs(coord.q) <= radius &&
    Math.abs(coord.r) <= radius &&
    Math.abs(-coord.q - coord.r) <= radius
  );
}

// ---------------------------------------------------------------------------
// Neighbors
// ---------------------------------------------------------------------------

/** Get the 6 neighboring axial coordinates of a cell */
export function getNeighbors(coord: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map((d) => ({
    q: coord.q + d.q,
    r: coord.r + d.r,
  }));
}

/** Get valid neighbors within the board radius */
export function getValidNeighbors(
  coord: AxialCoord,
  radius: number = BOARD_RADIUS,
): AxialCoord[] {
  return getNeighbors(coord).filter((n) => isValidCell(n, radius));
}

// ---------------------------------------------------------------------------
// Lines & Directions
// ---------------------------------------------------------------------------

/**
 * Generate a line of cells starting from `start` in a given direction index
 * (0-5, corresponding to HEX_DIRECTIONS) for `length` steps (including start).
 */
export function getLine(
  start: AxialCoord,
  directionIndex: number,
  length: number,
): AxialCoord[] {
  const dir = HEX_DIRECTIONS[directionIndex % 6];
  const line: AxialCoord[] = [];
  for (let i = 0; i < length; i++) {
    line.push({
      q: start.q + dir.q * i,
      r: start.r + dir.r * i,
    });
  }
  return line;
}

/**
 * Get all cells in both directions along an axis through a center cell.
 * axisIndex 0 = q-axis (directions 0 and 3)
 * axisIndex 1 = r-axis (directions 1 and 4)
 * axisIndex 2 = s-axis (directions 2 and 5)
 */
export function getAxisLine(
  center: AxialCoord,
  axisIndex: number,
  radius: number = BOARD_RADIUS,
): AxialCoord[] {
  // Each axis has two opposing directions
  const [dirPos, dirNeg] = getAxisDirections(axisIndex);

  const cells: AxialCoord[] = [center];

  // Walk positive direction
  for (let i = 1; i <= radius; i++) {
    const d = HEX_DIRECTIONS[dirPos];
    const cell: AxialCoord = { q: center.q + d.q * i, r: center.r + d.r * i };
    if (!isValidCell(cell, radius)) break;
    cells.push(cell);
  }

  // Walk negative direction
  for (let i = 1; i <= radius; i++) {
    const d = HEX_DIRECTIONS[dirNeg];
    const cell: AxialCoord = { q: center.q + d.q * i, r: center.r + d.r * i };
    if (!isValidCell(cell, radius)) break;
    cells.unshift(cell);
  }

  return cells;
}

// ---------------------------------------------------------------------------
// Key Serialization (for Map keys)
// ---------------------------------------------------------------------------

/** Serialize an axial coordinate to a string key "q,r" */
export function axialToKey(coord: AxialCoord): string {
  return `${coord.q},${coord.r}`;
}

/** Deserialize a "q,r" string key back to an axial coordinate */
export function keyToAxial(key: string): AxialCoord {
  const parts = key.split(",");
  return { q: parseInt(parts[0], 10), r: parseInt(parts[1], 10) };
}

// ---------------------------------------------------------------------------
// Iteration
// ---------------------------------------------------------------------------

/**
 * Iterate all valid cells in a hex board of given radius.
 * Calls the callback for each (q, r) coordinate.
 */
export function forEachCell(
  radius: number,
  callback: (coord: AxialCoord) => void,
): void {
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) {
      callback({ q, r });
    }
  }
}

/**
 * Collect all valid cells in a hex board of given radius as an array.
 */
export function getAllCells(radius: number = BOARD_RADIUS): AxialCoord[] {
  const cells: AxialCoord[] = [];
  forEachCell(radius, (coord) => cells.push(coord));
  return cells;
}

/** Total number of cells in a hex board of given radius */
export function cellCount(radius: number): number {
  return 3 * radius * (radius + 1) + 1;
}

// ---------------------------------------------------------------------------
// Pixel Conversion (flat-top hexagons)
// ---------------------------------------------------------------------------

/** Convert axial coordinate to pixel position (flat-top hexagons) */
export function axialToPixel(
  coord: AxialCoord,
  hexSize: number,
): { x: number; y: number } {
  const x = hexSize * (1.5 * coord.q);
  const y = hexSize * ((Math.sqrt(3) / 2) * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

/** Convert pixel position to axial coordinate (with rounding) */
export function pixelToAxial(
  point: { x: number; y: number },
  hexSize: number,
): AxialCoord {
  const q = ((2 / 3) * point.x) / hexSize;
  const r = ((-1 / 3) * point.x + (Math.sqrt(3) / 3) * point.y) / hexSize;
  return hexRound({ q, r, s: -q - r });
}

/** Round a fractional cube coordinate to the nearest hex cell */
export function hexRound(frac: CubeCoord): AxialCoord {
  let rq = Math.round(frac.q);
  let rr = Math.round(frac.r);
  let rs = Math.round(frac.s);

  const dq = Math.abs(rq - frac.q);
  const dr = Math.abs(rr - frac.r);
  const ds = Math.abs(rs - frac.s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  return { q: rq, r: rr };
}

/** Get the 6 corner points of a flat-top hexagon centered at (cx, cy) */
export function hexCorners(
  center: { x: number; y: number },
  hexSize: number,
): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push({
      x: center.x + hexSize * Math.cos(angle),
      y: center.y + hexSize * Math.sin(angle),
    });
  }
  return corners;
}

// ---------------------------------------------------------------------------
// Direction Helpers
// ---------------------------------------------------------------------------

/** Get the opposite direction index */
export function oppositeDirection(dirIndex: number): number {
  return (dirIndex + 3) % 6;
}

/** Get the direction index from one cell to an adjacent cell, or -1 if not adjacent */
export function getDirectionIndex(from: AxialCoord, to: AxialCoord): number {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    if (HEX_DIRECTIONS[i].q === dq && HEX_DIRECTIONS[i].r === dr) {
      return i;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Board Enumeration Helpers
// ---------------------------------------------------------------------------

/**
 * For each of the 3 axes, get the two opposing direction indices.
 * Axis 0: q-axis (dirs 0, 3)
 * Axis 1: r-axis (dirs 1, 4)
 * Axis 2: s-axis (dirs 2, 5)
 */
export function getAxisDirections(axisIndex: number): [number, number] {
  return [axisIndex, (axisIndex + 3) % 6];
}

/**
 * Walk from a cell in a direction for up to `maxSteps`, returning all cells
 * that are within the board and match the predicate.
 */
export function walkDirection(
  start: AxialCoord,
  dirIndex: number,
  maxSteps: number,
  radius: number,
  predicate: (coord: AxialCoord) => boolean,
): AxialCoord[] {
  const dir = HEX_DIRECTIONS[dirIndex % 6];
  const result: AxialCoord[] = [];
  for (let i = 1; i <= maxSteps; i++) {
    const cell: AxialCoord = { q: start.q + dir.q * i, r: start.r + dir.r * i };
    if (!isValidCell(cell, radius)) break;
    if (!predicate(cell)) break;
    result.push(cell);
  }
  return result;
}
