// ============================================================================
// Hexagonal Tic-Tac-Toe — ELO Rating Tests
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  getKFactor,
  calculateExpectedScore,
  calculateNewRating,
  calculateRatingChange,
  calculateMatchElo,
  getRatingTier,
  getNextTier,
  getTierProgress,
  formatRating,
  shouldCountForElo,
  getProvisionalMultiplier,
} from '../src/elo'
import { RATING_TIERS, DEFAULT_ELO } from '../src/types'

// ---------------------------------------------------------------------------
// getKFactor
// ---------------------------------------------------------------------------
describe('getKFactor', () => {
  it('returns 40 for new players (0-10 games)', () => {
    expect(getKFactor(0)).toBe(40)
    expect(getKFactor(5)).toBe(40)
    expect(getKFactor(10)).toBe(40)
  })

  it('returns 32 for settling players (11-30 games)', () => {
    expect(getKFactor(11)).toBe(32)
    expect(getKFactor(20)).toBe(32)
    expect(getKFactor(30)).toBe(32)
  })

  it('returns 24 for established players (31+ games)', () => {
    expect(getKFactor(31)).toBe(24)
    expect(getKFactor(50)).toBe(24)
    expect(getKFactor(1000)).toBe(24)
  })

  it('K-factor decreases as games played increases', () => {
    expect(getKFactor(5)).toBeGreaterThan(getKFactor(15))
    expect(getKFactor(15)).toBeGreaterThan(getKFactor(50))
  })
})

// ---------------------------------------------------------------------------
// calculateExpectedScore
// ---------------------------------------------------------------------------
describe('calculateExpectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5, 5)
    expect(calculateExpectedScore(1500, 1500)).toBeCloseTo(0.5, 5)
  })

  it('returns > 0.5 when player A is higher rated', () => {
    const score = calculateExpectedScore(1600, 1200)
    expect(score).toBeGreaterThan(0.5)
  })

  it('returns < 0.5 when player B is higher rated', () => {
    const score = calculateExpectedScore(1200, 1600)
    expect(score).toBeLessThan(0.5)
  })

  it('approaches 1.0 for vastly higher rated player', () => {
    const score = calculateExpectedScore(2400, 800)
    expect(score).toBeGreaterThan(0.95)
  })

  it('approaches 0.0 for vastly lower rated player', () => {
    const score = calculateExpectedScore(800, 2400)
    expect(score).toBeLessThan(0.05)
  })

  it('is symmetric: E_A + E_B = 1', () => {
    const eA = calculateExpectedScore(1400, 1000)
    const eB = calculateExpectedScore(1000, 1400)
    expect(eA + eB).toBeCloseTo(1.0, 10)
  })

  it('400-point difference gives ~0.91 expected score', () => {
    // Standard ELO: 400 point difference → 1/(1+10^(-1)) ≈ 0.909
    const score = calculateExpectedScore(1600, 1200)
    expect(score).toBeCloseTo(0.909, 2)
  })
})

// ---------------------------------------------------------------------------
// calculateNewRating
// ---------------------------------------------------------------------------
describe('calculateNewRating', () => {
  it('returns current rating when expected equals actual (0.5 vs 0.5)', () => {
    const newRating = calculateNewRating(1200, 0.5, 0.5, 24)
    expect(newRating).toBe(1200)
  })

  it('increases rating on win (actual > expected)', () => {
    // Equal ratings, win: expected=0.5, actual=1.0
    const newRating = calculateNewRating(1200, 0.5, 1.0, 24)
    expect(newRating).toBeGreaterThan(1200)
    // Change should be K * (1 - 0.5) = 24 * 0.5 = 12
    expect(newRating).toBe(1212)
  })

  it('decreases rating on loss (actual < expected)', () => {
    // Equal ratings, loss: expected=0.5, actual=0.0
    const newRating = calculateNewRating(1200, 0.5, 0.0, 24)
    expect(newRating).toBeLessThan(1200)
    // Change should be K * (0 - 0.5) = 24 * -0.5 = -12
    expect(newRating).toBe(1188)
  })

  it('floors rating at 0', () => {
    // Very low rating with a loss should not go below 0
    const newRating = calculateNewRating(5, 0.5, 0.0, 40)
    expect(newRating).toBeGreaterThanOrEqual(0)
  })

  it('higher K-factor means larger changes', () => {
    const change24 = calculateNewRating(1200, 0.5, 1.0, 24)
    const change40 = calculateNewRating(1200, 0.5, 1.0, 40)
    expect(change40 - 1200).toBeGreaterThan(change24 - 1200)
  })

  it('upset win gives larger gain than expected win', () => {
    // Lower rated player wins: expected is low, actual is 1.0
    const upsetWin = calculateNewRating(1000, 0.25, 1.0, 24)
    // Higher rated player wins: expected is high, actual is 1.0
    const expectedWin = calculateNewRating(1400, 0.75, 1.0, 24)

    const upsetGain = upsetWin - 1000
    const expectedGain = expectedWin - 1400

    expect(upsetGain).toBeGreaterThan(expectedGain)
  })
})

