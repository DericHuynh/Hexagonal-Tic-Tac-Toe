import type { AxialCoord, Board, Player, TurnState } from "../types";
import { WIN_LENGTH } from "../types";
import { checkWinFromCell, isBoardFull } from "../index";
import { placePiece } from "../turn-manager";

// ---------------------------------------------------------------------------
// Types & Enums
// ---------------------------------------------------------------------------

export type AIDifficulty = "easy" | "medium" | "hard" | "master";

export interface AIConfig {
  player: Player;
  depth: number;
  randomness: number;
  timeLimitMs: number;
  winLength: number;
  boardRadius: number;
}

export interface AIEvaluation {
  score: number;
  move: AxialCoord | null;
  nodesEvaluated: number;
}

interface SearchContext {
  killerMoves: AxialCoord[][];
  nodesEvaluated: number;
  startTime: number;
  timeLimit: number;
  abort: boolean;
  // Zobrist hash → TTEntry (using number XOR hash for speed)
  tt: Map<number, TTEntry>;
  // Rolling Zobrist hash of current board state
  zobristHash: number;
}

enum TTFlag {
  EXACT,
  LOWERBOUND,
  UPPERBOUND,
}

interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
  move: AxialCoord | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIN_SCORE = 10_000_000;
const LOSE_SCORE = -WIN_SCORE;
const DRAW_SCORE = 0;
const DEPTH_PENALTY = 100;

// Max candidate moves considered at each node — keeps branching factor tight
const MAX_CANDIDATES = 20;

// The 3 unique hex axes (positive direction for each axis)
// axis 0: q direction  (dir 0 = {1,0},  opposite = {-1,0})
// axis 1: q-r diagonal (dir 1 = {1,-1}, opposite = {-1,1})
// axis 2: r direction  (dir 2 = {0,-1}, opposite = {0,1})
const AXIS_DIRS: [AxialCoord, AxialCoord][] = [
  [{ q: 1, r: 0 },  { q: -1, r: 0 }],
  [{ q: 1, r: -1 }, { q: -1, r: 1 }],
  [{ q: 0, r: -1 }, { q: 0, r: 1 }],
];

// All 6 hex directions for neighbor scanning
const HEX_DIRS: AxialCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

// ---------------------------------------------------------------------------
// Zobrist Hashing
// ---------------------------------------------------------------------------
// Pre-generate a seeded pseudo-random table so hashes are deterministic.
// We hash based on (q, r, player) triples. Since the board is conceptually
// unbounded, we use a simple polynomial: hash(q, r, player) = xorshift(seed)
// where seed derives from (q, r, player). Collisions are rare enough to be fine.

function zobristKey(q: number, r: number, player: Player): number {
  // A fast bijective integer hash. We encode q and r into a single integer,
  // then mix with a player-specific multiplier. Result is a 32-bit-range integer.
  const p = player === "X" ? 1 : 2;
  // Cantor-like pairing shifted to handle negatives (offset by 1000)
  const qo = q + 1000;
  const ro = r + 1000;
  const coord = ((qo + ro) * (qo + ro + 1)) / 2 + ro; // Cantor pairing
  // xorshift32 mix
  let h = (coord * 0x9e3779b9 + p * 0x6c62272e) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b) >>> 0;
  h ^= h >>> 16;
  return h;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAIConfig(difficulty: AIDifficulty, aiPlayer: Player): AIConfig {
  const configs: Record<AIDifficulty, Partial<AIConfig>> = {
    easy:   { depth: 1, randomness: 0.35, timeLimitMs: 500 },
    medium: { depth: 3, randomness: 0.05, timeLimitMs: 1500 },
    hard:   { depth: 5, randomness: 0.0,  timeLimitMs: 3000 },
    master: { depth: 6, randomness: 0.0,  timeLimitMs: 8000 },
  };

  const cfg = configs[difficulty];
  return {
    player: aiPlayer,
    depth: cfg.depth ?? 5,
    randomness: cfg.randomness ?? 0,
    timeLimitMs: cfg.timeLimitMs ?? 3000,
    winLength: WIN_LENGTH,
    boardRadius: Infinity,
  };
}

