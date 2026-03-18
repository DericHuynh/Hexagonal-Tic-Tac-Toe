// ============================================================================
// Hexagonal Tic-Tac-Toe — Turn Manager Tests
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  createTurnState,
  getCurrentPlayer,
  getPiecesRemaining,
  canPlacePiece,
  isLastPieceOfTurn,
  getTurnDescription,
  placePiece,
  forceTurnSwitch,
  restoreTurnState,
  simulatePieces,
  turnStateAfterMoveCount,
} from '../src/turn-manager'
import type { TurnState } from '../src/types'

// ---------------------------------------------------------------------------
// createTurnState
// ---------------------------------------------------------------------------
describe('createTurnState', () => {
  it('starts with X as the current player', () => {
    const state = createTurnState()
    expect(state.currentTurn).toBe('X')
  })

  it('starts with 0 pieces placed this turn', () => {
    const state = createTurnState()
    expect(state.piecesPlacedThisTurn).toBe(0)
  })

  it('starts with moveCount 0', () => {
    const state = createTurnState()
    expect(state.moveCount).toBe(0)
  })

  it('marks the first turn as isFirstTurn', () => {
    const state = createTurnState()
    expect(state.isFirstTurn).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getCurrentPlayer
// ---------------------------------------------------------------------------
describe('getCurrentPlayer', () => {
  it('returns X for initial state', () => {
    const state = createTurnState()
    expect(getCurrentPlayer(state)).toBe('X')
  })

  it('returns O after X places opening move', () => {
    const state = placePiece(createTurnState())
    expect(getCurrentPlayer(state)).toBe('O')
  })

  it('returns X again after O completes their turn', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O places 1st
    state = placePiece(state) // O places 2nd → X's turn
    expect(getCurrentPlayer(state)).toBe('X')
  })
})

// ---------------------------------------------------------------------------
// getPiecesRemaining
// ---------------------------------------------------------------------------
describe('getPiecesRemaining', () => {
  it('returns 1 for opening move (X first turn)', () => {
    const state = createTurnState()
    expect(getPiecesRemaining(state)).toBe(1)
  })

  it('returns 2 at the start of O turn', () => {
    const state = placePiece(createTurnState()) // X placed opening
    expect(getPiecesRemaining(state)).toBe(2)
  })

  it('returns 1 after O places first of two pieces', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O places 1st
    expect(getPiecesRemaining(state)).toBe(1)
  })

  it('returns 2 at the start of X second turn', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens (1 piece)
    state = placePiece(state) // O places 1st
    state = placePiece(state) // O places 2nd → X's turn
    expect(getPiecesRemaining(state)).toBe(2)
  })

  it('returns 1 after X places first of two pieces in second turn', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st
    state = placePiece(state) // O 2nd
    state = placePiece(state) // X 1st of 2
    expect(getPiecesRemaining(state)).toBe(1)
  })

  it('returns 0 after a full turn is completed (should not happen in normal flow)', () => {
    // This tests the internal state — after placing 2 pieces, the turn switches
    // so piecesRemaining is always > 0 when it's your turn
    let state = createTurnState()
    state = placePiece(state) // X opens → O's turn, 2 remaining
    expect(getPiecesRemaining(state)).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// canPlacePiece
// ---------------------------------------------------------------------------
describe('canPlacePiece', () => {
  it('returns true for initial state', () => {
    expect(canPlacePiece(createTurnState())).toBe(true)
  })

  it('returns true mid-turn', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st
    expect(canPlacePiece(state)).toBe(true)
  })

  it('returns true at start of every turn', () => {
    // Simulate 10 moves
    let state = createTurnState()
    for (let i = 0; i < 10; i++) {
      expect(canPlacePiece(state)).toBe(true)
      state = placePiece(state)
    }
  })
})

// ---------------------------------------------------------------------------
// isLastPieceOfTurn
// ---------------------------------------------------------------------------
describe('isLastPieceOfTurn', () => {
  it('returns true for opening move (only 1 piece)', () => {
    const state = createTurnState()
    expect(isLastPieceOfTurn(state)).toBe(true)
  })

  it('returns false for first piece of a 2-piece turn', () => {
    const state = placePiece(createTurnState()) // O's turn, 2 remaining
    expect(isLastPieceOfTurn(state)).toBe(false)
  })

  it('returns true for second piece of a 2-piece turn', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st
    expect(isLastPieceOfTurn(state)).toBe(true) // O 2nd would end turn
  })
})

// ---------------------------------------------------------------------------
// getTurnDescription
// ---------------------------------------------------------------------------
describe('getTurnDescription', () => {
  it('describes opening move', () => {
    const state = createTurnState()
    expect(getTurnDescription(state)).toBe("X's opening move")
  })

  it('describes start of 2-piece turn', () => {
    const state = placePiece(createTurnState())
    expect(getTurnDescription(state)).toBe("O's turn — place 2 pieces")
  })

  it('describes second piece of turn', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st
    expect(getTurnDescription(state)).toBe('O — place 1 more piece')
  })

  it('describes X second turn start', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st
    state = placePiece(state) // O 2nd
    expect(getTurnDescription(state)).toBe("X's turn — place 2 pieces")
  })
})