// ---------------------------------------------------------------------------
// calculateRatingChange
// ---------------------------------------------------------------------------
describe('calculateRatingChange', () => {
  it('returns correct change for equal ratings, win', () => {
    const result = calculateRatingChange(1200, 1200, 1, 50)
    // K=24, expected=0.5, actual=1.0 → change = 24 * 0.5 = 12
    expect(result.change).toBe(12)
    expect(result.newRating).toBe(1212)
  })

  it('returns correct change for equal ratings, loss', () => {
    const result = calculateRatingChange(1200, 1200, 0, 50)
    // K=24, expected=0.5, actual=0.0 → change = 24 * -0.5 = -12
    expect(result.change).toBe(-12)
    expect(result.newRating).toBe(1188)
  })

  it('returns correct change for equal ratings, draw', () => {
    const result = calculateRatingChange(1200, 1200, 0.5, 50)
    // K=24, expected=0.5, actual=0.5 → change = 0
    expect(result.change).toBe(0)
    expect(result.newRating).toBe(1200)
  })

  it('new player gets larger swings (K=40)', () => {
    const result = calculateRatingChange(1200, 1200, 1, 5)
    // K=40, expected=0.5, actual=1.0 → change = 40 * 0.5 = 20
    expect(result.change).toBe(20)
    expect(result.newRating).toBe(1220)
  })

  it('upset victory gives large gain', () => {
    // 1000 rated beats 1600 rated
    const result = calculateRatingChange(1000, 1600, 1, 50)
    // Expected ≈ 0.03 (very low), actual = 1.0
    // Change ≈ 24 * (1 - 0.03) ≈ 23.3 → 23
    expect(result.change).toBeGreaterThan(15)
    expect(result.newRating).toBeGreaterThan(1015)
  })

  it('expected win gives small gain', () => {
    // 1600 rated beats 1000 rated
    const result = calculateRatingChange(1600, 1000, 1, 50)
    // Expected ≈ 0.97, actual = 1.0
    // Change ≈ 24 * (1 - 0.97) ≈ 0.7 → 0 or 1
    expect(result.change).toBeLessThanOrEqual(2)
  })

  it('total rating is conserved approximately in a match', () => {
    const winner = calculateRatingChange(1200, 1200, 1, 50)
    const loser = calculateRatingChange(1200, 1200, 0, 50)
    // Winner gains what loser loses
    expect(winner.change).toBe(-loser.change)
  })
})

