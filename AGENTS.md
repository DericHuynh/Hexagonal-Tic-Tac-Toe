# AGENTS.md

## Project Overview

TanStack Start full-stack React app running on Cloudflare Workers with Durable Objects and D1 (SQLite). Uses Drizzle ORM for both databases, WebSocket Hibernation API for real-time sync, and Tailwind CSS v4 for styling.

## Build & Run Commands

```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Production build (Vite)
pnpm test             # Run all tests (vitest run)
pnpm deploy           # Build + wrangler deploy
pnpm tsc --noEmit     # Type check (no dedicated script)
```

### Running a Single Test

```bash
pnpm vitest run test/durable-object.test.ts       # Single file
pnpm vitest run -t "increments the counter"        # By name pattern
```

### Database Commands

```bash
pnpm db:generate      # Generate D1 migrations (drizzle-kit)
pnpm db:generate:do   # Generate Durable Object SQLite migrations
pnpm db:migrate       # Apply D1 migrations via wrangler
pnpm cf-typegen       # Regenerate worker-configuration.d.ts
```

## Testing

- Vitest with `@cloudflare/vitest-pool-workers` -- tests run inside Workers runtime via miniflare
- Config: `vitest.config.ts` (separate from `vite.config.ts`). Tests in `test/*.test.ts`
- Bindings available via `import { env } from 'cloudflare:test'`
- No lint or format tools configured (no ESLint, Prettier, or Biome)

## Architecture

### Runtime & Entry Points

- **Worker entry:** `src/server.ts` -- `createServerEntry` from TanStack Start, intercepts WebSocket requests, delegates the rest to TanStack
- **Durable Object:** `src/durable-object.ts` -- `MyDurableObject` class with RPC methods and WebSocket Hibernation API
- **Router factory:** `src/router.tsx` -- creates TanStack Router instance
- **Route tree:** `src/routeTree.gen.ts` -- auto-generated, DO NOT edit manually

### Two Database Systems

1. **D1 (shared SQLite):** Schema in `src/db/schema.ts`, access via `getDb()` in `src/db/index.ts`, migrations in `drizzle/migrations/`
2. **Durable Object SQLite (per-instance):** Schema in `src/db/do-schema.ts`, migrations in `drizzle/do-migrations/`, auto-applied on DO construction

### Cloudflare Bindings

Access via `import { env } from 'cloudflare:workers'` (NOT `getCloudflareContext()`):
- `env.DB` -- D1 database
- `env.MY_DURABLE_OBJECT` -- DurableObjectNamespace

### Key Patterns

- **Server functions:** Defined with `createServerFn()` from `@tanstack/react-start`, placed at the top of route files before the route definition
- **DO RPC:** Server functions call DO methods directly via `env.MY_DURABLE_OBJECT.getByName(id).methodName()`
- **WebSocket:** Upgrade requests intercepted in `src/server.ts` via regex, forwarded to DO `fetch()`
- **Optimistic UI:** Client updates state immediately, reverts on error (see `src/routes/counter/$id.tsx`)
- **DO migrations:** Run in `blockConcurrencyWhile` during DO construction

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target ES2022, module ESNext, bundler module resolution
- Use `type` keyword for type-only imports when applicable
- No formatter configured -- follow the style of the file you're editing (2-space indent in src, tabs in tests, single quotes, trailing commas, semicolons)

### Imports

- Path alias `@/*` maps to `./src/*` (e.g., `import { getDb } from '@/db'`)
- Order: external packages > `cloudflare:*` imports > internal `@/` imports > relative imports
- Named exports preferred; default exports only for React components

### Naming Conventions

- **Files:** kebab-case (`do-schema.ts`, `durable-object.ts`)
- **Route files:** TanStack Start conventions -- `$param.tsx`, `__root.tsx`, dot-separated nested paths (`start.ssr.data-only.tsx`)
- **Components:** PascalCase (`CounterPage`, `Header`)
- **Server functions:** camelCase (`getCounterValue`, `incrementCounter`)
- **DB tables/columns:** snake_case in SQL, camelCase in Drizzle schema
- **Constants:** UPPER_SNAKE_CASE (`WS_COUNTER_PATTERN`, `DEFAULT_SONGS`)
- **Private DO methods:** underscore prefix (`_getOrCreateCounter`, `_broadcast`)

### TanStack Start & React Patterns

- **Prefer server functions over API routes.** Use `createServerFn()` for data fetching and mutations. API routes (`server.handlers`) should only be used when you need a raw HTTP endpoint (e.g., for external consumers or webhooks).
- **Avoid `useEffect` for data fetching.** Use route `loader` functions with server functions instead. `useEffect` is acceptable only for browser-only side effects like WebSocket connections or DOM measurements.
- Route components are non-exported named functions; `export const Route` is the file route definition
- Use `Route.useLoaderData()` and `Route.useParams()` for route data access
- Functional components only, Tailwind CSS v4 utility classes for all styling

### Error Handling

- Optimistic updates with try/catch and rollback on failure
- Empty `catch` blocks acceptable for non-critical errors but must include a comment explaining why
- DO WebSocket errors handled gracefully -- connection status tracked in component state

### Drizzle ORM

- Schema files export table definitions directly (`export const songs = sqliteTable(...)`)
- Functional column builders: `integer()`, `text()` (not `integer("colname")`)
- Chain modifiers: `.primaryKey({ autoIncrement: true })`, `.notNull()`, `.default(0)`
- D1 access always through `getDb()` helper, never raw `env.DB`

### Durable Objects

- Extend `DurableObject<Env>` from `cloudflare:workers`
- Always call `super(ctx, env)` in constructor
- Run migrations in `ctx.blockConcurrencyWhile()` during construction
- Public methods are RPC-callable; prefix private helpers with underscore
- WebSocket handlers use the Hibernation API (`ctx.acceptWebSocket`, `webSocketMessage`, `webSocketClose`)
- Export DO class from `src/server.ts` for wrangler to discover
