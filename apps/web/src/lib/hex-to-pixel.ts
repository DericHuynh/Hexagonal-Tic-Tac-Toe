// ============================================================================
// Hex-to-Pixel and Pixel-to-Hex conversions
// Uses "flat-top" hex orientation:
//   x = size * (3/2 * q)
//   y = size * (sqrt(3)/2 * q + sqrt(3) * r)
// ============================================================================

import type { AxialCoord, PixelCoord } from "@hex/game-core";

const SQRT3 = Math.sqrt(3);

/**
 * Convert axial hex coordinate to pixel center position.
 * @param coord  Axial (q, r) coordinate
 * @param size   Pixel size of hex (center to corner)
 * @param origin Screen origin (top-left pixel that maps to hex 0,0)
 */
export function axialToPixel(coord: AxialCoord, size: number, origin: PixelCoord): PixelCoord {
  const x = size * (1.5 * coord.q) + origin.x;
  const y = size * (SQRT3 * 0.5 * coord.q + SQRT3 * coord.r) + origin.y;
  return { x, y };
}

/**
 * Convert a pixel position to the nearest axial hex coordinate.
 * @param pixel  Pixel position
 * @param size   Pixel size of hex (center to corner)
 * @param origin Screen origin (top-left pixel that maps to hex 0,0)
 */
export function pixelToAxial(pixel: PixelCoord, size: number, origin: PixelCoord): AxialCoord {
  const px = (pixel.x - origin.x) / size;
  const py = (pixel.y - origin.y) / size;

  // Inverse of the forward transform matrix
  const q = (2 / 3) * px;
  const r = (-1 / 3) * px + (SQRT3 / 3) * py;

  return axialRound({ q, r });
}

/**
 * Round fractional axial coordinates to the nearest integer hex.
 */
export function axialRound(coord: { q: number; r: number }): AxialCoord {
  const s = -coord.q - coord.r;

  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  let rs = Math.round(s);

  const dq = Math.abs(rq - coord.q);
  const dr = Math.abs(rr - coord.r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

/**
 * Returns the 6 pixel corners of a flat-top hex centered at `center`.
 */
export function hexCorners(center: PixelCoord, size: number): PixelCoord[] {
  const corners: PixelCoord[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i; // flat-top starts at 0°
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }
  return corners;
}
