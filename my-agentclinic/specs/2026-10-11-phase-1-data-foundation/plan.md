# Phase 1 — Data foundation: Plan

Each group maps to one roadmap item. Group 4 adds a new item, 1.4. At the end of every group, `npm run dev` serves the app and `npm run validate` (typecheck plus the Vitest suite) passes. Groups 1–3 leave the UI unchanged; group 4 restyles it on PicoCSS.

## 1. SQLite connection module (roadmap 1.1)

1. Install `better-sqlite3` as a dependency and `@types/better-sqlite3` as a dev dependency.
2. Add `/data` to `.gitignore`.
3. Create `src/db/connection.ts`:
   - `resolveDbPath(env)` returns `env.DB_PATH` when set and non-blank, otherwise `data/agentclinic.db` resolved from the repo root (via `__dirname`, like `public/`).
   - `openDb(path)` creates the parent directory if needed (skipped for `:memory:`), opens the database, runs `PRAGMA foreign_keys = ON`, and sets `PRAGMA journal_mode = WAL` for file databases. Returns the typed `Database` instance.
4. Create `src/db/connection.test.ts`: `openDb(':memory:')` answers `SELECT 1`, has foreign keys on, and `resolveDbPath` honors `DB_PATH` and falls back to the default.

## 2. Migration runner and first migration (roadmap 1.2)

1. Create `migrations/0001_init.sql` containing only a comment (intentionally empty).
2. Create `src/db/migrate.ts` exporting `runMigrations(db, dir = <repo>/migrations)`:
   - create `schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)` if missing;
   - list `*.sql` files in `dir`, sort by filename, and skip those already recorded;
   - apply each pending file with `db.exec` inside a `db.transaction`, inserting its row in the same transaction;
   - on failure, throw an error that names the file (the transaction rolls back);
   - return the list of filenames applied in this run.
3. Create `src/db/migrate.test.ts` using `:memory:` and fixture folders under `src/db/__fixtures__/`:
   - applies files in filename order and records each in `schema_migrations`;
   - a second run applies nothing;
   - a broken migration throws with its filename, leaves no partial schema, and is not recorded, while earlier ones stay applied;
   - the real `migrations/` folder applies cleanly (`0001_init.sql` is recorded).
4. Wire startup in `src/index.ts`: `openDb(resolveDbPath(process.env))`, then `runMigrations(db)`, log how many migrations were applied, then `serve()`.
5. Make sure `tsc -p tsconfig.build.json` excludes the fixture folder, and that the compiled `dist/db/migrate.js` still finds `migrations/` at the repo root.

## 3. Seed hook and CLI scripts (roadmap 1.3)

1. Create `src/db/seed.ts` exporting `type Seeder = (db: Database) => void`, an empty `seeders: Seeder[]` list, and `runSeed(db, list = seeders)` that runs each seeder in order inside one transaction and returns how many ran.
2. Create `src/db/seed.test.ts`: the default list runs with no error and writes nothing; a list of test seeders runs in order; a throwing seeder rolls back the writes of earlier seeders in the same run.
3. Create `src/db/cli.ts`, taking `migrate` or `seed` as its argument. Both open the DB from `resolveDbPath`; `seed` runs migrations first. It prints what happened, closes the DB, and exits non-zero with a usage message on an unknown command.
4. Add npm scripts: `"db:migrate": "tsx src/db/cli.ts migrate"` and `"db:seed": "tsx src/db/cli.ts seed"`.

## 4. Adopt PicoCSS (roadmap 1.4, new)

1. Install `@picocss/pico` (v2) as a dependency.
2. Serve `node_modules/@picocss/pico/css/pico.min.css` at `/pico.min.css` with a `text/css` content type, resolving the path from the installed package so it works from `src/` and `dist/`.
3. In `Layout`, add `data-theme="light"` to `<html>` and link `/pico.min.css` before `/styles.css`.
4. Rework `public/styles.css`:
   - map the existing palette and font stacks onto Pico variables (`--pico-primary`, `--pico-primary-hover`, `--pico-background-color`, `--pico-color`, `--pico-muted-color`, `--pico-muted-border-color`, `--pico-font-family`, …) under `:root` / `[data-theme="light"]`;
   - delete the reset, base typography, and link rules that Pico covers;
   - keep the hero, intro, and audience-card rules, slimmed to what Pico doesn't already provide. Try Pico `<article>` for the cards (see the open decision).
5. Rework `public/layout.css`: drop the custom `.container` rules in favor of Pico's `.container`, and keep the branded header bar, nav, and footer tweaks. Nav links stay at least 44px tall.
6. Update tests:
   - `src/app.test.ts`: `GET /pico.min.css` returns 200 with `text/css`, and the home `<head>` links `/pico.min.css` before `/styles.css`;
   - `src/views/Layout.test.tsx`: `<html>` has `data-theme="light"`;
   - adjust any Phase 0 assertions that depended on removed classes.
7. Update `specs/tech-stack.md`: change the Styling row to "PicoCSS v2 (served locally) plus small custom CSS on Pico variables", and note Pico in the Responsive design section.
8. Check by hand at ~320px, ~375px, and ~1280px: brand colors, header bar, two-column to one-column cards, no horizontal scroll.

## 5. Wrap-up

1. Add item **1.4** "Adopt PicoCSS as the styling base" to Phase 1 in `specs/roadmap.md`, tick 1.1–1.4, and mark Phase 1 complete.
2. Add a `CHANGELOG.md` entry for Phase 1.
3. Record anything that changed from `requirements.md` (resolved open decisions, install quirks) under an "Implementation notes" section in that file.
4. Run `npm run validate`, then everything else in `validation.md`, and confirm it passes.
