import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { env } from 'cloudflare:workers'
import { MyDurableObject } from './durable-object';

export { MyDurableObject };

/** Matches /counter/:id/ws and extracts the counter id */
export const WS_COUNTER_PATTERN = /^\/counter\/([^/]+)\/ws$/;

export default createServerEntry({
  fetch(request) {
    const url = new URL(request.url);

    // Intercept WebSocket upgrade requests for counter real-time sync.
    // Pattern: /counter/:id/ws
    const wsMatch = url.pathname.match(WS_COUNTER_PATTERN);
    if (wsMatch && request.headers.get('Upgrade') === 'websocket') {
      const id = wsMatch[1];
      const stub = env.MY_DURABLE_OBJECT.getByName(id);
      return stub.fetch(request);
    }

    return handler.fetch(request)
  },
})
