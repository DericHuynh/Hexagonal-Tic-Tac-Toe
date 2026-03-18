// ============================================================================
// Hexagonal Tic-Tac-Toe — ELO Rating System
// Pure functions for calculating ELO ratings, K-factors, and rating tiers.
// ============================================================================

import type { EloChange, RatingTier } from "./types";
import { RATING_TIERS, DEFAULT_ELO } from "./types";

// ---------------------------------------------------------------------------
// K-Factor Tiers
// ---------------------------------------------------------------------------

/**
 * Get the K-factor based on how many games a player has played.
 *
 * K-factor determines how much a rating can change per game:
 * - New players (0-10 games): K=40 — converge quickly to true rating
 * - Settling players (11-30 games): K=32 — still adjusting
 * - Established players (31+ games): K=24 — slow, stable changes
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed <= 10) return 40;
  if (gamesPlayed <= 30) return 32;
  return 24;
}

// ---------------------------------------------------------------------------
// Expected Score
// ---------------------------------------------------------------------------

/**
 * Calculate the expected score (probability of winning) for player A
 * against player B using the standard ELO formula.
 *
 * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 *
 * Returns a value between 0 and 1.
 * - 0.5 when ratings are equal
 * - > 0.5 when player A is higher rated
 * - < 0.5 when player B is higher rated
 */
export function calculateExpectedScore(
  ratingA: number,
  ratingB: number,
): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// ---------------------------------------------------------------------------
// Rating Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate a new rating given the current rating, expected score, actual
 * result, and K-factor.
 *
 * R'_A = R_A + K × (S_A - E_A)
 *
 * @param currentRating - Player's current ELO rating
 * @param expectedScore - Expected score from calculateExpectedScore (0-1)
 * @param actualScore - Actual result: 1 = win, 0.5 = draw, 0 = loss
 * @param kFactor - K-factor from getKFactor
 * @returns The new rating (floored at 0)
 */
export function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number,
  kFactor: number,
): number {
  const newRating = currentRating + kFactor * (actualScore - expectedScore);
  return Math.max(0, Math.round(newRating));
}

// ---------------------------------------------------------------------------
// Full Rating Change
// ---------------------------------------------------------------------------

/**
 * Calculate the complete rating change for a match between two players.
 *
 * @param playerElo - Current ELO of the player
 * @param opponentElo - Current ELO of the opponent
 * @param result - 1 = player wins, 0.5 = draw, 0 = player loses
 * @param gamesPlayed - Total games played by the player (before this match)
 * @returns Object with newRating and the change amount
 */
export function calculateRatingChange(
  playerElo: number,
  opponentElo: number,
  result: 0 | 0.5 | 1,
  gamesPlayed: number,
): { newRating: number; change: number } {
  const kFactor = getKFactor(gamesPlayed);
  const expected = calculateExpectedScore(playerElo, opponentElo);
  const newRating = calculateNewRating(playerElo, expected, result, kFactor);
  return {
    newRating,
    change: newRating - playerElo,
  };
}

/**
 * Calculate ELO changes for both players after a match.
 *
 * @param winnerElo - Winner's current ELO
 * @param loserElo - Loser's current ELO
 * @param winnerGames - Winner's total games played before this match
 * @param loserGames - Loser's total games played before this match
 * @param isDraw - Whether the match was a draw
 * @returns EloChange with both players' new ratings and changes
 */
export function calculateMatchElo(
  winnerElo: number,
  loserElo: number,
  winnerGames: number,
  loserGames: number,
  isDraw: boolean = false,
): EloChange {
  if (isDraw) {
    // Both players get 0.5
    const winnerResult = calculateRatingChange(
      winnerElo,
      loserElo,
      0.5,
      winnerGames,
    );
    const loserResult = calculateRatingChange(
      loserElo,
      winnerElo,
      0.5,
      loserGames,
    );
    return {
      winnerChange: winnerResult.change,
      loserChange: loserResult.change,
      winnerNewElo: winnerResult.newRating,
      loserNewElo: loserResult.newRating,
    };
  }

  const winnerResult = calculateRatingChange(
    winnerElo,
    loserElo,
    1,
    winnerGames,
  );
  const loserResult = calculateRatingChange(loserElo, winnerElo, 0, loserGames);

  return {
    winnerChange: winnerResult.change,
    loserChange: loserResult.change,
    winnerNewElo: winnerResult.newRating,
    loserNewElo: loserResult.newRating,
  };
}

// ---------------------------------------------------------------------------
// Rating Tiers
// ---------------------------------------------------------------------------

/**
 * Get the rating tier for a given ELO value.
 * Returns the tier object with name, color, badge, and range.
 */
export function getRatingTier(elo: number): RatingTier {
  for (let i = RATING_TIERS.length - 1; i >= 0; i--) {
    if (elo >= RATING_TIERS[i].minElo) {
      return RATING_TIERS[i];
    }
  }
  return RATING_TIERS[0]; // Fallback to Bronze
}

/**
 * Get the next rating tier above the current one, or null if already at max.
 */
export function getNextTier(elo: number): RatingTier | null {
  const currentTier = getRatingTier(elo);
  const currentIndex = RATING_TIERS.findIndex(
    (t) => t.name === currentTier.name,
  );
  if (currentIndex < RATING_TIERS.length - 1) {
    return RATING_TIERS[currentIndex + 1];
  }
  return null;
}

/**
 * Get progress toward the next tier as a value between 0 and 1.
 * Returns 1 if already at the highest tier.
 */
export function getTierProgress(elo: number): number {
  const currentTier = getRatingTier(elo);
  const nextTier = getNextTier(elo);

  if (!nextTier) return 1;

  const rangeStart = currentTier.minElo;
  const rangeEnd = nextTier.minElo;
  const progress = (elo - rangeStart) / (rangeEnd - rangeStart);

  return Math.max(0, Math.min(1, progress));
}

/**
 * Get a display string for a rating, e.g. "1247 (Gold)"
 */
export function formatRating(elo: number): string {
  const tier = getRatingTier(elo);
  return `${elo} (${tier.name})`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check if a resignation should count for ELO.
 * Requires at least 5 moves to prevent instant-quit farming.
 *
 * @param moveCount - Total moves placed in the game
 * @returns Whether the game should count for ELO
 */
export function shouldCountForElo(moveCount: number): boolean {
  return moveCount >= 5;
}

/**
 * Calculate a provisional rating adjustment for new players.
 * New players' ratings fluctuate more to converge faster.
 *
 * @param gamesPlayed - Number of games played
 * @returns Multiplier for rating changes (1.0 = normal, higher = more volatile)
 */
export function getProvisionalMultiplier(gamesPlayed: number): number {
  if (gamesPlayed <= 5) return 2.0;
  if (gamesPlayed <= 10) return 1.5;
  return 1.0;
}