export function findBestMove(board: Board, turnState: TurnState, config: AIConfig): AIEvaluation {
  if (turnState.currentTurn !== config.player) {
    console.warn(
      `AI (${config.player}) was asked to play during ${turnState.currentTurn}'s turn. Aborting.`,
    );
    return { score: 0, move: null, nodesEvaluated: 0 };
  }

  const legalMoves = getCandidateMoves(board, config);

  if (legalMoves.length === 0) {
    return { score: 0, move: null, nodesEvaluated: 0 };
  }

  if (legalMoves.length === 1) {
    return {
      score: evaluateBoard(board, config.player, config),
      move: legalMoves[0],
      nodesEvaluated: 1,
    };
  }

  // Easy/medium: occasionally play a random top-N move
  if (config.randomness > 0 && Math.random() < config.randomness) {
    const topN = Math.min(5, legalMoves.length);
    const randomIdx = Math.floor(Math.random() * topN);
    return { score: 0, move: legalMoves[randomIdx], nodesEvaluated: 0 };
  }

  // Build initial Zobrist hash for the current board
  let initialHash = 0;
  for (const [key, player] of board) {
    const parts = key.split(",");
    initialHash ^= zobristKey(parseInt(parts[0], 10), parseInt(parts[1], 10), player);
  }
  // Mix in turn state
  initialHash ^= turnState.currentTurn === "X" ? 0x1a2b3c4d : 0x5e6f7a8b;

  const ctx: SearchContext = {
    tt: new Map(),
    killerMoves: Array.from({ length: config.depth + 16 }, () => []),
    nodesEvaluated: 0,
    startTime: Date.now(),
    timeLimit: config.timeLimitMs,
    abort: false,
    zobristHash: initialHash,
  };

  // Compute a fallback move using pure heuristic ordering before deep search
  const fallbackMove = legalMoves[0];

  let bestScore = -Infinity;
  let bestMove: AxialCoord | null = fallbackMove;

  // Iterative deepening
  for (let currentDepth = 1; currentDepth <= config.depth; currentDepth++) {
    const { score, move } = alphaBeta(
      board,
      turnState,
      currentDepth,
      -Infinity,
      Infinity,
      config.player,
      null,
      0,
      ctx,
      config,
    );

    if (ctx.abort) break;

    bestScore = score;
    if (move) bestMove = move;

    // Found a winning line — no need to search deeper
    if (bestScore >= WIN_SCORE / 2) break;

    if (Date.now() - ctx.startTime >= ctx.timeLimit) break;
  }

  return {
    score: bestScore,
    move: bestMove,
    nodesEvaluated: ctx.nodesEvaluated,
  };
}

// ---------------------------------------------------------------------------
// Alpha-Beta Core
// ---------------------------------------------------------------------------

