import { env } from "cloudflare:workers";

export async function GET({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the MatchmakingQueue DO singleton
    const doId = env.MATCHMAKING_QUEUE.idFromName("global");
    const stub = env.MATCHMAKING_QUEUE.get(doId);

    const result = await stub.checkStatus(userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
