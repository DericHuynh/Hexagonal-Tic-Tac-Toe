// ============================================================================
// Hexagonal Tic-Tac-Toe — Matchmaking Logic
// Pure functions for ELO-based queue matching with expanding search range.
// ============================================================================

import type { QueueEntry } from "./types";
import { ELO_SEARCH_BASE, ELO_SEARCH_30S, ELO_SEARCH_60S } from "./types";

// ---------------------------------------------------------------------------
// ELO Search Range
// ---------------------------------------------------------------------------

/**
 * Get the maximum ELO difference allowed for a match based on how long
 * the player has been waiting in the queue.
 *
 * The search range expands over time to ensure players eventually find a match:
 *   - 0–30s:   ±200 ELO
 *   - 30–60s:  ±300 ELO
 *   - 60–120s: ±500 ELO
 *   - 120s+:   match with anyone (Infinity)
 *
 * @param waitTimeSeconds - How long the player has been waiting
 * @returns Maximum allowed ELO difference
 */
export function getSearchRange(waitTimeSeconds: number): number {
  if (waitTimeSeconds >= 120) return Infinity;
  if (waitTimeSeconds >= 60) return ELO_SEARCH_60S;
  if (waitTimeSeconds >= 30) return ELO_SEARCH_30S;
  return ELO_SEARCH_BASE;
}

// ---------------------------------------------------------------------------
// Match Eligibility
// ---------------------------------------------------------------------------

/**
 * Determine whether two players should be matched based on their ELO
 * difference and how long the searching player has been waiting.
 *
 * @param eloA - ELO of the player already in queue
 * @param eloB - ELO of the player being considered
 * @param waitTimeSeconds - How long player A has been waiting
 * @returns Whether these two players are eligible to match
 */
export function shouldMatch(eloA: number, eloB: number, waitTimeSeconds: number): boolean {
  const maxDiff = getSearchRange(waitTimeSeconds);
  return Math.abs(eloA - eloB) <= maxDiff;
}

/**
 * Check if two queue entries are eligible to match each other.
 * Uses the longer wait time of the two players to determine the search range.
 */
export function canMatch(a: QueueEntry, b: QueueEntry, nowSeconds: number): boolean {
  const waitA = nowSeconds - a.enqueuedAt;
  const waitB = nowSeconds - b.enqueuedAt;
  const maxWait = Math.max(waitA, waitB);
  return shouldMatch(a.elo, b.elo, maxWait);
}

// ---------------------------------------------------------------------------
// Best Match Selection
// ---------------------------------------------------------------------------

/**
 * Find the best match for a player from a sorted queue.
 *
 * Strategy:
 * 1. Filter to only eligible opponents (within ELO range)
 * 2. Sort by ELO distance (closest first)
 * 3. Return the closest match, or null if no eligible opponents
 *
 * @param playerElo - The searching player's ELO
 * @param queue - Array of queue entries to search (should not include the player)
 * @param waitTimeSeconds - How long the player has been waiting
 * @returns The best matching QueueEntry, or null
 */
export function findBestMatch(
  playerElo: number,
  queue: QueueEntry[],
  waitTimeSeconds: number,
): QueueEntry | null {
  if (queue.length === 0) return null;

  const maxDiff = getSearchRange(waitTimeSeconds);

  // Filter to eligible opponents
  const eligible = queue.filter((entry) => {
    if (maxDiff === Infinity) return true;
    return Math.abs(entry.elo - playerElo) <= maxDiff;
  });

  if (eligible.length === 0) return null;

  // Sort by ELO distance (closest match first), then by wait time (longest waiting first)
  eligible.sort((a, b) => {
    const distA = Math.abs(a.elo - playerElo);
    const distB = Math.abs(b.elo - playerElo);
    if (distA !== distB) return distA - distB;
    // Tiebreak: prefer the player who has been waiting longer
    return a.enqueuedAt - b.enqueuedAt;
  });

  return eligible[0];
}

/**
 * Attempt to find matches for all players in the queue.
 *
 * Greedy algorithm: iterate through the queue sorted by wait time (longest
 * first), and for each unmatched player, find the closest eligible opponent.
 *
 * @param queue - All players in the queue (same game mode)
 * @param nowSeconds - Current timestamp in seconds
 * @returns Array of matched pairs [{ playerA, playerB }, ...]
 */
export function findMatches(
  queue: QueueEntry[],
  nowSeconds: number,
): { playerA: QueueEntry; playerB: QueueEntry }[] {
  if (queue.length < 2) return [];

  // Sort by wait time (longest waiting first)
  const sorted = [...queue].sort((a, b) => a.enqueuedAt - b.enqueuedAt);

  const matched = new Set<number>(); // indices of matched players
  const pairs: { playerA: QueueEntry; playerB: QueueEntry }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (matched.has(i)) continue;

    const player = sorted[i];
    const waitTime = nowSeconds - player.enqueuedAt;

    // Find best match among remaining unmatched players
    let bestIndex = -1;
    let bestDiff = Infinity;

    for (let j = i + 1; j < sorted.length; j++) {
      if (matched.has(j)) continue;

      const candidate = sorted[j];
      const diff = Math.abs(player.elo - candidate.elo);

      if (!shouldMatch(player.elo, candidate.elo, waitTime)) continue;

      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = j;
      }
    }

    if (bestIndex !== -1) {
      matched.add(i);
      matched.add(bestIndex);
      pairs.push({
        playerA: player,
        playerB: sorted[bestIndex],
      });
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Queue Utilities
// ---------------------------------------------------------------------------

/**
 * Determine which player should be X (first mover) and which should be O.
 * The lower-rated player gets X (slight advantage for going first),
 * or if equal, the player who joined the queue first.
 */
export function assignRoles(
  playerA: QueueEntry,
  playerB: QueueEntry,
): { playerX: QueueEntry; playerO: QueueEntry } {
  if (playerA.elo < playerB.elo) {
    return { playerX: playerA, playerO: playerB };
  }
  if (playerB.elo < playerA.elo) {
    return { playerX: playerB, playerO: playerA };
  }
  // Equal ELO: whoever joined first gets X
  if (playerA.enqueuedAt <= playerB.enqueuedAt) {
    return { playerX: playerA, playerO: playerB };
  }
  return { playerX: playerB, playerO: playerA };
}

/**
 * Generate a unique game ID for a matched pair.
 * Uses timestamp + random suffix for uniqueness.
 */
export function generateGameId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `game_${timestamp}_${random}`;
}

/**
 * Calculate estimated wait time based on queue position and average match rate.
 *
 * @param queuePosition - Player's position in the queue (0-indexed)
 * @param avgMatchIntervalSeconds - Average time between matches
 * @returns Estimated wait time in seconds
 */
export function estimateWaitTime(
  queuePosition: number,
  avgMatchIntervalSeconds: number = 10,
): number {
  // Each pair of players = one match, so position / 2 matches need to happen
  const matchesAhead = Math.ceil(queuePosition / 2);
  return matchesAhead * avgMatchIntervalSeconds;
}