function alphaBeta(
  board: Board,
  turnState: TurnState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
  lastMove: AxialCoord | null,
  ply: number,
  ctx: SearchContext,
  config: AIConfig,
): { score: number; move: AxialCoord | null } {
  ctx.nodesEvaluated++;

  // Periodic time check (every 512 nodes)
  if ((ctx.nodesEvaluated & 511) === 0) {
    if (Date.now() - ctx.startTime >= ctx.timeLimit) {
      ctx.abort = true;
    }
  }

  if (ctx.abort) return { score: 0, move: null };

  // --- Terminal: win check ---
  // Only check the cell that was just placed (fast path).
  // At root (lastMove=null) there's no prior move to check.
  if (lastMove) {
    const player = board.get(`${lastMove.q},${lastMove.r}`);
    if (player) {
      const winLine = checkWinFromCell(board, lastMove, player, config.winLength, config.boardRadius);
      if (winLine) {
        const score = player === aiPlayer
          ? WIN_SCORE - ply * DEPTH_PENALTY
          : LOSE_SCORE + ply * DEPTH_PENALTY;
        return { score, move: null };
      }
    }
  }

  // --- Terminal: draw ---
  if (isBoardFull(board, config.boardRadius)) return { score: DRAW_SCORE, move: null };

  // --- Leaf node: static evaluation ---
  if (depth === 0) return { score: evaluateBoard(board, aiPlayer, config), move: null };

  // --- Transposition table lookup ---
  const hash = ctx.zobristHash;
  const ttEntry = ctx.tt.get(hash);
  const originalAlpha = alpha;

  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === TTFlag.EXACT)      return { score: ttEntry.score, move: ttEntry.move };
    if (ttEntry.flag === TTFlag.LOWERBOUND) alpha = Math.max(alpha, ttEntry.score);
    if (ttEntry.flag === TTFlag.UPPERBOUND) beta  = Math.min(beta,  ttEntry.score);
    if (alpha >= beta) return { score: ttEntry.score, move: ttEntry.move };
  }

  // --- Generate and order moves ---
  const currentPlayer = turnState.currentTurn;
  const isMaximizing = currentPlayer === aiPlayer;
  const candidates = getCandidateMoves(board, config);

  if (candidates.length === 0) return { score: evaluateBoard(board, aiPlayer, config), move: null };

  // Inject TT move and killer moves at the front of the already-scored list
  const ttMove = ttEntry?.move ?? null;
  const plyKillers = ctx.killerMoves[ply] ?? [];
  const orderedMoves = injectPriorityMoves(candidates, ttMove, plyKillers);

  let bestMove: AxialCoord | null = orderedMoves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of orderedMoves) {
    const key = `${move.q},${move.r}`;
    const zk = zobristKey(move.q, move.r, currentPlayer);

    // Make move (mutate + restore to avoid Map copy overhead at every node)
    board.set(key, currentPlayer);
    ctx.zobristHash ^= zk;

    const newTurnState = placePiece(turnState);
    // Mix turn state change into hash
    const turnXor = newTurnState.currentTurn === "X" ? 0x1a2b3c4d : 0x5e6f7a8b;
    const oldTurnXor = turnState.currentTurn === "X" ? 0x1a2b3c4d : 0x5e6f7a8b;
    ctx.zobristHash ^= oldTurnXor ^ turnXor;

    const { score } = alphaBeta(
      board,
      newTurnState,
      depth - 1,
      alpha,
      beta,
      aiPlayer,
      move,
      ply + 1,
      ctx,
      config,
    );

    // Undo move
    board.delete(key);
    ctx.zobristHash ^= zk ^ turnXor ^ oldTurnXor;

    if (ctx.abort) return { score: 0, move: null };

    if (isMaximizing) {
      if (score > bestScore) { bestScore = score; bestMove = move; }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) { bestScore = score; bestMove = move; }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      // Store killer move (non-capturing cutoff)
      const killers = ctx.killerMoves[ply] ?? (ctx.killerMoves[ply] = []);
      if (!killers.some((k) => k.q === move.q && k.r === move.r)) {
        killers.unshift(move);
        if (killers.length > 2) killers.pop();
      }
      break;
    }
  }

  // --- Store in transposition table ---
  let flag = TTFlag.EXACT;
  if (bestScore <= originalAlpha) flag = TTFlag.UPPERBOUND;
  else if (bestScore >= beta)     flag = TTFlag.LOWERBOUND;

  ctx.tt.set(hash, { depth, score: bestScore, flag, move: bestMove });

  return { score: bestScore, move: bestMove };
}

// ---------------------------------------------------------------------------
// Move Generation
// ---------------------------------------------------------------------------

/**
 * Generate and rank candidate moves. Crucially:
 * 1. Only consider cells within distance 1 of any occupied cell (tight),
 *    PLUS cells that extend existing lines up to distance 2 (for gap threats).
 * 2. Score each candidate by strategic value (immediate wins, threats,
 *    open preemptives, blocking) and keep only the top MAX_CANDIDATES.
 *
 * This keeps branching factor low while never missing tactically critical moves.
 */
