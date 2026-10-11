# Phase 1 — Data foundation: Validation

The `phase-1-data-foundation` branch can be merged only when **every** check below passes.

## 1. Automated tests: `npm run validate`

Typecheck passes, Vitest exits 0, all Phase 0 tests still pass, and the following tests exist and pass. Every DB test uses a `:memory:` database.

### Connection
- [x] `openDb(':memory:')` returns a database that answers `SELECT 1`.
- [x] Foreign keys are enabled (`PRAGMA foreign_keys` returns 1).
- [x] `resolveDbPath` returns `DB_PATH` when set, and `data/agentclinic.db` when unset or blank.

### Migration runner
- [x] `pendingMigrations` sorts unsorted filenames, skips applied and non-`.sql` files, and matches `.SQL` in any case.
- [x] Pending migrations apply in filename order, and each is recorded in `schema_migrations`.
- [x] Running the migrations a second time applies nothing and changes nothing.
- [x] A failing migration throws an error that names the file, leaves no partial schema behind, and is not recorded; earlier migrations stay applied.
- [x] The real `migrations/` folder applies cleanly, and `0001_init.sql` is recorded.

### Seed hook
- [x] `runSeed` with the default (empty) seeder list runs without error and writes nothing.
- [x] Seeders run in order, and a throwing seeder rolls back the whole seed run.

### PicoCSS
- [x] `GET /pico.min.css` returns **200** with a `text/css` content type.
- [x] The home page `<head>` links `/pico.min.css` before `/styles.css`.
- [x] `<html>` has `data-theme="light"`.
- [x] The Phase 0 home-page tests (tagline, both card headings, exactly one `<h1>`, viewport meta) still pass.

## 2. Manual CLI check

Covered by `src/db/cli.test.ts`, which runs the real CLI with `DB_PATH` pointing at a new temp folder. Also run once by hand against `data/`:

- [x] `npm run db:migrate` creates the database file (and its folder) and reports `0001_init.sql` as applied.
- [x] Running `npm run db:migrate` again reports nothing to apply.
- [x] `npm run db:seed` runs cleanly and reports zero seeders.
- [x] `git status` shows no files under `data/` (the folder is gitignored).
- [x] An unknown command (for example `npx tsx src/db/cli.ts nope`) prints usage and exits non-zero.

## 3. Build and run

- [x] `npm run build` completes with zero errors, `strict: true` still on, and no test or fixture files in `dist/`.
- [x] `npm run dev` and `npm start` both run pending migrations on startup and then serve the home page.
- [x] `npm start` (from `dist/`) serves `/pico.min.css`, so the path isn't tied to `src/` or the working directory.

## 4. Manual browser check (PicoCSS)

- [x] The home page is styled by Pico with the brand palette: blue header bar, accent tagline, and primary-colored links. It does not fall back to Pico's default colors.
- [x] The audience cards sit in two columns at ~1280px and stack into one column at ~375px.
- [x] No horizontal scroll at ~320px, and long text wraps.
- [x] Nav links are at least 44px tall.
- [x] Tabbing shows a visible focus outline on every link: white on the blue header, dark blue on the page.
- [x] The tagline is the darker accent (`#b5462a`) and is easy to read.
- [x] The page stays light even when the OS is set to dark mode.
- [x] No request goes to a CDN (check the browser's Network tab); the page works offline.
- [x] Checked in at least one current evergreen browser.

## 5. Specs kept in sync

- [x] Item **1.4** (adopt PicoCSS) is added to Phase 1 in `specs/roadmap.md`, items **1.1–1.4** are ticked, and Phase 1 is marked complete.
- [x] `specs/tech-stack.md` names PicoCSS as the styling base.
- [x] `public/styles.css` no longer has reset or base-typography rules that duplicate Pico.
- [x] `CHANGELOG.md` has a Phase 1 entry.
- [x] Any change from `requirements.md` (resolved open decisions, install quirks) is noted in that file.

## Definition of done

All boxes above are checked, the app runs, and the branch contains only Phase 1 work plus spec updates.