// ---------------------------------------------------------------------------
// calculateMatchElo
// ---------------------------------------------------------------------------
describe('calculateMatchElo', () => {
  it('calculates correct ELO changes for a decisive match', () => {
    const result = calculateMatchElo(1200, 1200, 50, 50, false)
    expect(result.winnerChange).toBe(12) // K=24, +12
    expect(result.loserChange).toBe(-12) // K=24, -12
    expect(result.winnerNewElo).toBe(1212)
    expect(result.loserNewElo).toBe(1188)
  })

  it('calculates correct ELO changes for a draw', () => {
    const result = calculateMatchElo(1200, 1200, 50, 50, true)
    // Draw: both get 0.5, expected=0.5, so no change
    expect(result.winnerChange).toBe(0)
    expect(result.loserChange).toBe(0)
    expect(result.winnerNewElo).toBe(1200)
    expect(result.loserNewElo).toBe(1200)
  })

  it('handles asymmetric game counts', () => {
    // New player (5 games, K=40) vs established (50 games, K=24)
    const result = calculateMatchElo(1200, 1200, 5, 50, false)
    // Winner (new): K=40, change = 40 * 0.5 = 20
    // Loser (established): K=24, change = 24 * -0.5 = -12
    expect(result.winnerChange).toBe(20)
    expect(result.loserChange).toBe(-12)
  })

  it('upset produces asymmetric changes', () => {
    // 1000 rated beats 1600 rated
    const result = calculateMatchElo(1000, 1600, 50, 50, false)
    // Winner gains a lot (low expected score)
    // Loser loses a lot (high expected score)
    expect(result.winnerChange).toBeGreaterThan(10)
    expect(result.loserChange).toBeLessThan(-10)
    // Winner's gain magnitude should be roughly equal to loser's loss magnitude
    // (since both have K=24 and same expected complement)
    expect(Math.abs(result.winnerChange)).toBeCloseTo(Math.abs(result.loserChange), 0)
  })

  it('draw between unequal ratings adjusts toward each other', () => {
    const result = calculateMatchElo(1400, 1000, 50, 50, true)
    // Higher rated draws: gains less (or loses a bit)
    // Lower rated draws: gains more
    // 1400 expected ≈ 0.91, actual 0.5 → change ≈ 24*(0.5-0.91) ≈ -10
    // 1000 expected ≈ 0.09, actual 0.5 → change ≈ 24*(0.5-0.09) ≈ +10
    expect(result.winnerChange).toBeLessThan(0) // Higher rated loses points on draw
    expect(result.loserChange).toBeGreaterThan(0) // Lower rated gains points on draw
  })
})

// ---------------------------------------------------------------------------
// getRatingTier
// ---------------------------------------------------------------------------
describe('getRatingTier', () => {
  it('returns Bronze for 0', () => {
    expect(getRatingTier(0).name).toBe('Bronze')
  })

  it('returns Bronze for 500', () => {
    expect(getRatingTier(500).name).toBe('Bronze')
  })

  it('returns Bronze for 799', () => {
    expect(getRatingTier(799).name).toBe('Bronze')
  })

  it('returns Silver for 800', () => {
    expect(getRatingTier(800).name).toBe('Silver')
  })

  it('returns Silver for 1000', () => {
    expect(getRatingTier(1000).name).toBe('Silver')
  })

  it('returns Gold for 1200', () => {
    expect(getRatingTier(1200).name).toBe('Gold')
  })

  it('returns Gold for DEFAULT_ELO', () => {
    expect(getRatingTier(DEFAULT_ELO).name).toBe('Gold')
  })

  it('returns Platinum for 1600', () => {
    expect(getRatingTier(1600).name).toBe('Platinum')
  })

  it('returns Diamond for 2000', () => {
    expect(getRatingTier(2000).name).toBe('Diamond')
  })

  it('returns Grandmaster for 2400', () => {
    expect(getRatingTier(2400).name).toBe('Grandmaster')
  })

  it('returns Grandmaster for very high ratings', () => {
    expect(getRatingTier(3000).name).toBe('Grandmaster')
    expect(getRatingTier(9999).name).toBe('Grandmaster')
  })

  it('each tier has required properties', () => {
    const tier = getRatingTier(1200)
    expect(tier).toHaveProperty('name')
    expect(tier).toHaveProperty('minElo')
    expect(tier).toHaveProperty('maxElo')
    expect(tier).toHaveProperty('color')
    expect(tier).toHaveProperty('badge')
  })

  it('all tiers are accessible', () => {
    const tierNames = RATING_TIERS.map((t) => t.name)
    expect(tierNames).toContain('Bronze')
    expect(tierNames).toContain('Silver')
    expect(tierNames).toContain('Gold')
    expect(tierNames).toContain('Platinum')
    expect(tierNames).toContain('Diamond')
    expect(tierNames).toContain('Grandmaster')
  })
})