function getCandidateMoves(board: Board, config: AIConfig): AxialCoord[] {
  if (board.size === 0) return [{ q: 0, r: 0 }];

  const aiPlayer = config.player;
  const opponent: Player = aiPlayer === "X" ? "O" : "X";
  const wl = config.winLength;

  // Collect unique empty neighbors within distance 1,
  // plus axis-extension cells up to distance 2 along lines with pieces.
  const candidateSet = new Set<string>();
  const occupied: AxialCoord[] = [];

  for (const [key] of board) {
    const parts = key.split(",");
    const cell: AxialCoord = { q: parseInt(parts[0], 10), r: parseInt(parts[1], 10) };
    occupied.push(cell);

    // Distance-1 neighbors (always included)
    for (const dir of HEX_DIRS) {
      const nq = cell.q + dir.q;
      const nr = cell.r + dir.r;
      const nk = `${nq},${nr}`;
      if (!board.has(nk)) candidateSet.add(nk);
    }

    // Distance-2 only along axes that already have a same-colored piece
    // (extends lines, catches X_X gap threats)
    const cellPlayer = board.get(key)!;
    for (const [pos, neg] of AXIS_DIRS) {
      for (const dir of [pos, neg]) {
        // Step 2 cells along this axis
        const d2q = cell.q + dir.q * 2;
        const d2r = cell.r + dir.r * 2;
        const d2k = `${d2q},${d2r}`;
        if (!board.has(d2k)) {
          // Only include if there's a same-player piece in the first step
          // (so we're extending a real line, not just wandering)
          const d1k = `${cell.q + dir.q},${cell.r + dir.r}`;
          if (board.get(d1k) === cellPlayer || !board.has(d1k)) {
            candidateSet.add(d2k);
          }
        }
      }
    }
  }

  // Score each candidate
  const scored: { move: AxialCoord; score: number }[] = [];

  for (const key of candidateSet) {
    const parts = key.split(",");
    const move: AxialCoord = { q: parseInt(parts[0], 10), r: parseInt(parts[1], 10) };
    const score = scoreMoveHeuristic(board, move, aiPlayer, opponent, wl, config.boardRadius);
    scored.push({ move, score });
  }

  // Sort descending and keep top MAX_CANDIDATES
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_CANDIDATES);
  return top.map((s) => s.move);
}

/**
 * Score a candidate move without creating any Map copies.
 * Uses fast pattern-counting along each axis.
 *
 * Priority (descending):
 *   1. Immediate win for AI             → 10,000,000
 *   2. Block opponent immediate win     →  9,000,000
 *   3. Creates open-4 (double threat)   →    500,000
 *   4. Blocks opponent open-4           →    400,000
 *   5. Creates half-open-4              →     50,000
 *   6. Blocks opponent half-open-4      →     40,000
 *   7. Creates open-3                   →      5,000
 *   8. Blocks opponent open-3           →      4,000
 *   9. Creates half-open-3              →        300
 *  10. Blocks opponent half-open-3      →        200
 *  11. Creates open-2                   →         30
 *  12. Neighbor bonus (piece proximity) →        1-4
 */
function scoreMoveHeuristic(
  board: Board,
  move: AxialCoord,
  aiPlayer: Player,
  opponent: Player,
  winLength: number,
  _boardRadius: number,
): number {
  let score = 0;

  // 1 & 2: Check immediate wins / blocks (most important)
  const aiThreat   = countInLine(board, move, aiPlayer,  opponent, winLength);
  const oppThreat  = countInLine(board, move, opponent,  aiPlayer,  winLength);

  if (aiThreat.maxConsecutive + 1 >= winLength)  return 10_000_000; // AI wins
  if (oppThreat.maxConsecutive + 1 >= winLength) return  9_000_000; // Block opp win

  // Accumulate strategic value for AI and for blocking opponent
  score += evaluatePlacement(aiThreat,  aiPlayer,  winLength, 1.0);
  score += evaluatePlacement(oppThreat, opponent,  winLength, 1.2); // Defensive bias

  // Small bonus for central proximity (encourage center play early)
  const centerDist = Math.max(Math.abs(move.q), Math.abs(move.r), Math.abs(move.q + move.r));
  score += Math.max(0, 5 - centerDist);

  // Neighbor adjacency bonus (prefer moves near existing pieces)
  for (const dir of HEX_DIRS) {
    const nk = `${move.q + dir.q},${move.r + dir.r}`;
    const np = board.get(nk);
    if (np === aiPlayer)  score += 4;
    else if (np === opponent) score += 2;
  }

  return score;
}

