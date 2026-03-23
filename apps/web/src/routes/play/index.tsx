import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HexCanvas } from "../../components/HexCanvas";
import { GameHUD } from "../../components/GameHUD";
import type { AxialCoord, GameState, Player, TurnState, Board } from "@hex/game-core";
import {
  type AIConfig,
  type AIEvaluation,
  getAIConfig,
  findBestMove,
  createBoard,
  setCell,
  checkWinFromCell,
  isBoardFull,
  placePiece,
  createTurnState,
} from "@hex/game-core";

const SINGLEPLAYER_STORAGE_KEY = "hex_singleplayer_state";

export const Route = createFileRoute("/play/")({
  component: SingleplayerPage,
});

interface SavedGameState {
  board: { q: number; r: number; player: Player }[];
  turnState: TurnState;
  playerRole: Player;
  aiRole: Player;
  difficulty: string;
  moveCount: number;
  gameStatus: "active" | "finished";
  winner: Player | null;
  winReason: string | null;
  winLine: AxialCoord[] | null;
}

function boardToArray(b: Map<string, Player>): { q: number; r: number; player: Player }[] {
  const result: { q: number; r: number; player: Player }[] = [];
  for (const [key, player] of b) {
    const [q, r] = key.split(",").map(Number);
    result.push({ q, r, player });
  }
  return result;
}

