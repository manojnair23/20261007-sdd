# Tech Stack

## Summary

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Mary's requirement; type safety across server and views |
| Runtime | Node.js (LTS) | Popular, stable, already used by the repo |
| Web framework | [Hono](https://hono.dev) | Small, fast, modern, first-class TypeScript |
| Rendering | Server-side rendering with Hono JSX | No client framework needed; fast pages, simple mental model |
| Database | SQLite via `better-sqlite3` | Zero-ops, file-based, perfect for a small app and demos |
| Styling | Plain modern CSS (custom properties, grid, flexbox) | Attractive and responsive without a build-heavy toolchain |
| Interactivity | Progressive enhancement; minimal vanilla JS only where needed | Pages work without JS |
| Testing / validation | Vitest | Fast, TypeScript-native; the gate for validating every change |
| Dev runner | `tsx` (watch mode) | Run TypeScript directly during development |
| Build | `tsc` | Already configured in the repo |

## Server-side TypeScript

All application logic runs on the server in TypeScript. Pages are rendered on the server and sent as HTML; the browser receives little or no JavaScript.

### Framework recommendation: Hono

We recommend **Hono** as the web framework:

- **TypeScript-first:** typed routes, params, and context out of the box.
- **Built-in JSX:** server-side rendering of typed components without React or a bundler.
- **Small and fast:** few dependencies, quick startup, easy to understand in a demo.
- **Popular and portable:** widely adopted; runs on Node today and on other runtimes (Bun, Deno, edge) if needed later.
- **Easy to test:** `app.request()` lets Vitest exercise routes without starting a server.

### Alternatives considered

| Framework | Why not (for now) |
|---|---|
| Express | Very popular, but TypeScript types are bolted on and it lacks built-in rendering |
| Fastify | Strong and fast, but more ceremony (plugins, schemas) than this app needs |
| Next.js | Powerful, but brings React, a client bundle, and more complexity than a server-rendered app needs |
| NestJS | Enterprise-style structure; too heavy for small, incremental phases |

## Conventions

- Source lives in `src/`; tests live alongside code as `*.test.ts`.
- Routes grouped by domain: `agents`, `ailments`, `therapies`, `appointments`, `dashboard`.
- Database access goes through a small typed data layer; no raw SQL in route handlers.
- Schema changes are applied by simple, ordered SQL migration files.
- Seed data is playful and lives in a seed script.

## Validation

Vitest tests are how we validate that a change works. A phase or feature is not done until its behaviour is covered by Vitest tests and they pass.

- Run `npm run validate` to typecheck and then run the full Vitest suite once. This is the single command to run before review.
- `npm test` runs the suite once without typechecking; `npm run test:watch` re-runs it on file changes during development.
- Route behaviour is tested through `app.request()`, so validation needs no running server.

## Browser support

Latest versions of evergreen browsers (Chrome, Edge, Firefox, Safari). No IE or legacy polyfills.

## Non-goals

- No SPA framework (React/Vue) unless a later phase clearly needs it.
- No ORM in early phases; revisit if the data layer grows.