/**
 * Threat analysis for placing `forPlayer` at `move`.
 * Returns per-axis counts and open-end information, aggregated across all 3 axes.
 */
interface ThreatInfo {
  open4: number;       // fully open 4-in-a-row (both ends free)
  halfOpen4: number;   // one end blocked 4-in-a-row
  open3: number;
  halfOpen3: number;
  open2: number;
  halfOpen2: number;
  maxConsecutive: number; // longest consecutive run including this move
}

function countInLine(
  board: Board,
  move: AxialCoord,
  forPlayer: Player,
  against: Player,
  winLength: number,
): ThreatInfo {
  const result: ThreatInfo = {
    open4: 0, halfOpen4: 0,
    open3: 0, halfOpen3: 0,
    open2: 0, halfOpen2: 0,
    maxConsecutive: 0,
  };

  for (const [pos, neg] of AXIS_DIRS) {
    // Walk positive direction counting consecutive forPlayer pieces
    let posCount = 0;
    let posOpen = false;
    for (let step = 1; step < winLength; step++) {
      const sq = move.q + pos.q * step;
      const sr = move.r + pos.r * step;
      const sp = board.get(`${sq},${sr}`);
      if (sp === forPlayer) { posCount++; }
      else {
        posOpen = sp === undefined; // open if empty, closed if opponent
        break;
      }
      if (step === winLength - 1) posOpen = true; // walked full length without hitting wall
    }

    // Walk negative direction
    let negCount = 0;
    let negOpen = false;
    for (let step = 1; step < winLength; step++) {
      const sq = move.q + neg.q * step;
      const sr = move.r + neg.r * step;
      const sp = board.get(`${sq},${sr}`);
      if (sp === forPlayer) { negCount++; }
      else {
        negOpen = sp === undefined;
        break;
      }
      if (step === winLength - 1) negOpen = true;
    }

    const total = posCount + 1 + negCount; // including the move itself
    const openEnds = (posOpen ? 1 : 0) + (negOpen ? 1 : 0);

    if (total > result.maxConsecutive) result.maxConsecutive = total;

    // Categorise by length and openness
    // A pattern is only useful if it can possibly extend to winLength
    const canWin = total + (posOpen ? winLength - total : 0) + (negOpen ? winLength - total : 0) >= winLength;
    if (!canWin && openEnds === 0) continue; // completely dead line

    if (total >= winLength - 2) { // 4-in-a-row (for winLength=6, that's ≥4)
      if (openEnds === 2) result.open4++;
      else if (openEnds === 1) result.halfOpen4++;
    } else if (total >= winLength - 3) { // 3-in-a-row
      if (openEnds === 2) result.open3++;
      else if (openEnds === 1) result.halfOpen3++;
    } else if (total >= 2) { // 2-in-a-row
      if (openEnds === 2) result.open2++;
      else if (openEnds === 1) result.halfOpen2++;
    }
  }

  return result;
}

/**
 * Convert a ThreatInfo into a score contribution.
 * `weight` > 1 makes this defensive (opponent blocking is more important).
 */
function evaluatePlacement(info: ThreatInfo, _player: Player, _winLength: number, weight: number): number {
  let s = 0;
  s += info.open4    * 500_000;
  s += info.halfOpen4 * 50_000;
  s += info.open3    *   5_000;
  s += info.halfOpen3 *    300;
  s += info.open2    *     30;
  s += info.halfOpen2 *      8;
  return s * weight;
}

// ---------------------------------------------------------------------------
// Static Board Evaluation
// ---------------------------------------------------------------------------

/**
 * Full board heuristic for leaf nodes.
 * Scans every occupied cell along all 3 axes, scoring open-ended windows.
 * Only evaluates windows that are:
 *  (a) not blocked by opponent on BOTH ends (dead lines skipped)
 *  (b) anchored to the leftmost cell of a window (avoids double-counting)
 */