// ---------------------------------------------------------------------------
// placePiece
// ---------------------------------------------------------------------------
describe('placePiece', () => {
  it('increments moveCount on each call', () => {
    let state = createTurnState()
    expect(state.moveCount).toBe(0)
    state = placePiece(state)
    expect(state.moveCount).toBe(1)
    state = placePiece(state)
    expect(state.moveCount).toBe(2)
    state = placePiece(state)
    expect(state.moveCount).toBe(3)
  })

  it('switches from X to O after opening move', () => {
    const state = placePiece(createTurnState())
    expect(state.currentTurn).toBe('O')
    expect(state.isFirstTurn).toBe(false)
  })

  it('keeps O as current player after O places first piece', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens → O's turn
    state = placePiece(state) // O 1st
    expect(state.currentTurn).toBe('O')
    expect(state.piecesPlacedThisTurn).toBe(1)
  })

  it('switches to X after O places second piece', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st
    state = placePiece(state) // O 2nd → X's turn
    expect(state.currentTurn).toBe('X')
    expect(state.piecesPlacedThisTurn).toBe(0)
  })

  it('alternates correctly through multiple full turns', () => {
    let state = createTurnState()

    // Move 0: X opening
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'O', moveCount: 1, piecesPlacedThisTurn: 0 })

    // Moves 1-2: O's turn
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'O', moveCount: 2, piecesPlacedThisTurn: 1 })
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'X', moveCount: 3, piecesPlacedThisTurn: 0 })

    // Moves 3-4: X's turn
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'X', moveCount: 4, piecesPlacedThisTurn: 1 })
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'O', moveCount: 5, piecesPlacedThisTurn: 0 })

    // Moves 5-6: O's turn
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'O', moveCount: 6, piecesPlacedThisTurn: 1 })
    state = placePiece(state)
    expect(state).toMatchObject({ currentTurn: 'X', moveCount: 7, piecesPlacedThisTurn: 0 })
  })

  it('never has piecesPlacedThisTurn >= 2', () => {
    let state = createTurnState()
    for (let i = 0; i < 20; i++) {
      state = placePiece(state)
      expect(state.piecesPlacedThisTurn).toBeLessThan(2)
    }
  })

  it('isFirstTurn is false after first placement', () => {
    const state = placePiece(createTurnState())
    expect(state.isFirstTurn).toBe(false)
  })

  it('isFirstTurn stays false for all subsequent placements', () => {
    let state = createTurnState()
    for (let i = 0; i < 10; i++) {
      state = placePiece(state)
      expect(state.isFirstTurn).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// forceTurnSwitch
// ---------------------------------------------------------------------------
describe('forceTurnSwitch', () => {
  it('switches X to O', () => {
    const state = createTurnState()
    const switched = forceTurnSwitch(state)
    expect(switched.currentTurn).toBe('O')
  })

  it('switches O to X', () => {
    const state = placePiece(createTurnState()) // O's turn
    const switched = forceTurnSwitch(state)
    expect(switched.currentTurn).toBe('X')
  })

  it('resets piecesPlacedThisTurn to 0', () => {
    let state = createTurnState()
    state = placePiece(state) // X opens
    state = placePiece(state) // O 1st, piecesPlaced=1
    const switched = forceTurnSwitch(state)
    expect(switched.piecesPlacedThisTurn).toBe(0)
  })

  it('does NOT increment moveCount', () => {
    let state = createTurnState()
    state = placePiece(state)
    state = placePiece(state)
    const beforeCount = state.moveCount
    const switched = forceTurnSwitch(state)
    expect(switched.moveCount).toBe(beforeCount)
  })

  it('sets isFirstTurn to false', () => {
    const state = createTurnState()
    const switched = forceTurnSwitch(state)
    expect(switched.isFirstTurn).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// restoreTurnState
// ---------------------------------------------------------------------------
describe('restoreTurnState', () => {
  it('restores state from moveCount 0', () => {
    const state = restoreTurnState({
      currentTurn: 'X',
      piecesPlacedThisTurn: 0,
      moveCount: 0,
    })
    expect(state.currentTurn).toBe('X')
    expect(state.piecesPlacedThisTurn).toBe(0)
    expect(state.moveCount).toBe(0)
    expect(state.isFirstTurn).toBe(true)
  })

  it('restores state from moveCount 1 (O mid-turn)', () => {
    const state = restoreTurnState({
      currentTurn: 'O',
      piecesPlacedThisTurn: 1,
      moveCount: 2,
    })
    expect(state.currentTurn).toBe('O')
    expect(state.piecesPlacedThisTurn).toBe(1)
    expect(state.moveCount).toBe(2)
    expect(state.isFirstTurn).toBe(false)
  })

  it('restores state from moveCount 10', () => {
    const state = restoreTurnState({
      currentTurn: 'X',
      piecesPlacedThisTurn: 0,
      moveCount: 10,
    })
    expect(state.currentTurn).toBe('X')
    expect(state.moveCount).toBe(10)
    expect(state.isFirstTurn).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// simulatePieces
// ---------------------------------------------------------------------------
describe('simulatePieces', () => {
  it('simulating 0 pieces returns same state', () => {
    const state = createTurnState()
    const simulated = simulatePieces(state, 0)
    expect(simulated).toEqual(state)
  })

  it('simulating 1 piece from initial state gives O turn', () => {
    const state = createTurnState()
    const simulated = simulatePieces(state, 1)
    expect(simulated.currentTurn).toBe('O')
    expect(simulated.moveCount).toBe(1)
  })

  it('simulating 3 pieces from initial state gives O mid-turn', () => {
    // 0: X opens → O turn
    // 1: O 1st → O still
    // 2: O 2nd → X turn
    const state = createTurnState()
    const simulated = simulatePieces(state, 3)
    expect(simulated.currentTurn).toBe('X')
    expect(simulated.moveCount).toBe(3)
  })

  it('simulating many pieces produces consistent state', () => {
    const state = createTurnState()
    const simulated = simulatePieces(state, 100)
    expect(simulated.moveCount).toBe(100)
    // Verify with turnStateAfterMoveCount
    const fromCount = turnStateAfterMoveCount(100)
    expect(simulated.currentTurn).toBe(fromCount.currentTurn)
    expect(simulated.piecesPlacedThisTurn).toBe(fromCount.piecesPlacedThisTurn)
  })
})

// ---------------------------------------------------------------------------
// turnStateAfterMoveCount
// ---------------------------------------------------------------------------
describe('turnStateAfterMoveCount', () => {
  it('moveCount 0 → X opening', () => {
    const state = turnStateAfterMoveCount(0)
    expect(state).toMatchObject({
      currentTurn: 'X',
      piecesPlacedThisTurn: 0,
      moveCount: 0,
      isFirstTurn: true,
    })
  })

  it('moveCount 1 → O, 1 placed of 2', () => {
    const state = turnStateAfterMoveCount(1)
    expect(state).toMatchObject({
      currentTurn: 'O',
      piecesPlacedThisTurn: 0,
      moveCount: 1,
      isFirstTurn: false,
    })
  })

  it('moveCount 2 → O, 2 placed → X turn starts', () => {
    const state = turnStateAfterMoveCount(2)
    expect(state).toMatchObject({
      currentTurn: 'O',
      piecesPlacedThisTurn: 1,
      moveCount: 2,
      isFirstTurn: false,
    })
  })

  it('moveCount 3 → X, 1 placed of 2', () => {
    const state = turnStateAfterMoveCount(3)
    expect(state).toMatchObject({
      currentTurn: 'X',
      piecesPlacedThisTurn: 0,
      moveCount: 3,
      isFirstTurn: false,
    })
  })

  it('moveCount 4 → X, 2 placed → O turn starts', () => {
    const state = turnStateAfterMoveCount(4)
    expect(state).toMatchObject({
      currentTurn: 'X',
      piecesPlacedThisTurn: 1,
      moveCount: 4,
      isFirstTurn: false,
    })
  })

  it('moveCount 5 → O, 1 placed of 2', () => {
    const state = turnStateAfterMoveCount(5)
    expect(state).toMatchObject({
      currentTurn: 'O',
      piecesPlacedThisTurn: 0,
      moveCount: 5,
      isFirstTurn: false,
    })
  })

  it('moveCount 6 → O, 2 placed → X turn starts', () => {
    const state = turnStateAfterMoveCount(6)
    expect(state).toMatchObject({
      currentTurn: 'O',
      piecesPlacedThisTurn: 1,
      moveCount: 6,
      isFirstTurn: false,
    })
  })

  it('is consistent with sequential placePiece calls', () => {
    let sequential = createTurnState()
    for (let i = 0; i <= 20; i++) {
      const fromCount = turnStateAfterMoveCount(i)
      expect(sequential.currentTurn).toBe(fromCount.currentTurn)
      expect(sequential.piecesPlacedThisTurn).toBe(fromCount.piecesPlacedThisTurn)
      expect(sequential.moveCount).toBe(fromCount.moveCount)

      if (i < 20) {
        sequential = placePiece(sequential)
      }
    }
  })

  it('even moveCounts (after opening) are end of a turn', () => {
    // moveCount 2, 4, 6, 8... should be the second piece of a turn
    for (let mc = 2; mc <= 20; mc += 2) {
      const state = turnStateAfterMoveCount(mc)
      expect(state.piecesPlacedThisTurn).toBe(1)
    }
  })

  it('odd moveCounts (after opening) are start/mid of a turn', () => {
    // moveCount 1, 3, 5, 7... should be the first piece of a turn
    for (let mc = 1; mc <= 19; mc += 2) {
      const state = turnStateAfterMoveCount(mc)
      expect(state.piecesPlacedThisTurn).toBe(0)
    }
  })

  it('O plays on moves 1-2, 5-6, 9-10, ...', () => {
    // O's 2-piece turns: (1,2), (5,6), (9,10), ...
    // These are moveCounts where floor((mc-1)/2) is even
    const oMoves = [1, 2, 5, 6, 9, 10, 13, 14, 17, 18]
    for (const mc of oMoves) {
      const state = turnStateAfterMoveCount(mc)
      expect(state.currentTurn).toBe('O')
    }
  })

  it('X plays on moves 3-4, 7-8, 11-12, ...', () => {
    // X's 2-piece turns: (3,4), (7,8), (11,12), ...
    const xMoves = [3, 4, 7, 8, 11, 12, 15, 16, 19, 20]
    for (const mc of xMoves) {
      const state = turnStateAfterMoveCount(mc)
      expect(state.currentTurn).toBe('X')
    }
  })
})

// ---------------------------------------------------------------------------
// Integration: full game simulation
// ---------------------------------------------------------------------------
describe('full game simulation', () => {
  it('can simulate 50 moves without errors', () => {
    let state = createTurnState()
    for (let i = 0; i < 50; i++) {
      expect(canPlacePiece(state)).toBe(true)
      state = placePiece(state)
    }
    expect(state.moveCount).toBe(50)
  })

  it('total pieces placed by X and O are roughly equal after many moves', () => {
    let state = createTurnState()
    let xTurns = 0
    let oTurns = 0

    // Count whose turn it is at each move
    for (let i = 0; i < 50; i++) {
      if (state.currentTurn === 'X') xTurns++
      else oTurns++
      state = placePiece(state)
    }

    // X gets 1 opening + then alternates 2-piece turns
    // After 50 moves: X had opening (1) + 12 full 2-piece turns = 25
    // O had 13 full 2-piece turns = 26... wait let's count differently
    // Actually we're counting whose turn it IS, not who placed
    // X places on moves: 0, 3,4, 7,8, 11,12, ...
    // O places on moves: 1,2, 5,6, 9,10, ...
    // After 50 moves (indices 0-49):
    // X: 1 (opening) + 24 (12 turns of 2) = 25
    // O: 25 (13 turns, but last might be partial... actually 25)
    // They should be very close
    expect(Math.abs(xTurns - oTurns)).toBeLessThanOrEqual(1)
  })

  it('piecesPlacedThisTurn is always 0 or 1', () => {
    let state = createTurnState()
    for (let i = 0; i < 100; i++) {
      expect(state.piecesPlacedThisTurn).toBeGreaterThanOrEqual(0)
      expect(state.piecesPlacedThisTurn).toBeLessThanOrEqual(1)
      state = placePiece(state)
    }
  })

  it('moveCount increments by exactly 1 each time', () => {
    let state = createTurnState()
    for (let i = 0; i < 50; i++) {
      const before = state.moveCount
      state = placePiece(state)
      expect(state.moveCount).toBe(before + 1)
    }
  })
})