function SingleplayerPage() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "master">("medium");

  // FIX 1: Hydration mismatch — never use Math.random() in useState initializer.
  // Default to "X" on both server and client, then randomize on mount (client-only).
  const [playerRole, setPlayerRole] = useState<Player>("X");

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnState, setTurnState] = useState<TurnState>(createTurnState);
  const [board, setBoard] = useState<Map<string, Player>>(createBoard);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<AxialCoord | null>(null);

  // FIX 2: Keep refs that always point to the latest board/turnState/gameState/playerRole.
  // This prevents stale closures in setTimeout and async AI callbacks.
  const boardRef = useRef(board);
  const turnStateRef = useRef(turnState);
  const gameStateRef = useRef(gameState);
  const playerRoleRef = useRef(playerRole);
  const difficultyRef = useRef(difficulty);
  const isAiThinkingRef = useRef(isAiThinking);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { turnStateRef.current = turnState; }, [turnState]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { playerRoleRef.current = playerRole; }, [playerRole]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { isAiThinkingRef.current = isAiThinking; }, [isAiThinking]);

  const aiConfigRef = useRef<AIConfig | null>(null);

  // Update AI config whenever difficulty or role changes
  useEffect(() => {
    const aiPlayer: Player = playerRole === "X" ? "O" : "X";
    aiConfigRef.current = getAIConfig(difficulty, aiPlayer);
  }, [difficulty, playerRole]);

  const saveGameState = useCallback((state: SavedGameState) => {
    try {
      localStorage.setItem(SINGLEPLAYER_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors (private browsing, quota exceeded, etc.)
    }
  }, []);

  // FIX 3: triggerAIMove reads from refs, not from closure-captured state.
  // This means it always operates on the most recent board/turnState even when
  // called via setTimeout after an async state update.
  const triggerAIMove = useCallback(async () => {
    if (!aiConfigRef.current || isAiThinkingRef.current) return;

    const currentGameState = gameStateRef.current;
    if (!currentGameState || currentGameState.status !== "active") return;

    setIsAiThinking(true);
    // Yield to let React flush the state update before the (potentially expensive) AI call
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    // Re-read from refs after the yield — state may have changed
    const latestBoard = boardRef.current;
    const latestTurnState = turnStateRef.current;
    const latestGameState = gameStateRef.current;
    const latestPlayerRole = playerRoleRef.current;
    const latestDifficulty = difficultyRef.current;

    if (!latestGameState || latestGameState.status !== "active") {
      setIsAiThinking(false);
      return;
    }

    const aiRole: Player = latestPlayerRole === "X" ? "O" : "X";

    // Safety: only run AI if it's actually the AI's turn
    if (latestTurnState.currentTurn !== aiRole) {
      setIsAiThinking(false);
      return;
    }

    const aiResult: AIEvaluation = findBestMove(latestBoard, latestTurnState, aiConfigRef.current);

    if (!aiResult.move) {
      setIsAiThinking(false);
      return;
    }

    const newBoard = setCell(latestBoard, aiResult.move, aiRole);
    const newTurnState = placePiece(latestTurnState);
    const winLine = checkWinFromCell(newBoard, aiResult.move, aiRole, 6, 20);

    let newStatus: "active" | "finished" = "active";
    let winner: Player | null = null;
    let winReason: string | null = null;

    if (winLine) {
      newStatus = "finished";
      winner = aiRole;
      winReason = "six_in_row";
    } else if (isBoardFull(newBoard, 20)) {
      newStatus = "finished";
      winReason = "draw";
    }

    setBoard(newBoard);
    setTurnState(newTurnState);
    setLastMove(aiResult.move);

    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        board: newBoard,
        currentTurn: newTurnState.currentTurn,
        piecesPlacedThisTurn: newTurnState.piecesPlacedThisTurn,
        moveCount: newTurnState.moveCount,
        status: newStatus,
        winner,
        winReason: winReason as any,
        winLine: winLine ?? null,
        updatedAt: Date.now(),
      };
    });

    saveGameState({
      board: boardToArray(newBoard),
      turnState: newTurnState,
      playerRole: latestPlayerRole,
      aiRole,
      difficulty: latestDifficulty,
      moveCount: newTurnState.moveCount,
      gameStatus: newStatus,
      winner,
      winReason,
      winLine: winLine ?? null,
    });

    setIsAiThinking(false);
  }, [saveGameState]); // stable — all volatile reads go through refs

  const startNewGame = useCallback((overrideRole?: Player) => {
    const role = overrideRole ?? playerRoleRef.current;
    const diff = difficultyRef.current;
    const newBoard = createBoard();
    const newTurnState = createTurnState();
    const aiRole: Player = role === "X" ? "O" : "X";

    if (role === "X") {
      // Player is X — X places the opening move at center
      const openingMove: AxialCoord = { q: 0, r: 0 };
      const newBoardWithMove = setCell(newBoard, openingMove, role);
      const nextTurnState = placePiece(newTurnState);

      setBoard(newBoardWithMove);
      setTurnState(nextTurnState);
      setLastMove(openingMove);

      const initialState: GameState = {
        gameId: "singleplayer",
        status: "active",
        boardRadius: 20,
        board: newBoardWithMove,
        playerXId: "player",
        playerOId: "ai",
        currentTurn: nextTurnState.currentTurn,
        piecesPlacedThisTurn: nextTurnState.piecesPlacedThisTurn,
        moveCount: nextTurnState.moveCount,
        winner: null,
        winReason: null,
        winLine: null,
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      setGameState(initialState);

      saveGameState({
        board: boardToArray(newBoardWithMove),
        turnState: nextTurnState,
        playerRole: role,
        aiRole,
        difficulty: diff,
        moveCount: nextTurnState.moveCount,
        gameStatus: "active",
        winner: null,
        winReason: null,
        winLine: null,
      });
    } else {
      // Player is O — AI (X) makes the opening move
      const aiConfig = getAIConfig(diff, "X");
      const aiResult = findBestMove(newBoard, newTurnState, aiConfig);

      if (aiResult.move) {
        const newBoardWithMove = setCell(newBoard, aiResult.move, "X");
        const nextTurnState = placePiece(newTurnState);

        setBoard(newBoardWithMove);
        setTurnState(nextTurnState);
        setLastMove(aiResult.move);

        const initialState: GameState = {
          gameId: "singleplayer",
          status: "active",
          boardRadius: 20,
          board: newBoardWithMove,
          playerXId: "ai",
          playerOId: "player",
          currentTurn: nextTurnState.currentTurn,
          piecesPlacedThisTurn: nextTurnState.piecesPlacedThisTurn,
          moveCount: nextTurnState.moveCount,
          winner: null,
          winReason: null,
          winLine: null,
          startedAt: Date.now(),
          updatedAt: Date.now(),
        };
        setGameState(initialState);

        saveGameState({
          board: boardToArray(newBoardWithMove),
          turnState: nextTurnState,
          playerRole: role,
          aiRole: "X",
          difficulty: diff,
          moveCount: nextTurnState.moveCount,
          gameStatus: "active",
          winner: null,
          winReason: null,
          winLine: null,
        });
      }
    }
  }, [saveGameState]); // stable

  // FIX 4: On mount (client only), randomize the role and start/load game.
  // By doing this in useEffect it never runs on the server, eliminating the
  // hydration mismatch entirely.
  useEffect(() => {
    const saved = localStorage.getItem(SINGLEPLAYER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SavedGameState = JSON.parse(saved);
        const loadedBoard = createBoard();
        for (const cell of parsed.board) {
          loadedBoard.set(`${cell.q},${cell.r}`, cell.player);
        }

        const aiRole: Player = parsed.playerRole === "X" ? "O" : "X";

        setBoard(loadedBoard);
        setTurnState(parsed.turnState);
        setPlayerRole(parsed.playerRole);
        setDifficulty(parsed.difficulty as any);

        aiConfigRef.current = getAIConfig(parsed.difficulty as any, aiRole);

        const restoredGameState: GameState = {
          gameId: "singleplayer",
          status: parsed.gameStatus,
          boardRadius: 20,
          board: loadedBoard,
          playerXId: parsed.playerRole === "X" ? "player" : "ai",
          playerOId: parsed.playerRole === "O" ? "player" : "ai",
          currentTurn: parsed.turnState.currentTurn,
          piecesPlacedThisTurn: parsed.turnState.piecesPlacedThisTurn,
          moveCount: parsed.moveCount,
          winner: parsed.winner,
          winReason: parsed.winReason as any,
          winLine: parsed.winLine,
          startedAt: Date.now(),
          updatedAt: Date.now(),
        };
        setGameState(restoredGameState);
        return;
      } catch {
        // Corrupt save — fall through to new game
        localStorage.removeItem(SINGLEPLAYER_STORAGE_KEY);
      }
    }

    // No saved game: randomize role and start fresh
    const randomRole: Player = Math.random() < 0.5 ? "X" : "O";
    setPlayerRole(randomRole);
    startNewGame(randomRole);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount only

  // When AI config changes, update the ref
  useEffect(() => {
    const aiPlayer: Player = playerRole === "X" ? "O" : "X";
    aiConfigRef.current = getAIConfig(difficulty, aiPlayer);
  }, [difficulty, playerRole]);

  // FIX 5: Trigger AI move reactively when it becomes the AI's turn.
  // Uses gameState as the trigger (not a setTimeout-based chain), so we never
  // miss a turn or fire with a stale board.
  useEffect(() => {
    const gs = gameState;
    if (!gs || gs.status !== "active" || isAiThinking) return;

    const aiRole: Player = playerRole === "X" ? "O" : "X";
    if (gs.currentTurn === aiRole) {
      // Small delay so the player sees their piece render before AI "thinks"
      const id = setTimeout(() => { void triggerAIMove(); }, 400);
      return () => clearTimeout(id);
    }
  }, [gameState?.currentTurn, gameState?.status, isAiThinking, playerRole, triggerAIMove]);

  const handleCellClick = useCallback((coord: AxialCoord) => {
    const gs = gameStateRef.current;
    if (!gs || gs.status !== "active") return;
    if (isAiThinkingRef.current) return;

    const role = playerRoleRef.current;
    const isPlayerTurn = gs.currentTurn === role;
    if (!isPlayerTurn) return;

    const currentBoard = boardRef.current;
    const currentTurnState = turnStateRef.current;

    const key = `${coord.q},${coord.r}`;
    if (currentBoard.has(key)) return;

    const newBoard = setCell(currentBoard, coord, role);
    const newTurnState = placePiece(currentTurnState);
    const winLine = checkWinFromCell(newBoard, coord, role, 6, 20);

    let newStatus: "active" | "finished" = "active";
    let winner: Player | null = null;
    let winReason: string | null = null;

    if (winLine) {
      newStatus = "finished";
      winner = role;
      winReason = "six_in_row";
    } else if (isBoardFull(newBoard, 20)) {
      newStatus = "finished";
      winReason = "draw";
    }

    setBoard(newBoard);
    setTurnState(newTurnState);
    setLastMove(coord);

    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        board: newBoard,
        currentTurn: newTurnState.currentTurn,
        piecesPlacedThisTurn: newTurnState.piecesPlacedThisTurn,
        moveCount: newTurnState.moveCount,
        status: newStatus,
        winner,
        winReason: winReason as any,
        winLine: winLine ?? null,
        updatedAt: Date.now(),
      };
    });

    saveGameState({
      board: boardToArray(newBoard),
      turnState: newTurnState,
      playerRole: role,
      aiRole: role === "X" ? "O" : "X",
      difficulty: difficultyRef.current,
      moveCount: newTurnState.moveCount,
      gameStatus: newStatus,
      winner,
      winReason,
      winLine: winLine ?? null,
    });
    // AI trigger is handled by the useEffect above — no setTimeout here
  }, [saveGameState]);

  const handleNewGame = useCallback(() => {
    startNewGame();
  }, [startNewGame]);

  const handleSetRole = useCallback((role: Player) => {
    setPlayerRole(role);
    startNewGame(role);
  }, [startNewGame]);

  const handleSetDifficulty = useCallback((diff: "easy" | "medium" | "hard" | "master") => {
    setDifficulty(diff);
  }, []);

  const userId = "player";

  return (
    <div className="relative w-full h-[calc(100dvh-72px)] bg-slate-900 overflow-hidden">
      <div className="relative w-full h-full">
        {/* Difficulty selector */}
        <div className="absolute top-16 left-4 z-10 flex gap-2">
          <select
            value={difficulty}
            onChange={(e) => handleSetDifficulty(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="master">Master</option>
          </select>

          <button
            onClick={handleNewGame}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            New Game
          </button>
        </div>

        {/* Role selector */}
        <div className="absolute top-16 right-4 z-10">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 flex gap-2">
            <button
              onClick={() => handleSetRole("X")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                playerRole === "X"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Play as X
            </button>
            <button
              onClick={() => handleSetRole("O")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                playerRole === "O"
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Play as O
            </button>
          </div>
        </div>

        {/* Canvas game board */}
        {gameState && (
          <HexCanvas gameState={gameState} userId={userId} onCellClick={handleCellClick} />
        )}

        {/* HUD overlay */}
        {gameState && (
          <GameHUD
            gameState={gameState}
            userId={userId}
            isConnected={true}
            onResign={() => {
              setGameState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  status: "finished",
                  winner: playerRoleRef.current === "X" ? "O" : "X",
                  winReason: "resignation" as any,
                };
              });
            }}
            onOfferDraw={() => {}}
            drawOffered={false}
            onRespondDraw={() => {}}
          />
        )}

        {/* AI thinking indicator */}
        {isAiThinking && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-600 rounded-full text-slate-300 text-xs pointer-events-none">
            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            AI thinking…
          </div>
        )}

        {/* Game info */}
        <div className="absolute bottom-2 left-4 text-slate-600 text-xs font-mono">
          Mode: Singleplayer | Difficulty: {difficulty}
        </div>
      </div>
    </div>
  );
}
