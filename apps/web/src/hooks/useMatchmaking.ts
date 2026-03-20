import { useState, useCallback, useEffect, useRef } from "react";
import { createServerFn } from "@tanstack/react-start";
import { rpcJoinQueue, rpcCheckQueueStatus, rpcLeaveQueue } from "../lib/server-rpc.server";

const joinQueueFn = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; elo: number; gameMode: string }) => d)
  .handler(async ({ data }) => {
    const res = await rpcJoinQueue(data.userId, data.elo, data.gameMode);
    return { ok: res.ok, gameId: res.gameId } as { ok: boolean; gameId?: string };
  });

const statusQueueFn = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const res = await rpcCheckQueueStatus(userId);
    return { status: res.status, gameId: res.gameId } as {
      status: "waiting" | "matched";
      gameId?: string;
    };
  });

const leaveQueueFn = createServerFn({ method: "POST" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    await rpcLeaveQueue(userId);
    return { ok: true };
  });

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

    try {
      const data = (await joinQueueFn({ data: { userId, elo: 1200, gameMode: "standard" } })) as {
        ok: boolean;
        gameId?: string;
        error?: string;
      };
      if (!data.ok) {
        setState((s) => ({ ...s, status: "idle", error: "Failed to join queue" }));
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

    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, waitSeconds: s.waitSeconds + 1 }));
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const data = (await statusQueueFn({ data: userId })) as { status: string; gameId?: string };
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
      await leaveQueueFn({ data: userId });
    } catch {
      // ignore
    }
  }, [userId, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { ...state, joinQueue, leaveQueue };
}
