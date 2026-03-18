// ============================================================================
// Hexagonal Tic-Tac-Toe — Turn Manager
// Pure functions for managing the turn state machine.
//
// Turn rules:
//   Move 0:      X places 1 piece (opening move) → turn passes to O
//   Moves 1-2:   O places 2 pieces → turn passes to X
//   Moves 3-4:   X places 2 pieces → turn passes to O
//   Moves 5-6:   O places 2 pieces → turn passes to X
//   ...alternating 2-piece turns from here on
//
// Win is checked after each individual piece placement, so a player can win
// on the first piece of a 2-piece turn (the second piece is never placed).
// ============================================================================

import type { Player, TurnState } from './types'

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/** Create the initial turn state (X's opening move) */
export function createTurnState(): TurnState {
  return {
    currentTurn: 'X',
    piecesPlacedThisTurn: 0,
    moveCount: 0,
    isFirstTurn: true,
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get the current player whose turn it is */
export function getCurrentPlayer(state: TurnState): Player {
  return state.currentTurn
}

/**
 * Get how many pieces the current player has left to place this turn.
 *
 * - Opening move (moveCount === 0): X has 1 piece to place
 * - All subsequent turns: the player has 2 pieces to place,
 *   minus however many they've already placed this turn
 */
export function getPiecesRemaining(state: TurnState): number {
  if (state.isFirstTurn) {
    return 1 - state.piecesPlacedThisTurn
  }
  return 2 - state.piecesPlacedThisTurn
}

/** Check if the current player can place a piece right now */
export function canPlacePiece(state: TurnState): boolean {
  return getPiecesRemaining(state) > 0
}

/**
 * Determine whether placing one more piece would end the current player's turn.
 * After this piece, the turn switches to the other player.
 */
export function isLastPieceOfTurn(state: TurnState): boolean {
  return getPiecesRemaining(state) === 1
}

/**
 * Get a human-readable description of the current turn state.
 * Useful for the HUD.
 */
export function getTurnDescription(state: TurnState): string {
  const player = state.currentTurn
  const remaining = getPiecesRemaining(state)

  if (state.isFirstTurn) {
    return `${player}'s opening move`
  }

  if (remaining === 2) {
    return `${player}'s turn — place 2 pieces`
  }

  return `${player} — place ${remaining} more piece${remaining !== 1 ? 's' : ''}`
}

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

/**
 * Apply a piece placement and return the new turn state.
 *
 * If the piece completes the current player's turn (they've placed all their
 * pieces), the turn switches to the other player. Otherwise the same player
 * continues.
 *
 * @throws Error if the current player has no pieces remaining
 */
export function placePiece(state: TurnState): TurnState {
  if (!canPlacePiece(state)) {
    throw new Error(
      `Cannot place piece: ${state.currentTurn} has no pieces remaining this turn`,
    )
  }

  const newMoveCount = state.moveCount + 1
  const newPiecesPlaced = state.piecesPlacedThisTurn + 1

  // Opening move: X places 1 piece, then it's O's turn (2 pieces)
  if (state.isFirstTurn) {
    return {
      currentTurn: 'O',
      piecesPlacedThisTurn: 0,
      moveCount: newMoveCount,
      isFirstTurn: false,
    }
  }

  // Mid-turn: same player still has pieces left
  if (newPiecesPlaced < 2) {
    return {
      currentTurn: state.currentTurn,
      piecesPlacedThisTurn: newPiecesPlaced,
      moveCount: newMoveCount,
      isFirstTurn: false,
    }
  }

  // Turn complete: switch to the other player
  const nextPlayer: Player = state.currentTurn === 'X' ? 'O' : 'X'
  return {
    currentTurn: nextPlayer,
    piecesPlacedThisTurn: 0,
    moveCount: newMoveCount,
    isFirstTurn: false,
  }
}

/**
 * Force a turn switch (e.g., after a resignation or timeout).
 * Resets piecesPlacedThisTurn to 0 and switches to the other player.
 * Does NOT increment moveCount — this is for non-placement turn changes.
 */
export function forceTurnSwitch(state: TurnState): TurnState {
  return {
    currentTurn: state.currentTurn === 'X' ? 'O' : 'X',
    piecesPlacedThisTurn: 0,
    moveCount: state.moveCount,
    isFirstTurn: false,
  }
}

/**
 * Restore a turn state from persisted data.
 * Useful when loading a game from the database.
 */
export function restoreTurnState(data: {
  currentTurn: Player
  piecesPlacedThisTurn: number
  moveCount: number
}): TurnState {
  return {
    currentTurn: data.currentTurn,
    piecesPlacedThisTurn: data.piecesPlacedThisTurn,
    moveCount: data.moveCount,
    isFirstTurn: data.moveCount === 0,
  }
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate placing N pieces and return the resulting turn state.
 * Useful for previewing turn progression without mutating state.
 */
export function simulatePieces(state: TurnState, count: number): TurnState {
  let current = state
  for (let i = 0; i < count; i++) {
    if (!canPlacePiece(current)) break
    current = placePiece(current)
  }
  return current
}

/**
 * Calculate whose turn it will be after a given total number of pieces
 * have been placed on the board.
 *
 * This is deterministic:
 *   moveCount 0       → X's turn, 1 piece to place (opening)
 *   moveCount 1       → O's turn, 2 pieces to place
 *   moveCount 2       → O's turn, 1 piece remaining
 *   moveCount 3       → X's turn, 2 pieces to place
 *   moveCount 4       → X's turn, 1 piece remaining
 *   moveCount 5       → O's turn, 2 pieces to place
 *   ...
 */
export function turnStateAfterMoveCount(moveCount: number): TurnState {
  if (moveCount === 0) {
    return createTurnState()
  }

  // After opening move (moveCount >= 1):
  //   moveCount 1 → O, 1 placed of 2 (1 remaining)
  //   moveCount 2 → O, 2 placed of 2 → X's turn, 0 placed
  //   moveCount 3 → X, 1 placed of 2 (1 remaining)
  //   moveCount 4 → X, 2 placed of 2 → O's turn, 0 placed
  //   moveCount 5 → O, 1 placed of 2 (1 remaining)
  //   ...

  // Moves 1-2 are O's 2-piece turn
  // Moves 3-4 are X's 2-piece turn
  // Moves 5-6 are O's 2-piece turn
  // etc.

  // After move 0, we're in a 2-piece turn cycle starting with O.
  // The cycle length is 2 moves per turn.
  // Offset by 1 (since move 0 is the special opening).

  const adjustedMove = moveCount - 1 // 0-indexed after opening
  const turnIndex = Math.floor(adjustedMove / 2) // which 2-piece turn (0 = O's first, 1 = X's first, ...)
  const withinTurn = adjustedMove % 2 // 0 = first piece of turn, 1 = second piece

  // O starts the 2-piece turns (turnIndex 0), then alternates
  const currentTurn: Player = turnIndex % 2 === 0 ? 'O' : 'X'

  return {
    currentTurn,
    piecesPlacedThisTurn: withinTurn,
    moveCount,
    isFirstTurn: false,
  }
}
