// ============================================================================
// Hexagonal Tic-Tac-Toe — Game Core
// Barrel export for the shared game logic package.
// ============================================================================

// Types
export type {
  Player,
  AxialCoord,
  CubeCoord,
  PixelCoord,
  Board,
  CellEntry,
  GameStatus,
  WinReason,
  GameState,
  MoveResult,
  Move,
  TurnState,
  ClientMessage,
  ServerMessage,
  WSMessage,
  RatingTier,
  EloChange,
  PlayerRating,
  QueueEntry,
  QueueStatus,
  QueueResult,
  MatchRecord,
  MatchMoveRecord,
  LessonCategory,
  LessonDifficulty,
  TextSlide,
  BoardSlide,
  InteractiveSlide,
  Slide,
  Puzzle,
  Lesson,
  LessonStatus,
  LessonProgress,
  UserProfile,
  ViewportState,
  RenderState,
} from './types'

export {
  BOARD_RADIUS,
  WIN_LENGTH,
  BOARD_CELL_COUNT,
  HEX_DIRECTIONS,
  RATING_TIERS,
  DEFAULT_ELO,
  ELO_SEARCH_BASE,
  ELO_SEARCH_30S,
  ELO_SEARCH_60S,
} from './types'

// Hex math
export {
  axialToCube,
  cubeToAxial,
  hexDistance,
  isValidCell,
  getNeighbors,
  getValidNeighbors,
  getLine,
  getAxisLine,
  axialToKey,
  keyToAxial,
  forEachCell,
  getAllCells,
  cellCount,
  axialToPixel,
  pixelToAxial,
  hexRound,
  hexCorners,
  oppositeDirection,
  getDirectionIndex,
  getAxisDirections,
  walkDirection,
} from './hex'

// Board state
export {
  createBoard,
  getCell,
  isCellEmpty,
  isCellOccupied,
  setCell,
  removeCell,
  forceSetCell,
  countPieces,
  countPlayerPieces,
  isBoardFull,
  getOccupiedCells,
  getPlayerCells,
  getLastMove,
  boardToArray,
  boardFromArray,
  boardToString,
  boardFromString,
  isValidMove,
  boardToDebugString,
} from './board'

// Win detection
export {
  checkWinFromCell,
  checkAnyWin,
  getWinLines,
  getPotentialLines,
  countOpenLines,
  findWinningMoves,
} from './win-checker'

// Turn management
export {
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
} from './turn-manager'

// ELO rating
export {
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
} from './elo'

// Matchmaking
export {
  getSearchRange,
  shouldMatch,
  canMatch,
  findBestMatch,
  findMatches,
  assignRoles,
  generateGameId,
  estimateWaitTime,
} from './matchmaking'

// Lessons
export {
  validatePuzzleMove,
  validatePuzzleSolution,
  applyPuzzleMove,
  calculatePuzzleScore,
  getStarRating,
  getTotalXp,
  filterByCategory,
  sortLessons,
  getNextLesson,
  DEFAULT_LESSONS,
} from './lessons'
