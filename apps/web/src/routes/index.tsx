import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMatchmaking } from "../hooks/useMatchmaking";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const navigate = useNavigate();

  // Stable guest ID
  const [userId] = useState(() => {
    if (typeof window === "undefined") return "guest";
    let uid = sessionStorage.getItem("hex_user_id");
    if (!uid) {
      uid = `guest_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("hex_user_id", uid);
    }
    return uid;
  });

  const { status, gameId, waitSeconds, error, joinQueue, leaveQueue } = useMatchmaking(userId);

  // Navigate when matched
  useEffect(() => {
    if (status === "matched" && gameId) {
      void navigate({ to: "/game/$id", params: { id: gameId } });
    }
  }, [status, gameId, navigate]);

  const formatWait = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        {/* Animated hex grid background using CSS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%236366f1' stroke-width='1'/%3E%3C/svg%3E")`,
              backgroundSize: "60px 52px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-8">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            Real-time multiplayer
          </div>

          {/* Title */}
          <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-4">
            <span className="text-white">Hex</span>
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              TTT
            </span>
          </h1>
          <p className="text-2xl text-slate-400 mb-3 font-light">Hexagonal Tic-Tac-Toe</p>
          <p className="text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            A 1,261-cell hexagonal board. Six in a row to win. Two pieces per turn after the opening
            move. Fast, edge-native multiplayer via Cloudflare Durable Objects.
          </p>

          {/* CTA */}
          {status === "idle" && (
            <button
              id="play-button"
              onClick={() => void joinQueue()}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] active:scale-95"
            >
              ⬡ Find a Match
            </button>
          )}

          {status === "queued" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-800 border border-slate-600 rounded-xl">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-white font-semibold">Finding opponent…</span>
                <span className="text-slate-400 text-sm font-mono">{formatWait(waitSeconds)}</span>
              </div>
              <button
                onClick={() => void leaveQueue()}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </div>
      </section>

      {/* Rules */}
      <section className="max-w-4xl mx-auto w-full px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "⬡",
              title: "Hexagonal Board",
              desc: "Radius-20 hex grid with 1,261 cells using axial coordinates (q, r, s)",
            },
            {
              icon: "⚡",
              title: "Dynamic Turns",
              desc: "X opens with 1 piece, then players alternate placing 2 pieces per turn",
            },
            {
              icon: "🏆",
              title: "Six in a Row",
              desc: "Form 6 consecutive pieces along any of the 3 hex axes to win",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-colors"
            >
              <div className="text-3xl mb-3">{feat.icon}</div>
              <h3 className="text-white font-semibold mb-1">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
