// components/Header.tsx
import { Link } from "@tanstack/react-router";
import { BookOpen, Gamepad2, Home, Menu, Trophy, User, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="p-4 flex backdrop-blur-lg items-center text-white shadow-lg bg-slate-900/80 border-b border-slate-800 h-[72px]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/">
            <span className="bg-white bg-clip-text text-transparent">Hex</span>
            <span className="bg-cyan-400 bg-clip-text text-transparent">T</span>
            <span className="bg-white bg-clip-text text-transparent">T</span>
            <span className="bg-orange-400 bg-clip-text text-transparent">T</span>
          </Link>
        </h1>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-slate-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700 h-[72px]">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/play"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
            }}
          >
            <Gamepad2 size={20} />
            <span className="font-medium">Play Game</span>
          </Link>

          <Link
            to="/lessons"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
            }}
          >
            <BookOpen size={20} />
            <span className="font-medium">Lessons</span>
          </Link>

          <Link
            to="/leaderboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
            }}
          >
            <Trophy size={20} />
            <span className="font-medium">Leaderboard</span>
          </Link>

          <Link
            to="/profile/$username"
            params={{ username: "demo" }}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
            }}
          >
            <User size={20} />
            <span className="font-medium">Profile</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
