# AI Agent Instructions (AGENTS.md)

Welcome. You are assisting in the development of a Hexagonal Tic Tac Toe multiplayer game. The game works as follows:
- The grid is a hexagon of hexagons that is 20 hexagons in radius, you can only place hexagons within 7 hexagons of the enemy hexagons.
- You win by getting 6 in a row
- Draw if there's no hexagons left to place and there's no winner.
- First player starts by placing one X, then the other player places 2 O's, then they alternate placing 2 each per turn.

 Read this document carefully before suggesting code, writing tests, or modifying configurations. 

## 🏗️ Architecture & Tech Stack Overview

This is a modern, edge-native PNPM Turborepo. It heavily utilizes Cloudflare's ecosystem and the latest React paradigms.

### **Core Stack**
- **Monorepo:** Turborepo + PNPM Workspaces
- **Frontend / SSR:** TanStack Start (React 19) + TanStack Router
- **Styling:** Tailwind CSS **v4** + Shadcn UI through shadcn@rc (not shadcn@latest)
- **Real-Time Backend:** Cloudflare Workers + Durable Objects (DO)
- **Database & Auth:** Cloudflare D1 + Drizzle ORM + BetterAuth
- **Testing:** Vitest (Unit) + Playwright (E2E)
- **Tooling:** Biome (Formatting/Linting)
- **Environment:** T3 Env (Type-safe environment variables)

---

## 📂 Repository Structure & Responsibilities

The codebase is split into the "2-App Pattern" to separate Server-Side Rendering from Stateful WebSocket management. 

### Apps (`/apps`)
1. **`apps/web` (TanStack Start App)**
   - Deployed to Cloudflare Pages.
   - Handles SSR, Routing, Authentication (BetterAuth API routes), and UI delivery.
   - Communicates with D1 via standard REST/RPC and connects to `game-server` via WebSockets.
   - Uses Vite (`app.config.ts` via Vinxi) and Tailwind v4.

2. **`apps/game-server` (Cloudflare Worker + Durable Objects)**
   - Deployed as a standard Cloudflare Worker.
   - Purely responsible for Game State and WebSockets.
   - Holds the `GameSession` Durable Object class.
   - DO NOT put UI or HTML rendering logic here.

### Packages (`/packages`)
1. **`packages/game-core` (The Source of Truth)**
   - Pure TypeScript. No React, no Cloudflare imports.
   - Contains: Hexagonal grid math, win-condition validation algorithms, and Zod schemas for WebSocket payloads.
   - Heavily unit-tested using Vitest. Both `apps/web` and `apps/game-server` import this package.

2. **`packages/db` (Database Layer)**
   - Contains Drizzle schema (`src/schema.ts`), D1 migration files, and BetterAuth database configurations.
   - Shared between `web` (for leaderboards/auth) and `game-server` (for saving match results).

3. **`packages/ui` (Shared Component Library)**
   - Contains Shadcn UI primitives and `react-hexgrid` wrapper components.
   - All `react-hexgrid` components must have `"use client"` directives as they manipulate the DOM heavily.
   - Configured with Storybook for isolated component testing.

---

## 🚨 Strict Coding Guidelines & Rules for AI

### 1. Tailwind CSS v4 Rules
- **Do not create or look for a `tailwind.config.js`.** Tailwind v4 uses standard CSS variables and a Vite plugin (`@tailwindcss/vite`).
- All theme customizations must be done inside `apps/web/app.css` using the `@theme` directive.
- Example: `@theme { --color-primary: #ff0000; }`.

### 2. TanStack Start & Router
- Use file-based routing inside `apps/web/app/routes/`.
- API routes (like BetterAuth endpoints) go inside `apps/web/app/routes/api/`.
- **Server Functions (`createServerFn`):** Use TanStack Start's `createServerFn` for RPC-style communication between the client and server instead of creating separate API routes for every action. This provides end-to-end type safety.
- Access Cloudflare context (env bindings) inside `createServerFn` via the injected server context, keeping in mind that functions executed via RPC will run on Cloudflare Pages.
- Use loaders for server-side state fetching before rendering. Do not rely heavily on standard React `useEffect` for data fetching.

### 3. Hexagonal Grid & Game Logic
- We are using an Axial/Cube coordinate system (q, r, s) for the Hex Grid.
- Mathematical validation (e.g., checking if 4 hexes align) must ONLY be written inside `packages/game-core`.
- If a user attempts a move in `apps/web`, optimistic UI updates should use `packages/game-core`. The `apps/game-server` Durable Object must then independently validate the move using the same package before broadcasting the state.

### 4. Cloudflare Durable Objects (WebSockets)
- Use ES Module syntax for the Worker (`export default { fetch(...) }`).
- The Durable Object (`GameSession.ts`) handles WebSocket upgrades via the Hibernation API (if possible) or standard DO WebSocket handling.
- Ensure all WebSocket messages strictly conform to the Zod schemas defined in `packages/game-core`.

### 5. Package Management
- Always use `pnpm`. 
- When adding a dependency to a specific workspace, use the filter flag. Example: `pnpm --filter web add lucide-react`.
- Internal package imports should use workspace formatting (e.g., `"@hex/game-core": "workspace:*"`).

### 6. Testing Strategy
- If you write math, write a Vitest test in `packages/game-core/tests`.
- If you change UI, consider a Storybook entry in `packages/ui`.
- If you modify how WebSockets sync state, write a Playwright E2E test in `tests/e2e/multiplayer.spec.ts` that spins up two browser contexts to verify synchronization.

### 7. Linting & Formatting (Biome)
- Use **Biome** for all linting and formatting. Do not use Prettier or ESLint.
- The `biome.json` file at the root of the monorepo dictates the formatting rules. Ensure your editor is configured to format on save using Biome.

---
## ⚡ Infrastructure & Binding Management (Crucial)

### 1. Cloudflare Bindings vs. Environment Variables
- **Do not use `process.env`** inside Cloudflare-deployed code (`apps/web` or `apps/game-server`). 
- Cloudflare provides environment variables through the `env` object passed into request handlers (`fetch`, `loaders`, `actions`, `createServerFn`).
- **T3 Env:** We use `@t3-oss/env-core` (T3 Env) to define and validate our bindings and environment variables.
- **Always** use the validated output from T3 Env by passing the Cloudflare `env` object into a type-safe parser rather than accessing raw strings.
- If you need a new binding, add it to the `wrangler.toml` in the respective app first, then update the app's T3 Env schema to ensure type safety.

### 2. Durable Object (DO) Boundaries
- The `apps/game-server` is the **only** place where `DurableObject` classes are defined.
- The `apps/web` app communicates with these objects solely through WebSocket connections or standard `fetch` requests (for signaling). 
- If you are writing code in `apps/web`, do not attempt to import the `GameSession` class directly.

### 3. TypeScript Runtime Types
- We use `@cloudflare/workers-types` globally. 
- If you encounter "Cannot find name X" (e.g., `D1Database`, `DurableObjectNamespace`), verify that `packages/tsconfig/base.json` includes `["@cloudflare/workers-types/2023-07-01"]` in `compilerOptions.types`.
- Never install `dotenv` or similar Node.js-based env loaders.

### 4. Database Access Pattern
- **`apps/web`**: Uses Drizzle ORM bound to the D1 `DB` binding. Use this for Auth (BetterAuth) and Leaderboard queries.
- **`apps/game-server`**: Uses Drizzle ORM (or raw D1 SQL) bound to the `DB` binding inside the Durable Object to persist finished game records.
- Both use the shared schema from `packages/db`.
