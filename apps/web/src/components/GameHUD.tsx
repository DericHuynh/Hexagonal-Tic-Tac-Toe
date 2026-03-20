import type { GameState } from "@hex/game-core";

interface GameHUDProps {
  gameState: GameState;
  userId: string;
  isConnected: boolean;
  onResign?: () => void;
  onOfferDraw?: () => void;
  drawOffered?: boolean;
  onRespondDraw?: (accept: boolean) => void;
}

export function GameHUD({
  gameState,
  userId,
  isConnected,
  onResign,
  onOfferDraw,
  drawOffered,
  onRespondDraw,
}: GameHUDProps) {
  const isPlayerX = gameState.playerXId === userId;
  const isPlayerO = gameState.playerOId === userId;
  const myRole = isPlayerX ? "X" : isPlayerO ? "O" : null;
  const isMyTurn =
    gameState.status === "active" &&
    ((gameState.currentTurn === "X" && isPlayerX) || (gameState.currentTurn === "O" && isPlayerO));

  const piecesRemaining =
    gameState.status === "active"
      ? (gameState.moveCount === 0 ? 1 : 2) - gameState.piecesPlacedThisTurn
      : 0;

  const statusText = () => {
    if (gameState.status === "waiting") return "Waiting for opponent…";
    if (gameState.status === "finished") {
      if (!gameState.winner) return "🤝 Draw!";
      if ((gameState.winner === "X" && isPlayerX) || (gameState.winner === "O" && isPlayerO)) {
        return "🎉 You Win!";
      }
      return "😔 You Lose";
    }
    if (isMyTurn)
      return `Your turn — place ${piecesRemaining} piece${piecesRemaining !== 1 ? "s" : ""}`;
    return `Opponent's turn…`;
  };

  return (
    <div className="absolute inset-x-0 top-0 flex flex-col gap-2 pointer-events-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-slate-900/80 backdrop-blur border-b border-slate-700">
        {/* Player X */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-lg ${gameState.currentTurn === "X" && gameState.status === "active" ? "bg-cyan-500/15 ring-1 ring-cyan-500/50" : ""}`}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-white text-sm font-semibold">Player X</span>
          {gameState.playerXId === userId && <span className="text-cyan-400 text-xs">(you)</span>}
        </div>

        {/* Status */}
        <div className="text-center">
          <div
            className={`text-sm font-bold px-4 py-1 rounded-full ${
              gameState.status === "finished"
                ? gameState.winner === myRole
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
                : isMyTurn
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400"
            }`}
          >
            {statusText()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Move #{gameState.moveCount}</div>
        </div>

        {/* Player O */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-lg ${gameState.currentTurn === "O" && gameState.status === "active" ? "bg-orange-500/15 ring-1 ring-orange-500/50" : ""}`}
        >
          {gameState.playerOId === userId && <span className="text-orange-400 text-xs">(you)</span>}
          <span className="text-white text-sm font-semibold">Player O</span>
          <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
        </div>
      </div>

      {/* Connection indicator */}
      {!isConnected && (
        <div className="mx-4 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded text-red-400 text-xs text-center pointer-events-auto">
          ⚡ Reconnecting…
        </div>
      )}

      {/* Draw offer banner */}
      {drawOffered && (
        <div className="mx-4 flex items-center gap-2 px-3 py-2 bg-slate-800 border border-yellow-500/40 rounded-lg pointer-events-auto">
          <span className="text-yellow-300 text-sm">Opponent offers a draw</span>
          <button
            onClick={() => onRespondDraw?.(true)}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => onRespondDraw?.(false)}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
          >
            Decline
          </button>
        </div>
      )}

      {/* Bottom action buttons */}
      {gameState.status === "active" && myRole && (
        <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
          <button
            onClick={onOfferDraw}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs rounded transition-colors"
          >
            Offer Draw
          </button>
          <button
            onClick={onResign}
            className="px-3 py-1.5 bg-red-700/60 hover:bg-red-600 text-red-300 hover:text-white text-xs rounded transition-colors"
          >
            Resign
          </button>
        </div>
      )}

      {/* Game over final state */}
      {gameState.status === "finished" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur border border-slate-600 rounded-2xl px-8 py-6 text-center shadow-2xl">
            <div className="text-5xl mb-3">
              {!gameState.winner ? "🤝" : gameState.winner === myRole ? "🏆" : "💀"}
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {!gameState.winner ? "Draw" : gameState.winner === myRole ? "Victory!" : "Defeat"}
            </div>
            <div className="text-slate-400 text-sm">
              {gameState.winReason === "six_in_row" && "Six in a row!"}
              {gameState.winReason === "resignation" && "By resignation"}
              {gameState.winReason === "draw" && "Mutual agreement"}
              {gameState.winReason === "timeout" && "Timeout"}
            </div>
            <a
              href="/"
              className="inline-block mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors pointer-events-auto"
            >
              Play Again
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
