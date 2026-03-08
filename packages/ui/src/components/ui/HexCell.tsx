"use client";

import { Hexagon, Text } from "react-hexgrid";
import type { HexagonProps } from "react-hexgrid/lib/Hexagon/Hexagon";
import { cn } from "@/src/lib/utils";

export type PlayerMark = "X" | "O" | null;

interface HexCellProps extends Omit<HexagonProps, "q" | "r" | "s"> {
  q: number;
  r: number;
  s: number;
  mark?: PlayerMark;
  isClickable?: boolean;
  onClick?: () => void;
}

export function HexCell({
  q,
  r,
  s,
  mark = null,
  isClickable = true,
  onClick,
  className,
  ...props
}: HexCellProps) {
  const cellClass = cn(
    "fill-slate-100 stroke-slate-500 stroke-[0.05] transition-all duration-200 hover:fill-slate-200 hover:stroke-slate-600 hover:stroke-[0.08] cursor-default",
    {
      "cursor-pointer": isClickable && !mark,
    },
    className,
  );

  const textClass = cn(
    "text-xs font-semibold font-serif text-[0.6rem] select-none pointer-events-none",
    mark === "X" ? "fill-blue-600" : "fill-red-600",
  );

  return (
    <Hexagon
      q={q}
      r={r}
      s={s}
      className={cellClass}
      onClick={() => {
        if (isClickable && !mark && onClick) {
          onClick();
        }
      }}
      {...props}
    >
      {mark && <Text className={textClass}>{mark}</Text>}
    </Hexagon>
  );
}
