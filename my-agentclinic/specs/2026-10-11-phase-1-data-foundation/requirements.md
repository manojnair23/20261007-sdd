# Phase 1 — Data foundation: Requirements

## Context

AgentClinic is a server-rendered TypeScript site where overworked AI agents get relief from their humans (see `specs/mission.md`). Phase 0 left a running Hono app with a layout, a stylesheet, a home page, and a Vitest suite behind `npm run validate`. There is no persistence yet.

Phase 1 adds the data plumbing that Phase 2 (agents, ailments, therapies, appointments) builds on: a SQLite connection, a migration runner, and a seed hook. It also moves the styling onto **PicoCSS**, so the many list pages, detail pages, and forms in Phase 2 start from good semantic defaults instead of hand-written CSS. It adds no tables with data and no new pages.

Roadmap items covered: **1.1, 1.2, 1.3** in `specs/roadmap.md`, plus a new **1.4** (adopt PicoCSS) that this phase adds to the roadmap.

## Scope

### In scope

1. **DB connection (1.1)**: add `better-sqlite3` (and `@types/better-sqlite3`). A small `src/db/connection.ts` module exports `openDb(path)`, which opens the database, enables foreign keys, and uses WAL journal mode for file databases.
2. **Migration runner (1.2)**: ordered SQL files in `migrations/` (`0001_init.sql`, `0002_….sql`, …). `runMigrations(db)` applies pending files in filename order, each inside a transaction, and records them in a `schema_migrations` tracking table. The first migration, `0001_init.sql`, is intentionally empty (a comment only).
3. **Seed hook (1.3)**: `runSeed(db)` runs a list of seeders inside one transaction. The list is empty in this phase; Phase 2 adds the playful agents, ailments, and therapies.
4. **Startup wiring**: `src/index.ts` opens the database and runs pending migrations before calling `serve()`. Seeding never runs on startup.
5. **npm scripts**: `db:migrate` runs pending migrations; `db:seed` runs the seed hook (migrating first, so it never seeds a stale schema).
6. **Tests**: Vitest coverage for the connection, the runner, and the seed hook, all against `:memory:` databases.
7. **PicoCSS (1.4)**: add `@picocss/pico` and serve its `pico.min.css` from the app at `/pico.min.css`. `Layout` links it before `/styles.css`. The current palette moves onto Pico's `--pico-*` custom properties, rules Pico already covers (reset, typography, links, container) are deleted, and only brand tweaks remain (header bar, hero, audience cards). `specs/tech-stack.md` is updated to name Pico as the styling base.

### Out of scope

