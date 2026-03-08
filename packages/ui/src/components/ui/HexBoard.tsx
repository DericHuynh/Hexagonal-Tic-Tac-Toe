"use client";

import { useState, useMemo } from "react";
import { HexGrid, Layout, GridGenerator, Path, HexUtils } from "react-hexgrid";
import { cn } from "@/src/lib/utils";
import { HexCell, type PlayerMark } from "./HexCell";

export interface HexBoardProps {
  className?: string;
  width?: number;
  height?: number;
  radius?: number;
  size?: { x: number; y: number };
  flat?: boolean;
  spacing?: number;
  origin?: { x: number; y: number };
  marks?: Record<string, PlayerMark>;
  pathStart?: { q: number; r: number; s: number } | null;
  pathEnd?: { q: number; r: number; s: number } | null;
  onHexClick?: (hex: { q: number; r: number; s: number }) => void;
  onHexHover?: (hex: { q: number; r: number; s: number }) => void;
  children?: React.ReactNode;
}

/**
 * A responsive wrapper around `react-hexgrid` to render the Hexagonal Tic-Tac-Toe board.
 * Uses the hexgrid API with pathfinding support (default radius of 4).
 */
export function HexBoard({
  children,
  className,
  width = 800,
  height = 600,
  radius = 4,
  size = { x: 6, y: 6 },
  flat = false,
  spacing = 1.1,
  origin = { x: 0, y: 0 },
  marks = {},
  pathStart = null,
  pathEnd = null,
  onHexClick,
  onHexHover,
}: HexBoardProps) {
  const [internalPath, setInternalPath] = useState<{
    start: { q: number; r: number; s: number } | null;
    end: { q: number; r: number; s: number } | null;
  }>({ start: null, end: null });

  const hexagons = useMemo(() => {
    return GridGenerator.hexagon(radius);
  }, [radius]);

  const handleHexClick = (
    e: unknown,
    source: { state: { hex: { q: number; r: number; s: number } } },
  ) => {
    const hex = source.state.hex;
    if (onHexClick) {
      onHexClick(hex);
    }
  };

  const handleHexHover = (
    e: unknown,
    source: { state: { hex: { q: number; r: number; s: number } } },
  ) => {
    const targetHex = source.state.hex;
    if (onHexHover) {
      onHexHover(targetHex);
    }
  };

  const path = { start: pathStart, end: pathEnd };

  return (
    <div className={cn("md:p-4", className)}>
      <HexGrid width={width} height={height}>
        <Layout size={size} flat={flat} spacing={spacing} origin={origin}>
          {children ??
            hexagons.map((hex, i) => {
              const hexId = HexUtils.getID(hex);
              const mark = marks[hexId] ?? null;
              return (
                <HexCell
                  key={i}
                  q={hex.q}
                  r={hex.r}
                  s={hex.s}
                  mark={mark}
                  onClick={() => onHexClick?.(hex)}
                  onMouseEnter={handleHexHover}
                />
              );
            })}
          <Path
            start={path.start}
            end={path.end}
            className="stroke-blue-600 stroke-[0.08] fill-none"
          />
        </Layout>
      </HexGrid>
    </div>
  );
}
