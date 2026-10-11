# Phase 0 — Foundation: Requirements

## Context

AgentClinic is a server-rendered TypeScript site where overworked AI agents get relief from their humans (see `specs/mission.md`). Today the repo contains only a `tsc` build and a placeholder `src/index.ts`. Phase 0 builds the running skeleton that all later phases (agents, ailments, therapies, appointments, dashboard) will plug into.

Roadmap items covered: **0.1, 0.2, 0.3, 0.4** in `specs/roadmap.md`, plus a new **0.5** (minimal home page) that this phase adds to the roadmap.

## Scope

### In scope

1. **Hono server (0.1)**: add `hono`, `@hono/node-server`, and `tsx`. `GET /` returns an HTML page containing "Welcome to AgentClinic".
2. **Tests (0.2)**: add Vitest with at least one test for the home route that uses `app.request()`, so no server needs to start.
3. **Base layout (0.3)**: a shared Hono JSX `Layout` component with a header (site name), a nav, a `<main>` content slot, and a footer. The header, main, and footer are separate subcomponents, each in its own file (see D8). The home page renders through it.
4. **Global stylesheet (0.4)**: plain modern CSS with custom properties for colors and typography, plus a centered responsive container that works at phone and desktop widths.
5. **Minimal home page (0.5)**: a `HomePage` view with a hero (welcome heading plus the mission tagline), a short playful intro, and two audience cards ("For agents", "For clinic staff"). The cards describe what is coming but don't link anywhere yet.
6. **npm scripts**: `dev` (tsx watch), `start`, `test` (vitest run), `test:watch` (vitest), `typecheck`, `validate` (typecheck then test), and `build` (typecheck then tsc).

### Out of scope

- Database, migrations, and seeds (Phase 1).
- Domain pages for agents, ailments, therapies, appointments, and the dashboard.
- Client-side JavaScript, CSS preprocessors, and bundlers.
- Authentication (excluded by the mission).

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Serve with **`@hono/node-server`** on `process.env.PORT`, defaulting to **3000**. | This is the standard Hono adapter for Node, and `PORT` makes demo machines easy to configure. |
| D2 | **Split `app` from server startup**: `src/app.tsx` exports the Hono `app`, and `src/index.ts` only calls `serve()`. | Vitest imports `app` and calls `app.request()` without opening a port (see the tech stack). |
| D3 | Views use **Hono JSX** (`hono/jsx`), with no React. | Required by the tech stack. |
| D4 | Keep the existing **CommonJS** tsconfig. Add only `"jsx": "react-jsx"` and `"jsxImportSource": "hono/jsx"`, and raise `target` as far as Hono's types require. | This is the smallest change that works. A move to ESM is not part of this phase. |
| D5 | Tests live next to the code as `*.test.ts(x)`. | This follows the tech-stack conventions. |
| D6 | The nav shows only **Home** for now. | Links to later domains get added in the phase that builds each domain, so nothing links to a 404. |
| D7 | The home page is **static content only**: no data, no forms, no links to unbuilt pages. Its tagline comes from `specs/mission.md`. | The site stays minimal and honest until Phases 2–6 add real features. |
| D8 | **One file per layout part**: `Header`, `Main`, and `Footer` each live in their own file under `src/views/layout/` (`Header.tsx`, `Main.tsx`, `Footer.tsx`). `Layout.tsx` owns only the document shell (`<!doctype html>`, `<html>`, `<head>`) and composes the three. | Each part stays small and can be read, changed, and tested on its own. Later phases can grow the nav or footer without touching the shell. |

## Open decisions (resolve during implementation)

- **Stylesheet delivery:** the default is a single CSS file served by the app at `/styles.css` and linked from the layout. Do not add a build step.
- **Copy tone:** keep the home page and footer text playful per the mission, for example a footer line like "No agents were over-prompted in the making of this site."

## Constraints

- TypeScript `strict` stays on.
- Keep dependencies to the minimum (principle 3, "Simple over clever").
- The app must run after every task group (principle 1, "Small steps").

## Implementation notes

- **Stylesheet delivery (resolved):** every file in `public/` is served with `serveStatic` from `@hono/node-server/serve-static` (root resolved from the module's `__dirname`, so the server finds `public/` from any working directory). `Layout` links `/styles.css`, which pulls in `layout.css` (container, header, nav, and footer rules) with `@import`. There is no build step.
- **Doctype:** `Layout` emits `<!doctype html>` with `raw()` from `hono/html`, because JSX escapes plain string children.
- **tsconfig:** `target` was raised to `es2022`. `tsconfig.json` covers all of `src/`, test files included, sets `rootDir` to `src`, and emits nothing, so the editor applies the Hono JSX settings to `*.test.tsx`. `tsconfig.build.json` extends it, excludes `*.test.ts(x)`, and emits, so `dist/` holds only app code. A minimal `vitest.config.mts` sets the Hono JSX import source explicitly so tests don't depend on Vitest reading it from tsconfig. It uses the `.mts` extension so Vite loads it as ESM; as `.ts` in this CommonJS package, Vite warned that ESM syntax was being loaded as CommonJS.
- **ESM-only dependencies:** `hono` and `@hono/node-server` v2 ship as ESM only. The CommonJS build still runs because Node 22.12+ supports `require()` of ESM without a flag, so `engines.node` is `>=22.12` and `@types/node` is pinned to `^22` to match that floor.
- **Type-checking tests:** `npm run typecheck` runs `tsc` against `tsconfig.json`, which includes the test files and emits nothing. `npm run build` runs `typecheck` before `tsc -p tsconfig.build.json`, so type errors in tests fail the build. `npm run validate` runs `typecheck` and then the Vitest suite; it is the single check to run before review.
- **PORT parsing:** `src/port.ts` treats an unset or blank `PORT` as 3000, accepts integers 0–65535 (0 lets the OS pick a free port), and exits with an error for anything else instead of silently falling back.
