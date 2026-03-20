// ============================================================================
// Hexagonal Tic-Tac-Toe — Core Types
// ============================================================================

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Player marker */
export type Player = "X" | "O";

/** Axial hex coordinate */
export interface AxialCoord {
  q: number;
  r: number;
}

/** Cube hex coordinate (s = -q - r) */
export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

/** Pixel position on canvas */
export interface PixelCoord {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

/** Sparse board — Map key is "q,r", value is Player */
export type Board = Map<string, Player>;

/** A single occupied cell with its coordinate */
export interface CellEntry {
  coord: AxialCoord;
  player: Player;
}

// ---------------------------------------------------------------------------
// Game State
// ---------------------------------------------------------------------------

export type GameStatus = "waiting" | "active" | "finished" | "abandoned";

export type WinReason = "six_in_row" | "resignation" | "timeout" | "draw";

/** Full game state transmitted via WebSocket */
export interface GameState {
  gameId: string;
  status: GameStatus;
  boardRadius: number;
  board: Board;
  playerXId: string | null;
  playerOId: string | null;
  currentTurn: Player;
  piecesPlacedThisTurn: number;
  moveCount: number;
  winner: Player | null;
  winReason: WinReason | null;
  winLine: AxialCoord[] | null;
  startedAt: number | null;
  updatedAt: number;
}

/** Result of a move attempt */
export interface MoveResult {
  success: boolean;
  gameState: GameState;
  error?: string;
}

/** A single recorded move */
export interface Move {
  index: number;
  player: Player;
  q: number;
  r: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Turn Management
// ---------------------------------------------------------------------------

export interface TurnState {
  currentTurn: Player;
  piecesPlacedThisTurn: number;
  moveCount: number;
  isFirstTurn: boolean;
}

// ---------------------------------------------------------------------------
// WebSocket Messages — Client → Server
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: "place"; q: number; r: number }
  | { type: "resign" }
  | { type: "draw_offer" }
  | { type: "draw_response"; accept: boolean }
  | { type: "ping" };

// ---------------------------------------------------------------------------
// WebSocket Messages — Server → Client
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: "sync"; state: GameState }
  | { type: "move"; q: number; r: number; player: Player; moveIndex: number; state: GameState }
  | { type: "turn_change"; currentTurn: Player; piecesRemaining: number }
  | {
      type: "game_over";
      winner: Player | null;
      reason: WinReason;
      state: GameState;
      eloChange?: EloChange;
    }
  | { type: "error"; message: string }
  | { type: "opponent_status"; connected: boolean }
  | { type: "draw_offered" }
  | { type: "draw_declined" }
  | { type: "pong" };

export type WSMessage = ClientMessage | ServerMessage;

// ---------------------------------------------------------------------------
// ELO & Rating
// ---------------------------------------------------------------------------

export interface RatingTier {
  name: string;
  minElo: number;
  maxElo: number;
  color: string;
  badge: string;
}

export interface EloChange {
  winnerChange: number;
  loserChange: number;
  winnerNewElo: number;
  loserNewElo: number;
}

export interface PlayerRating {
  userId: string;
  gameMode: string;
  elo: number;
  peakElo: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
}

// ---------------------------------------------------------------------------
// Matchmaking
// ---------------------------------------------------------------------------

export interface QueueEntry {
  userId: string;
  elo: number;
  gameMode: string;
  enqueuedAt: number;
}

export type QueueStatus = "waiting" | "matched";

export interface QueueResult {
  status: QueueStatus;
  gameId?: string;
}

// ---------------------------------------------------------------------------
// Match History
// ---------------------------------------------------------------------------

export interface MatchRecord {
  id: string;
  playerXId: string;
  playerOId: string;
  winnerId: string | null;
  winReason: WinReason | null;
  moveCount: number;
  durationSec: number;
  boardRadius: number;
  eloXBefore: number;
  eloOBefore: number;
  eloXAfter: number;
  eloOAfter: number;
  startedAt: number;
  endedAt: number;
  finalBoard: string | null;
}

export interface MatchMoveRecord {
  matchId: string;
  moveIndex: number;
  playerId: string;
  q: number;
  r: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export type LessonCategory = "basics" | "tactics" | "strategy" | "endgame" | "puzzles";

export type LessonDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TextSlide {
  type: "text";
  content: string;
}

export interface BoardSlide {
  type: "board";
  cells: { q: number; r: number; player: Player }[];
  highlight?: AxialCoord[];
  annotation?: string;
}

export interface InteractiveSlide {
  type: "interactive";
  cells: { q: number; r: number; player: Player }[];
  prompt: string;
  expectedMove: AxialCoord;
}

export type Slide = TextSlide | BoardSlide | InteractiveSlide;

export interface Puzzle {
  cells: { q: number; r: number; player: Player }[];
  playerToMove: Player;
  solution: AxialCoord[];
  hints: string[];
  timeLimit?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  orderIndex: number;
  slides: Slide[];
  puzzle: Puzzle | null;
  xpReward: number;
}

export type LessonStatus = "not_started" | "in_progress" | "completed";

export interface LessonProgress {
  userId: string;
  lessonId: string;
  status: LessonStatus;
  score: number | null;
  attempts: number;
  completedAt: number | null;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: number;
  rating: PlayerRating | null;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export interface ViewportState {
  centerX: number;
  centerY: number;
  zoom: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartCenterX: number;
  dragStartCenterY: number;
}

export interface RenderState {
  cells: Board;
  viewport: ViewportState;
  hoverCell: AxialCoord | null;
  lastMove: AxialCoord | null;
  winLine: AxialCoord[] | null;
  currentPlayer: Player;
  piecesRemaining: number;
  boardRadius: number;
  isMyTurn: boolean;
  gameStatus: GameStatus;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BOARD_RADIUS = 20;
export const WIN_LENGTH = 6;
export const BOARD_CELL_COUNT = 3 * BOARD_RADIUS * (BOARD_RADIUS + 1) + 1; // 1261

export const HEX_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const RATING_TIERS: RatingTier[] = [
  { name: "Bronze", minElo: 0, maxElo: 799, color: "#CD7F32", badge: "🟫" },
  { name: "Silver", minElo: 800, maxElo: 1199, color: "#C0C0C0", badge: "⬜" },
  { name: "Gold", minElo: 1200, maxElo: 1599, color: "#FFD700", badge: "🟨" },
  { name: "Platinum", minElo: 1600, maxElo: 1999, color: "#E5E4E2", badge: "🩶" },
  { name: "Diamond", minElo: 2000, maxElo: 2399, color: "#B9F2FF", badge: "💎" },
  { name: "Grandmaster", minElo: 2400, maxElo: Infinity, color: "#FFD700", badge: "👑" },
];

export const DEFAULT_ELO = 1200;
export const ELO_SEARCH_BASE = 200;
export const ELO_SEARCH_30S = 300;
export const ELO_SEARCH_60S = 500;
