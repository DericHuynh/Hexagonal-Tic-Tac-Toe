import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMatchmaking } from "../hooks/useMatchmaking";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const navigate = useNavigate();

  // 1. Stable guest ID
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

  // 2. Matchmaking Navigation
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
    <div className="relative flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-32 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-8 backdrop-blur-md">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            Live Global Matchmaking
          </div>

          <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-4 drop-shadow-2xl">
            <span className="bg-white bg-clip-text text-transparent mr-1.5">Hex</span>
            <span className="bg-cyan-400 bg-clip-text text-transparent">T</span>
            <span className=" bg-white bg-clip-text text-transparent">T</span>
            <span className="bg-orange-400 bg-clip-text text-transparent">T</span>
          </h1>
          <p className="text-2xl text-slate-300 mb-3 font-light">The hexagonal game of strategy.</p>
          <p className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Standard Tic-Tac-Toe is solved. Hex TTT adds 1,261 cells and a dynamic double-move
            system for deep, emergent complexity.
          </p>

          <div className="relative inline-block">
            {status === "idle" && (
              <button
                onClick={() => void joinQueue()}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-xl">⬡</span> Find a Match
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </button>
            )}

            {status === "queued" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-8 py-4 bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-semibold">Searching for Opponent...</span>
                  <span className="text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {formatWait(waitSeconds)}
                  </span>
                </div>
                <button
                  onClick={() => void leaveQueue()}
                  className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-1"
                >
                  ✕ Cancel search
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Rules Grid */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "⬡",
              title: "Massive Board",
              desc: "Radius-20 hex grid with 1,261 cells using axial coordinates (q, r)",
            },
            {
              icon: "⚡",
              title: "Double-Move Rule",
              desc: "X starts with one piece. Thenceforth, players place two pieces per turn.",
            },
            {
              icon: "🏆",
              title: "6-in-a-Row",
              desc: "Form a straight line of six pieces along any hex axis to claim victory.",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 hover:border-indigo-500/40 transition-all group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">
                {feat.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
