import { env } from "cloudflare:workers";

export async function POST({ request }: { request: Request }) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the MatchmakingQueue DO singleton
    const doId = env.MATCHMAKING_QUEUE.idFromName("global");
    const stub = env.MATCHMAKING_QUEUE.get(doId);

    await stub.leaveQueue(userId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
