// ============================================================================
// Hexagonal Tic-Tac-Toe — Board State
// Pure functions for managing the sparse board state (Map<string, Player>).
// ============================================================================

import type { AxialCoord, Board, CellEntry, Player } from './types'
import { BOARD_RADIUS } from './types'
import { axialToKey, isValidCell, keyToAxial, forEachCell } from './hex'

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/** Create an empty board */
export function createBoard(): Board {
  return new Map<string, Player>()
}

// ---------------------------------------------------------------------------
// Cell Access
// ---------------------------------------------------------------------------

/** Get the player occupying a cell, or null if empty */
export function getCell(board: Board, coord: AxialCoord): Player | null {
  return board.get(axialToKey(coord)) ?? null
}

/** Check if a cell is empty (unoccupied) */
export function isCellEmpty(board: Board, coord: AxialCoord): boolean {
  return !board.has(axialToKey(coord))
}

/** Check if a cell is occupied */
export function isCellOccupied(board: Board, coord: AxialCoord): boolean {
  return board.has(axialToKey(coord))
}

// ---------------------------------------------------------------------------
// Mutation (immutable — returns new Map)
// ---------------------------------------------------------------------------

/** Set a cell to a player. Returns a new Board (immutable). Throws if cell is occupied. */
export function setCell(board: Board, coord: AxialCoord, player: Player): Board {
  const key = axialToKey(coord)
  if (board.has(key)) {
    throw new Error(`Cell (${coord.q}, ${coord.r}) is already occupied`)
  }
  const next = new Map(board)
  next.set(key, player)
  return next
}

/** Remove a cell's occupant. Returns a new Board (immutable). */
export function removeCell(board: Board, coord: AxialCoord): Board {
  const key = axialToKey(coord)
  if (!board.has(key)) {
    return board // no change needed
  }
  const next = new Map(board)
  next.delete(key)
  return next
}

/** Place a cell without checking occupancy (for replay/loading). Returns new Board. */
export function forceSetCell(board: Board, coord: AxialCoord, player: Player): Board {
  const next = new Map(board)
  next.set(axialToKey(coord), player)
  return next
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Count total pieces on the board */
export function countPieces(board: Board): number {
  return board.size
}

/** Count pieces belonging to a specific player */
export function countPlayerPieces(board: Board, player: Player): number {
  let count = 0
  for (const p of board.values()) {
    if (p === player) count++
  }
  return count
}

/** Check if the board is completely full */
export function isBoardFull(board: Board, radius: number = BOARD_RADIUS): boolean {
  const totalCells = 3 * radius * (radius + 1) + 1
  return board.size >= totalCells
}

/** Get all occupied cells as an array of { coord, player } */
export function getOccupiedCells(board: Board): CellEntry[] {
  const entries: CellEntry[] = []
  for (const [key, player] of board) {
    entries.push({ coord: keyToAxial(key), player })
  }
  return entries
}

/** Get all cells occupied by a specific player */
export function getPlayerCells(board: Board, player: Player): AxialCoord[] {
  const cells: AxialCoord[] = []
  for (const [key, p] of board) {
    if (p === player) {
      cells.push(keyToAxial(key))
    }
  }
  return cells
}

/** Get the last move (highest move index) — requires external move tracking */
export function getLastMove(
  board: Board,
  moveHistory: { q: number; r: number; moveIndex: number }[],
): AxialCoord | null {
  if (moveHistory.length === 0) return null
  const last = moveHistory.reduce((a, b) => (a.moveIndex > b.moveIndex ? a : b))
  return { q: last.q, r: last.r }
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/** Serialize board to a JSON-compatible array */
export function boardToArray(board: Board): { q: number; r: number; player: Player }[] {
  const result: { q: number; r: number; player: Player }[] = []
  for (const [key, player] of board) {
    const coord = keyToAxial(key)
    result.push({ q: coord.q, r: coord.r, player })
  }
  return result
}

/** Deserialize board from a JSON array */
export function boardFromArray(cells: { q: number; r: number; player: Player }[]): Board {
  const board = createBoard()
  for (const cell of cells) {
    board.set(axialToKey({ q: cell.q, r: cell.r }), cell.player)
  }
  return board
}

/** Serialize board to a compact string representation */
export function boardToString(board: Board): string {
  return JSON.stringify(boardToArray(board))
}

/** Deserialize board from a compact string */
export function boardFromString(str: string): Board {
  const cells = JSON.parse(str) as { q: number; r: number; player: Player }[]
  return boardFromArray(cells)
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validate a move: cell must be in bounds and empty */
export function isValidMove(
  board: Board,
  coord: AxialCoord,
  radius: number = BOARD_RADIUS,
): { valid: boolean; error?: string } {
  if (!isValidCell(coord, radius)) {
    return { valid: false, error: `Cell (${coord.q}, ${coord.r}) is outside the board` }
  }
  if (!isCellEmpty(board, coord)) {
    return { valid: false, error: `Cell (${coord.q}, ${coord.r}) is already occupied` }
  }
  return { valid: true }
}

// ---------------------------------------------------------------------------
// Debug / Display
// ---------------------------------------------------------------------------

/**
 * Create a string representation of the board for debugging.
 * Shows a portion of the board centered around the origin.
 */
export function boardToDebugString(
  board: Board,
  radius: number = 5,
): string {
  const lines: string[] = []
  for (let r = -radius; r <= radius; r++) {
    const indent = Math.abs(r)
    let line = ' '.repeat(indent)
    for (let q = -radius; q <= radius; q++) {
      if (Math.abs(-q - r) > radius) continue
      const cell = getCell(board, { q, r })
      if (cell === 'X') line += 'X '
      else if (cell === 'O') line += 'O '
      else line += '. '
    }
    lines.push(line.trimEnd())
  }
  return lines.join('\n')
}
