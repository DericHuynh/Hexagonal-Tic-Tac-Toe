import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = useParams({ from: "/profile/$username" });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
      <h1 className="text-4xl font-bold mb-4">{username}'s Profile</h1>
      <p className="text-slate-400">Statistics and match history will be loaded here from D1.</p>
    </div>
  );
}
