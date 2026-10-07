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
| Testing | Vitest | Fast, TypeScript-native |
| Dev runner | `tsx` (watch mode) | Run TypeScript directly during development |
| Build | `tsc` | Already configured in the repo |

## Conventions

- Source lives in `src/`; tests live alongside code as `*.test.ts`.
- Routes grouped by domain: `agents`, `ailments`, `therapies`, `appointments`, `dashboard`.
- Database access goes through a small typed data layer; no raw SQL in route handlers.
- Schema changes are applied by simple, ordered SQL migration files.
- Seed data is playful and lives in a seed script.

## Browser support

Latest versions of evergreen browsers (Chrome, Edge, Firefox, Safari). No IE or legacy polyfills.

## Non-goals

- No SPA framework (React/Vue) unless a later phase clearly needs it.
- No ORM in early phases; revisit if the data layer grows.