function evaluateBoard(board: Board, aiPlayer: Player, config: AIConfig): number {
  const opponent: Player = aiPlayer === "X" ? "O" : "X";
  const wl = config.winLength;

  let aiScore = 0;
  let oppScore = 0;

  // Scan each occupied cell as a potential left-anchor of a window
  for (const [key, p] of board) {
    const parts = key.split(",");
    const q = parseInt(parts[0], 10);
    const r = parseInt(parts[1], 10);

    for (const [pos] of AXIS_DIRS) {
      // Only anchor at leftmost: if the cell one step back is the same player, skip
      // (that cell will already anchor this window or a longer one)
      const backKey = `${q - pos.q},${r - pos.r}`;
      if (board.get(backKey) === p) continue;

      // Count run length and determine end openness
      let runLen = 0;
      for (let i = 0; i < wl; i++) {
        const ck = `${q + pos.q * i},${r + pos.r * i}`;
        if (board.get(ck) !== p) break;
        runLen++;
      }

      // Check open end ahead
      const aheadKey = `${q + pos.q * runLen},${r + pos.r * runLen}`;
      const aheadCell = board.get(aheadKey);
      const frontOpen = aheadCell === undefined; // empty = open
      const frontBlocked = aheadCell !== undefined; // any piece = blocked (opponent or own overrun)

      // Check open end behind
      const behindKey = `${q - pos.q},${r - pos.r}`;
      const behindCell = board.get(behindKey);
      const backOpen = behindCell === undefined;

      const openEnds = (frontOpen ? 1 : 0) + (backOpen ? 1 : 0);
      if (openEnds === 0) continue; // Completely closed — worthless

      const lineScore = scoreRunForEval(runLen, openEnds, wl);

      if (p === aiPlayer) aiScore += lineScore;
      else                oppScore += lineScore;
    }
  }

  // Defensive bias: blocking is slightly more important than building
  return aiScore - oppScore * 1.3;
}

/**
 * Convert (runLength, openEnds) into a heuristic score.
 * Values are tuned for winLength=6:
 *  - Open-4 is extremely dangerous (double threat can't be blocked in one move)
 *  - Half-open-4 is a real threat needing a response
 *  - Open-3 is a preemptive to watch and cultivate
 *  - Half-open-3 has potential but isn't urgent
 *  - Closed lines score 0 (dead)
 */
function scoreRunForEval(runLen: number, openEnds: number, winLength: number): number {
  const need = winLength - runLen; // how many more cells needed

  if (need <= 0) return WIN_SCORE; // shouldn't happen at leaf (win check runs first)

  if (need === 1) {
    // One more needed — near-win
    return openEnds === 2 ? 200_000 : openEnds === 1 ? 50_000 : 0;
  }
  if (need === 2) {
    return openEnds === 2 ? 5_000 : openEnds === 1 ? 500 : 0;
  }
  if (need === 3) {
    return openEnds === 2 ? 200 : openEnds === 1 ? 20 : 0;
  }
  if (need === 4) {
    return openEnds === 2 ? 15 : openEnds === 1 ? 3 : 0;
  }
  return openEnds === 2 ? 2 : 0;
}

// ---------------------------------------------------------------------------
// Move Ordering Helpers
// ---------------------------------------------------------------------------

/**
 * Re-inject TT move and killer moves at front of the already-sorted
 * candidates list without disturbing the relative order of the rest.
 * This preserves heuristic ordering while still prioritising TT/killers.
 */
function injectPriorityMoves(
  ordered: AxialCoord[],
  ttMove: AxialCoord | null,
  killers: AxialCoord[],
): AxialCoord[] {
  const result: AxialCoord[] = [];
  const injected = new Set<string>();

  const tryInject = (m: AxialCoord | null) => {
    if (!m) return;
    const k = `${m.q},${m.r}`;
    if (injected.has(k)) return;
    // Only inject if this move is actually in our candidate set
    if (ordered.some((o) => o.q === m.q && o.r === m.r)) {
      result.push(m);
      injected.add(k);
    }
  };

  tryInject(ttMove);
  for (const k of killers) tryInject(k);

  for (const m of ordered) {
    const k = `${m.q},${m.r}`;
    if (!injected.has(k)) result.push(m);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