- Domain tables, seed data, and pages (Phase 2).
- Down/rollback migrations, migration generators, and an ORM (tech stack: "No ORM in early phases").
- Wiring the database into routes; no route reads the DB in this phase.
- A redesign. The home page keeps its content, structure, and brand colors; small visual shifts from Pico's defaults (spacing, type scale) are fine.
- Pico's dark theme, its JS-free modal/dropdown components, and any CDN delivery.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Use **`better-sqlite3`** with its synchronous API. | Required by `specs/tech-stack.md`; sync calls keep the data layer and tests simple. |
| D2 | The database file defaults to **`data/agentclinic.db`**, overridable with the **`DB_PATH`** env var. `data/` is gitignored and created on demand. | Keeps generated files out of the repo root and out of git; `DB_PATH` mirrors how `PORT` configures demo machines. |
| D3 | **Tests use `:memory:`**, a fresh database per test. | Tests stay fast, isolated, and never touch disk. |
| D4 | **Migrations run automatically at startup** and via `npm run db:migrate`. | `npm run dev` just works on a fresh clone, and the script is there for explicit runs. |
| D5 | **Seeding is explicit only** (`npm run db:seed`), never on startup. | Seeding is a deliberate act; it must not surprise anyone by writing data on boot. |
| D6 | Migrations are **forward-only, plain `.sql` files** named `NNNN_description.sql`, applied in filename order and tracked by filename in `schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`. | "Schema changes are applied by simple, ordered SQL migration files" (tech stack). Zero-padded names sort correctly. |
| D7 | Each migration runs **in its own transaction** together with its `schema_migrations` insert. A failing migration rolls back and stops the run with an error naming the file. | The schema is never left half-applied, and the next run retries the same file. |
| D8 | `migrations/` lives at the **repo root** and is resolved from the module's `__dirname`, like `public/`. `runMigrations` accepts an optional directory so tests can point at fixture folders. | Works from `src/` (tsx) and `dist/` (node), and from any working directory. |
| D9 | DB code lives in **`src/db/`** (`connection.ts`, `migrate.ts`, `seed.ts`, `cli.ts`). Route handlers never contain SQL. | "Database access goes through a small typed data layer; no raw SQL in route handlers" (tech stack). |
| D10 | Adopt **PicoCSS v2** (`@picocss/pico`) as the styling base, using the standard (class-light) build, not the classless one. | Semantic defaults for tables, forms, and articles cover most of Phase 2's UI with little custom CSS, and the standard build still allows `.container`, `.grid`, and a few helper classes. |
| D11 | **Install from npm and serve locally**; no CDN. The file is read from `node_modules` and served at `/pico.min.css` with a `text/css` content type. | Demos at conference booths must work offline, and the version stays pinned in `package-lock.json`. |
| D12 | **Keep the brand through Pico variables**: map the existing palette (primary `#2a6f97`, accent `#e07a5f`, background, text, muted, border) and font stacks onto `--pico-*` properties in `styles.css`. `layout.css` keeps only header, nav, and footer tweaks. | The site keeps its identity while Pico handles the base. Overrides live in one place. |
| D13 | **Pin the light theme** with `data-theme="light"` on `<html>`. | The brand palette is light-only today; dark mode can be designed later in the Polish phase. |
| D14 | The responsive rules in `specs/tech-stack.md` still apply on top of Pico. In particular, nav links stay at least 44px tall and nothing scrolls sideways at ~320px. | Pico is responsive by default, but its defaults don't guarantee the project's tap-target and narrow-width rules. |

## Open decisions (resolve during implementation)

- **How routes get the DB (for Phase 2):** a shared module-level instance vs. passing `db` into an app factory. Not needed until a route reads data; note the choice in Phase 2.
- **Seeder idempotence:** whether Phase 2 seeders clear-and-insert or upsert. The hook only needs to run seeders in order inside a transaction.
- **Native build on Windows:** `better-sqlite3` ships prebuilt binaries for current Node LTS. If install falls back to a source build, note the fix here.
- **Serving Pico:** a small route that reads `pico.min.css` once at startup vs. a second `serveStatic` rooted at Pico's `css/` folder. Either way, resolve the path from the installed package, not from the working directory.
- **Card markup:** whether the audience cards become Pico `<article>` elements (and drop the `.card` class) or keep `.card` with Pico variables. Prefer `<article>` if the look holds up.

## Constraints

- TypeScript `strict` stays on.
- Only `better-sqlite3`, its types, and `@picocss/pico` are added (principle 3, "Simple over clever").
- The app runs after every task group (principle 1, "Small steps").
- Pages work without JavaScript; Pico adds none.
- The restyled home page passes the responsive checks in `specs/tech-stack.md` at ~320px, ~375px, and ~1280px.

## Implementation notes

- **Native build on Windows (resolved):** `better-sqlite3` 13 loaded on Node 24 without a source build. The installed npm gates install scripts (`npm install-scripts ls` lists `better-sqlite3` and `esbuild` as not yet approved), but neither needed its script to work here. If a fresh install fails to load the native module, run `npm install-scripts approve better-sqlite3` and reinstall.
- **Serving Pico (resolved):** a single route reads `pico.min.css` once at startup, resolved with `require.resolve('@picocss/pico/css/pico.min.css')`, and serves it at `/pico.min.css` as `text/css`. This works from `src/`, from `dist/`, and from any working directory.
- **Card markup (resolved):** the audience cards are plain Pico `<article>` elements. The `.card` class is gone, and `.cards > article` adds only the brand top border.
- **Theme overrides:** brand variables live under `:root[data-theme="light"]`. That matches the specificity of Pico's `:root:not([data-theme=dark])` light-theme selector, and `styles.css` loads after Pico, so the brand wins.
- **Container:** Pico's `.container` replaced the custom one, so the content is wider at desktop widths (up to 1200px at ≥1280px, where it used to be 64rem).
- **Migration fixtures:** these are `.sql` files under `src/db/__fixtures__/`. `tsc` never emits them, so `dist/` stays clean without a build exclude.
