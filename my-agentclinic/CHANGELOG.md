# Changelog

All notable changes to this project, newest first.

## 2026-10-11
- Mark Phase 1 (Data foundation) complete in the roadmap after its manual browser checks passed
- Fix Phase 1 review findings: case-insensitive `.sql` matching that skips folders, a real sort test, CLI tests in a child process, clean CLI errors, closing the DB on shutdown, a readable tagline accent, visible focus outlines, and spec fixes (resolved and deferred decisions, Phase 1 not marked complete until the browser checks pass)
- Build Phase 1: SQLite via `better-sqlite3`, an ordered SQL migration runner (run on startup and by `npm run db:migrate`), a seed hook (`npm run db:seed`), and PicoCSS as the styling base with the brand palette on Pico variables
- Write the Phase 1 (Data foundation) requirements, plan, and validation specs
- Combine roadmap Phases 2–5 (Agents, Ailments, Therapies, Appointments) into a single Phase 2, and renumber Dashboard and Polish to Phases 3 and 4
- Require responsive design in the mission, tech stack, roadmap, and Phase 0 specs; add 44px nav tap targets, wrapping for long words, and a viewport meta tag test
- Add `npm run validate` (typecheck, then the Vitest suite) as the single check before review, and update the specs to use it
- Add a HomePage test suite
- Split tsconfig so the editor typechecks test files, with a separate build config that excludes them
- Rename the Vitest config to `vitest.config.mts` to fix an ESM loader warning
- Set the project's default Claude Code permission mode to manual

## 2026-10-10
- Split the layout into Header, Main, and Footer components, move layout styles into `layout.css`, and serve every file in `public/`
- Validate `PORT` strictly (integers 0–65535, default 3000) and typecheck test files as part of the build
- Fix review findings: serve `public/` from any working directory, require Node 22.12+, pin `@types/node` to ^22, and make the stylesheet test less brittle
- Mark Phase 0 (Foundation) complete in the roadmap

## 2026-10-08
- Build Phase 0: Hono server, shared layout, global stylesheet, home page with hero and audience cards, and Vitest tests for the home route

## 2026-10-07
- Add the AgentClinic project with its mission, tech stack, and roadmap
- Write the Phase 0 (Foundation) requirements, plan, and validation specs