// ---------------------------------------------------------------------------
// getNextTier
// ---------------------------------------------------------------------------
describe('getNextTier', () => {
  it('returns Silver when in Bronze', () => {
    const next = getNextTier(500)
    expect(next).not.toBeNull()
    expect(next!.name).toBe('Silver')
  })

  it('returns Gold when in Silver', () => {
    const next = getNextTier(1000)
    expect(next).not.toBeNull()
    expect(next!.name).toBe('Gold')
  })

  it('returns null when in Grandmaster (highest tier)', () => {
    const next = getNextTier(2500)
    expect(next).toBeNull()
  })

  it('returns null at exactly Grandmaster threshold', () => {
    const next = getNextTier(2400)
    expect(next).toBeNull()
  })

  it('next tier minElo is current tier maxElo + 1', () => {
    // Silver starts at 800, Bronze ends at 799
    const bronze = getRatingTier(500)
    const next = getNextTier(500)
    expect(next!.minElo).toBe(bronze.maxElo + 1)
  })
})

// ---------------------------------------------------------------------------
// getTierProgress
// ---------------------------------------------------------------------------
describe('getTierProgress', () => {
  it('returns 0 at the start of a tier', () => {
    // At exactly 800 (start of Silver)
    const progress = getTierProgress(800)
    expect(progress).toBe(0)
  })

  it('returns 1 for Grandmaster (highest tier)', () => {
    const progress = getTierProgress(2400)
    expect(progress).toBe(1)
  })

  it('returns value between 0 and 1 for mid-tier ratings', () => {
    const progress = getTierProgress(1000)
    // Silver: 800-1199, so 1000 is (1000-800)/(1200-800) = 200/400 = 0.5
    expect(progress).toBeCloseTo(0.5, 2)
  })

  it('returns value near 1 at end of a tier', () => {
    const progress = getTierProgress(1199)
    // Silver: 800-1199, so 1199 is (1199-800)/(1200-800) = 399/400 ≈ 0.9975
    expect(progress).toBeGreaterThan(0.99)
  })

  it('is always between 0 and 1 inclusive', () => {
    for (const elo of [0, 400, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 3000]) {
      const progress = getTierProgress(elo)
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(1)
    }
  })

  it('progress increases as rating increases within a tier', () => {
    const p1 = getTierProgress(800)
    const p2 = getTierProgress(1000)
    const p3 = getTierProgress(1199)
    expect(p1).toBeLessThan(p2)
    expect(p2).toBeLessThan(p3)
  })
})

// ---------------------------------------------------------------------------
// formatRating
// ---------------------------------------------------------------------------
describe('formatRating', () => {
  it('formats default rating correctly', () => {
    expect(formatRating(1200)).toBe('1200 (Gold)')
  })

  it('formats bronze rating correctly', () => {
    expect(formatRating(500)).toBe('500 (Bronze)')
  })

  it('formats grandmaster rating correctly', () => {
    expect(formatRating(2500)).toBe('2500 (Grandmaster)')
  })

  it('includes both number and tier name', () => {
    const formatted = formatRating(1600)
    expect(formatted).toContain('1600')
    expect(formatted).toContain('Platinum')
  })
})

