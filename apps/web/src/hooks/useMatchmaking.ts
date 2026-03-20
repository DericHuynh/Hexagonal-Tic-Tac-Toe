import { useState, useCallback, useEffect, useRef } from "react";

interface MatchmakingState {
  status: "idle" | "queued" | "matched";
  gameId: string | null;
  error: string | null;
  waitSeconds: number;
}

export function useMatchmaking(userId: string) {
  const [state, setState] = useState<MatchmakingState>({
    status: "idle",
    gameId: null,
    error: null,
    waitSeconds: 0,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }, []);

  const joinQueue = useCallback(async () => {
    setState({ status: "queued", gameId: null, error: null, waitSeconds: 0 });

    // Call server function to join queue
    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, elo: 1200, gameMode: "standard" }),
      });
      const data = (await res.json()) as { ok: boolean; gameId?: string; error?: string };
      if (!data.ok) {
        setState((s) => ({ ...s, status: "idle", error: data.error ?? "Failed to join queue" }));
        return;
      }
      if (data.gameId) {
        setState({ status: "matched", gameId: data.gameId, error: null, waitSeconds: 0 });
        return;
      }
    } catch {
      setState((s) => ({ ...s, status: "idle", error: "Network error" }));
      return;
    }

    // Start polling
    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, waitSeconds: s.waitSeconds + 1 }));
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/matchmaking/status?userId=${encodeURIComponent(userId)}`);
        const data = (await res.json()) as { status: string; gameId?: string };
        if (data.status === "matched" && data.gameId) {
          stopPolling();
          setState({ status: "matched", gameId: data.gameId, error: null, waitSeconds: 0 });
        }
      } catch {
        // ignore transient errors
      }
    }, 2000);
  }, [userId, stopPolling]);

  const leaveQueue = useCallback(async () => {
    stopPolling();
    setState({ status: "idle", gameId: null, error: null, waitSeconds: 0 });
    try {
      await fetch("/api/matchmaking/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      // ignore
    }
  }, [userId, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { ...state, joinQueue, leaveQueue };
}
