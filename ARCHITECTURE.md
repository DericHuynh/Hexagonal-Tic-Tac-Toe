# Hexagonal Tic-Tac-Toe: Architecture & Project Plan

## 1. Overview
This project is a real-time, multiplayer Hexagonal Tic-Tac-Toe game. It is built as an edge-native application leveraging Cloudflare's ecosystem, React 19, and a Turborepo monorepo structure.

## 2. System Architecture

The project follows a "2-App Pattern", separating the frontend (SSR + UI) from the real-time game server (WebSockets + State).

### 2.1 Apps
*   **`apps/web` (Frontend & Web App)**
    *   **Framework:** TanStack Start (React 19) + TanStack Router.
    *   **Styling:** Tailwind CSS v4 + Shadcn UI (`shadcn@rc`).
    *   **Responsibilities:** Server-Side Rendering (SSR), routing, authentication (via BetterAuth), and serving the UI.
    *   **Deployment:** Cloudflare Pages.
    *   **Data Fetching:** Loaders inside TanStack Router and RPC via `createServerFn`.

*   **`apps/game-server` (Real-Time Backend)**
    *   **Framework:** Cloudflare Workers + Durable Objects.
    *   **Responsibilities:** Managing game state, validating moves, and broadcasting updates via WebSockets.
    *   **Deployment:** Cloudflare Worker.

### 2.2 Packages (Shared Code)
*   **`packages/game-core`**
    *   Provides standard game logic: Hexagonal grid math (Axial/Cube coordinates), win-condition validation, and Zod schemas for WebSocket payloads.
    *   Pure TypeScript (no React/CF dependencies).
    *   Used by both `web` (for optimistic UI updates) and `game-server` (for authoritative validation).
*   **`packages/db`**
    *   Database schemas using Drizzle ORM and Cloudflare D1.
    *   Stores users, authentication state (BetterAuth), and match history/leaderboards.
*   **`packages/ui`**
    *   Shared component library with Shadcn UI and `react-hexgrid`.
    *   Visual components are isolated here for testing in Storybook.
*   **`packages/env` (Optional/Shared)**
    *   T3 Env configurations for validating Cloudflare bindings and variables type-safely across apps.

### 2.3 Tooling & Formatting
*   **Biome:** Replaces Prettier and ESLint for blazing-fast linting and formatting across the Turborepo.

---

## 3. Data Flow & Communication

1.  **Authentication & Profile:** Users log in via BetterAuth on `apps/web`. Session data is stored in D1.
2.  **Matchmaking / Joining:** A user creates or joins a game room via a UI interaction backed by TanStack Start's `createServerFn`. This assigns them to a unique Durable Object ID in `apps/game-server`.
3.  **Real-Time Gameplay:**
    *   The `apps/web` client establishes a WebSocket connection to the Durable Object.
    *   Client sends a `PLACE_TOKEN` action (validated locally by `packages/game-core` via optimistic UI).
    *   The Durable Object receives the action, validates it authoritatively using `packages/game-core`, updates its in-memory state, and broadcasts the new state to all connected clients.
4.  **Game End:** Once a win condition is met (checked by the DO), the DO persists the final result to the D1 database and notifies clients.
5.  **Analytics & History:** Clients fetch match history using TanStack Start loaders and `createServerFn` RPC endpoints, which query the D1 database.

---

## 4. Implementation Plan

### Phase 1: Monorepo & Infrastructure Setup
*   Initialize Turborepo with `apps/web` (TanStack Start) and `apps/game-server` (CF Worker).
*   Create packages: `game-core`, `db`, `ui`, `tsconfig`, and `eslint-config`.
*   Set up Cloudflare bindings (`wrangler.toml`) for D1 and Durable Objects locally.

### Phase 2: Core Game Logic (`packages/game-core`)
*   Implement Axial/Cube coordinate system for the hexagonal grid.
*   Write pure functions for checking alignments (win conditions).
*   Define Zod schemas for Game State and WebSocket events (`MoveEvent`, `SyncEvent`, etc.).
*   Write comprehensive Vitest unit tests.

### Phase 3: Database & Auth (`packages/db` & `apps/web`)
*   Define Drizzle schemas for Users, Sessions, and Matches.
*   Implement BetterAuth in `apps/web` with endpoints in `app/routes/api/auth`.
*   Connect `apps/web` Drizzle instance to the D1 binding.

### Phase 4: Shared UI Component Library (`packages/ui`)
*   Set up Tailwind CSS v4 and Shadcn UI components.
*   Create the Hexagonal Grid components (wrapper around `react-hexgrid`).
*   Ensure components use `"use client"` where necessary and test via Storybook.

### Phase 5: Real-Time Server (`apps/game-server`)
*   Implement the `GameSession` Durable Object.
*   Handle Hibernation API / WebSocket upgrades and connection management.
*   Integrate `packages/game-core` for server-side move validation.
*   Persist completed game logs to D1.

### Phase 6: Frontend Integration & Gameplay (`apps/web`)
*   Create TanStack Router pages for lobbies and active game boards.
*   Implement React context/hooks to manage WebSocket state and coordinate optimistic UI updates.
*   Connect user authentication state with gameplay logic.

### Phase 7: Testing & CI/CD
*   Write Playwright E2E tests for the multiplayer synchronization flow.
*   Set up GitHub Actions to run type-checks, Vitest, and Playwright.
*   Configure automated deployment to Cloudflare Pages and Workers.

## 5. Architectural Evaluation
The proposed architecture is highly scalable and well-suited for a real-time multiplayer application.
- **Edge Native:** Durable Objects provide an isolated, inherently single-threaded environment for game state that perfectly avoids race conditions without locking databases.
- **Turborepo & Package Separation:** Decoupling `game-core` ensures that both the client (for optimistic rendering) and the server (for authoritative validation) use exactly the same logic without duplication.
- **Tailwind v4 & React 19:** Utilizing the bleeding edge ensures future-proofing, though caution must be taken around Shadcn UI compatibility, hence the `shadcn@rc` choice.

**Verdict:** The provided architecture is excellent. No fundamental changes are required. The plan above outlines the logical steps to bring this architecture to life.