// ---------------------------------------------------------------------------
// shouldCountForElo
// ---------------------------------------------------------------------------
describe('shouldCountForElo', () => {
  it('returns false for games with fewer than 5 moves', () => {
    expect(shouldCountForElo(0)).toBe(false)
    expect(shouldCountForElo(1)).toBe(false)
    expect(shouldCountForElo(4)).toBe(false)
  })

  it('returns true for games with exactly 5 moves', () => {
    expect(shouldCountForElo(5)).toBe(true)
  })

  it('returns true for games with more than 5 moves', () => {
    expect(shouldCountForElo(6)).toBe(true)
    expect(shouldCountForElo(100)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getProvisionalMultiplier
// ---------------------------------------------------------------------------
describe('getProvisionalMultiplier', () => {
  it('returns 2.0 for 0-5 games', () => {
    expect(getProvisionalMultiplier(0)).toBe(2.0)
    expect(getProvisionalMultiplier(3)).toBe(2.0)
    expect(getProvisionalMultiplier(5)).toBe(2.0)
  })

  it('returns 1.5 for 6-10 games', () => {
    expect(getProvisionalMultiplier(6)).toBe(1.5)
    expect(getProvisionalMultiplier(8)).toBe(1.5)
    expect(getProvisionalMultiplier(10)).toBe(1.5)
  })

  it('returns 1.0 for 11+ games', () => {
    expect(getProvisionalMultiplier(11)).toBe(1.0)
    expect(getProvisionalMultiplier(50)).toBe(1.0)
    expect(getProvisionalMultiplier(1000)).toBe(1.0)
  })

  it('multiplier decreases as games played increases', () => {
    expect(getProvisionalMultiplier(3)).toBeGreaterThan(getProvisionalMultiplier(7))
    expect(getProvisionalMultiplier(7)).toBeGreaterThan(getProvisionalMultiplier(15))
  })
})

// ---------------------------------------------------------------------------
// Integration: realistic rating progression
// ---------------------------------------------------------------------------
describe('realistic rating progression', () => {
  it('a player winning against equal opponents converges upward', () => {
    let rating = 1200
    let gamesPlayed = 0

    // Win 20 games against equal-rated opponents
    for (let i = 0; i < 20; i++) {
      const result = calculateRatingChange(rating, 1200, 1, gamesPlayed)
      rating = result.newRating
      gamesPlayed++
    }

    expect(rating).toBeGreaterThan(1200)
    // After 20 wins against equals, should be significantly higher
    expect(rating).toBeGreaterThan(1300)
  })

  it('a player losing against equal opponents converges downward', () => {
    let rating = 1200
    let gamesPlayed = 0

    for (let i = 0; i < 20; i++) {
      const result = calculateRatingChange(rating, 1200, 0, gamesPlayed)
      rating = result.newRating
      gamesPlayed++
    }

    expect(rating).toBeLessThan(1200)
    expect(rating).toBeLessThan(1100)
  })

  it('rating stabilizes after many games with 50% win rate', () => {
    let rating = 1200
    let gamesPlayed = 0

    // Alternate wins and losses against equal opponents
    for (let i = 0; i < 100; i++) {
      const result = calculateRatingChange(rating, 1200, i % 2 === 0 ? 1 : 0, gamesPlayed)
      rating = result.newRating
      gamesPlayed++
    }

    // Should stay close to 1200
    expect(rating).toBeGreaterThan(1150)
    expect(rating).toBeLessThan(1250)
  })

  it('new player rating converges faster due to higher K-factor', () => {
    // New player (K=40) vs established (K=24)
    let newRating = 1200
    let estRating = 1200

    // New player wins 5 games
    for (let i = 0; i < 5; i++) {
      const result = calculateRatingChange(newRating, 1200, 1, i)
      newRating = result.newRating
    }

    // Established player wins 5 games
    for (let i = 0; i < 5; i++) {
      const result = calculateRatingChange(estRating, 1200, 1, 50 + i)
      estRating = result.newRating
    }

    // New player should have gained more per game
    expect(newRating - 1200).toBeGreaterThan(estRating - 1200)
  })

  it('upset win compensates for expected loss', () => {
    // 1000 rated player beats 1600 rated player
    const upsetResult = calculateMatchElo(1000, 1600, 50, 50, false)

    // 1600 rated player beats 1000 rated player
    const expectedResult = calculateMatchElo(1600, 1000, 50, 50, false)

    // Upset winner gains more than expected winner
    expect(upsetResult.winnerChange).toBeGreaterThan(expectedResult.winnerChange)

    // Upset loser loses more than expected loser
    expect(Math.abs(upsetResult.loserChange)).toBeGreaterThan(
      Math.abs(expectedResult.loserChange),
    )
  })
})
