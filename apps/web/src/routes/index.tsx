import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">Hexagonal Tic-Tac-Toe</h1>
      <p className="text-muted-foreground mb-8">Ready to play?</p>
      <button className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
        Enter Lobby
      </button>
    </div>
  );
}
