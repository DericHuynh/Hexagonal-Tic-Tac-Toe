import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/lessons/$id")({
  component: LessonPage,
});

function LessonPage() {
  const { id } = useParams({ from: "/lessons/$id" });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
      <h1 className="text-3xl font-bold mb-4">Lesson: {id}</h1>
      <p className="text-slate-400">Interactive board and slides go here.</p>
    </div>
  );
}
