# AGENTS.md

> **Agent Protocol & Philosophy (T3/Theo Methodology)**
> This file is NOT a codebase tour or a README. You have tools to read the file tree and code—use them. This file is a living list of **tooling gotchas, non-obvious conventions, and operational landmines** that will waste your time or break the app.
>
> **Forcing Function:** Before ending a session, if you learn something that could save the next agent from pain (a specific framework quirk, a strange build error, a recurring mistake), you MUST add it to this file.

## 🛠 Commands & Tooling (Use These, Not NPM/PNPM)

We use Vite+ (`vp`), a unified toolchain that handles packages, testing, formatting, and linting.

- **❌ DO NOT** run `pnpm`, `npm`, `yarn`, `vitest`, or `oxlint` directly.
- **✅ DO** use `vp` for everything.

**Core Commands:**

- `vp install` — Run this **first** after pulling remote changes or starting a task.
- `vp check` — Runs format, lint, and TypeScript type checks. Run this to validate your code.
- `vp test` — Runs tests (e.g., `vp test -- run packages/game-core/tests/win-checker.test.ts`).
- `vp run dev` — Starts dev server on port 3000.
- `vp run db:generate` / `vp run db:generate:do` / `vp run db:migrate` — Drizzle DB commands.

## 💣 Landmines & Gotchas (READ CAREFULLY)

### 1. The `cloudflare:workers` Client-Side Leak (FATAL)

**NEVER** import `cloudflare:workers`, `cloudflare:test`, or the Cloudflare `Env` type directly into client-side `.tsx` files (like route components). This will immediately break the TanStack Start SSR/client build and leak server secrets and environment bindings to the browser.

- **Fix:** Keep all Cloudflare bindings strictly isolated.

### 2. TanStack Start Implementation & `.server.ts`

TanStack Start uses `createServerFn()` for backend logic. However, mixing heavy server packages or Cloudflare imports in the same file as client React code is a massive footgun.

- **Rule:** Define all server-only logic, Durable Object classes, secure DB connections, and Cloudflare Env bindings inside files ending in `.server.ts` (e.g., `server.ts`).
- Route files (`.tsx`) should only define the `createServerFn()` block, which internally delegates to logic imported from a `.server.ts` file. This strictly isolates server logic from the client bundler.

### 3. Type Checking Durable Objects on the Client

If you need a Durable Object's type (like `GameSession` for RPC calls) in a shared or client-safe context (like a route file or React hook):

- **✅ DO:** `import { type GameSession } from './server.ts'`
- **Why:** Explicitly importing `{ type ... }` ensures the bundler completely strips the import from the client payload. This passes the TypeScript checker without dragging the actual `cloudflare:workers` class implementation into the browser.

### 4. Broken DO Tests vs. Pure `game-core`

- Cloudflare's Vitest plugins are currently incompatible with Vite+. **Durable Object tests may be broken.** Do not waste time trying to debug or fix the Cloudflare DO test runner environment.
- **Focus testing on `packages/game-core/`**, which contains pure TypeScript unit tests (no React, no Cloudflare).

## 📐 Non-Obvious Architecture Conventions

**Two Database Systems:**

1. **D1 (Shared):** Schema is in `packages/db/src/schema.ts`. Access ALWAYS via `getDb(env.DB)` from `packages/db/src/index.ts`. Never use raw `env.DB`.
2. **Durable Object SQLite (Local):** Schema is in `packages/db/src/do-schema.ts`. Accessed inside the DO via `drizzle(this.storage)`. DO migrations run in `ctx.blockConcurrencyWhile()` during constructor setup.

**Hex Math:**

- Hex coordinates use Axial `(q, r)` with `s = -q - r`. Always use named properties in objects (e.g., `{ q: 1, r: -1 }`), never raw arrays.
- Pure logic lives entirely in `game-core`.

**React & Canvas Render Loop:**

- Do not use `useEffect` for data fetching (use TanStack Router loaders/`createServerFn`).
- Canvas rendering (`apps/web/src/lib/canvas-renderer.ts`) is built of pure functions—**zero React state**. `HexCanvas` owns the ref and calls the renderer via `requestAnimationFrame`.
- UI components exist in "@hex/ui" and can be reference like "@hex/ui/button", they're shadcn@rc Base components.

## ✅ Pre-flight Checklist

Before completing your task, verify:

- [ ] Did I run `vp install` before getting started?
- [ ] Did I accidentally import a Cloudflare type/binding into a frontend `.tsx` file? (If yes, isolate it in a `.server.ts` file).
- [ ] Did I run `vp check` and `vp test` to validate changes?
