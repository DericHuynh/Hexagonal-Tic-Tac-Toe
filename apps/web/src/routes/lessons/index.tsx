import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/lessons/")({
  component: LessonsPage,
});

function LessonsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
      <h1 className="text-4xl font-bold mb-4">Hexagonal Tic-Tac-Toe Lessons</h1>
      <p className="text-slate-400 mb-8">Learn tactics and strategies.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/lessons/basics"
          className="block p-6 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
        >
          <h2 className="text-xl font-bold text-cyan-400 mb-2">Basics</h2>
          <p className="text-sm text-slate-400">Learn how to play and how turns work.</p>
        </a>
      </div>
    </div>
  );
}
