// ============================================================================
// Hexagonal Tic-Tac-Toe — Hex Math
// Pure functions for axial/cube coordinate operations on a hexagonal grid.
// ============================================================================

import type { AxialCoord, CubeCoord } from "./types";
import { BOARD_RADIUS, HEX_DIRECTIONS } from "./types";

// ---------------------------------------------------------------------------
// Coordinate Conversions
// ---------------------------------------------------------------------------

export function axialToCube(coord: AxialCoord): CubeCoord {
  const s = -coord.q - coord.r;
  return { q: coord.q, r: coord.r, s: s === 0 ? 0 : s };
}

export function cubeToAxial(coord: CubeCoord): AxialCoord {
  return { q: coord.q, r: coord.r };
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
}

// ---------------------------------------------------------------------------
// Validity
// ---------------------------------------------------------------------------

/** Check if an axial coordinate is within a hex board of given radius */
export function isValidCell(coord: AxialCoord, radius: number = Infinity): boolean {
  if (!Number.isFinite(radius)) return true; // Infinite boundaries for dynamic sizing
  return (
    Math.abs(coord.q) <= radius &&
    Math.abs(coord.r) <= radius &&
    Math.abs(-coord.q - coord.r) <= radius
  );
}

// ---------------------------------------------------------------------------
// Neighbors
// ---------------------------------------------------------------------------

export function getNeighbors(coord: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map((d) => ({
    q: coord.q + d.q,
    r: coord.r + d.r,
  }));
}

export function getValidNeighbors(coord: AxialCoord, radius: number = Infinity): AxialCoord[] {
  return getNeighbors(coord).filter((n) => isValidCell(n, radius));
}

// ---------------------------------------------------------------------------
// Lines & Directions
// ---------------------------------------------------------------------------

export function getLine(start: AxialCoord, directionIndex: number, length: number): AxialCoord[] {
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

export function getAxisLine(
  center: AxialCoord,
  axisIndex: number,
  radius: number = Infinity,
): AxialCoord[] {
  const [dirPos, dirNeg] = getAxisDirections(axisIndex);
  const cells: AxialCoord[] = [center];
  const steps = Number.isFinite(radius) ? radius * 2 : 1000;

  // Walk positive direction
  for (let i = 1; i <= steps; i++) {
    const d = HEX_DIRECTIONS[dirPos];
    const cell: AxialCoord = { q: center.q + d.q * i, r: center.r + d.r * i };
    if (!isValidCell(cell, radius)) break;
    cells.push(cell);
  }

  // Walk negative direction
  for (let i = 1; i <= steps; i++) {
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

export function axialToKey(coord: AxialCoord): string {
  return `${coord.q},${coord.r}`;
}

export function keyToAxial(key: string): AxialCoord {
  const parts = key.split(",");
  return { q: parseInt(parts[0], 10), r: parseInt(parts[1], 10) };
}

// ---------------------------------------------------------------------------
// Iteration
// ---------------------------------------------------------------------------

export function forEachCell(radius: number, callback: (coord: AxialCoord) => void): void {
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) {
      callback({ q, r });
    }
  }
}

export function getAllCells(radius: number = BOARD_RADIUS): AxialCoord[] {
  const cells: AxialCoord[] = [];
  if (!Number.isFinite(radius)) {
    throw new Error("Cannot populate all cells for an infinite dynamic board");
  }
  forEachCell(radius, (coord) => cells.push(coord));
  return cells;
}

export function cellCount(radius: number): number {
  return 3 * radius * (radius + 1) + 1;
}

// ---------------------------------------------------------------------------
// Pixel Conversion (flat-top hexagons)
// ---------------------------------------------------------------------------

export function axialToPixel(coord: AxialCoord, hexSize: number): { x: number; y: number } {
  const x = hexSize * (1.5 * coord.q);
  const y = hexSize * ((Math.sqrt(3) / 2) * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

export function pixelToAxial(point: { x: number; y: number }, hexSize: number): AxialCoord {
  const q = ((2 / 3) * point.x) / hexSize;
  const r = ((-1 / 3) * point.x + (Math.sqrt(3) / 3) * point.y) / hexSize;
  return hexRound({ q, r, s: -q - r });
}

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

export function oppositeDirection(dirIndex: number): number {
  return (dirIndex + 3) % 6;
}

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

export function getAxisDirections(axisIndex: number): [number, number] {
  return [axisIndex, (axisIndex + 3) % 6];
}

export function walkDirection(
  start: AxialCoord,
  dirIndex: number,
  maxSteps: number,
  radius: number,
  predicate: (coord: AxialCoord) => boolean,
): AxialCoord[] {
  const dir = HEX_DIRECTIONS[dirIndex % 6];
  const result: AxialCoord[] = [];
  const limit = Number.isFinite(maxSteps) ? maxSteps : 1000;

  for (let i = 1; i <= limit; i++) {
    const cell: AxialCoord = { q: start.q + dir.q * i, r: start.r + dir.r * i };
    if (!isValidCell(cell, radius)) break;
    if (!predicate(cell)) break;
    result.push(cell);
  }
  return result;
}
