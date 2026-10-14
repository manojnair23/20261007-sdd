# Roadmap

Very small phases, in order. Each phase gets its own spec folder (`specs/YYYY-MM-DD-<phase>/` with `requirements.md`, `plan.md`, and `validation.md`) before any code is written. A phase is complete only when `npm run validate` passes and its manual browser checks are ticked.

Legend: ✅ done · ⬜ to do

## Phase 0 — Foundation ✅

- ✅ 0.1 Hono server on Node with strict TypeScript, and `PORT` validation
- ✅ 0.2 A shared layout (Header, Main, Footer) and a global stylesheet
- ✅ 0.3 A home page with a hero and audience cards
- ✅ 0.4 Vitest with `npm run validate` (typecheck, then tests)
- ✅ 0.5 A responsive baseline: viewport meta, 44px tap targets, word wrapping

## Phase 1 — Data foundation ✅

- ✅ 1.1 SQLite via `better-sqlite3` and `DB_PATH`
- ✅ 1.2 An ordered SQL migration runner (on startup and with `npm run db:migrate`)
- ✅ 1.3 A seed hook (`npm run db:seed`)
- ✅ 1.4 PicoCSS as the styling base, with the brand palette on Pico variables

## Phase 2 — Agents, ailments, therapies, appointments ✅

- ✅ 2.1 `createApp({ db, now })` so tests use an in-memory database and a fixed clock
- ✅ 2.2 Agents: table, playful seeds, list page, detail page
- ✅ 2.3 Ailments: table, agent↔ailment mapping, list page, detail page with affected agents
- ✅ 2.4 Therapies: table, ailment↔therapy mapping, list page, therapies shown on each ailment
- ✅ 2.5 Appointments: table and list page (Upcoming, Past, Cancelled)
- ✅ 2.6 A booking form with server validation (future, 15-minute slots, 09:00–17:00, no overlaps for the agent), with recommended therapies listed first
- ✅ 2.7 Reschedule and cancel with plain HTML forms (303 / 400 / 409)
- ✅ 2.8 `db:seed` resets the demo, with a `--force` guard

## Phase 3 — Dashboards ✅

- ✅ 3.1 Staff dashboard: counts, the number of upcoming appointments, the next few appointments
- ✅ 3.2 Per-agent dashboard: ailments, upcoming appointments, past and cancelled appointments

## Phase 4 — Polish ✅

- ✅ 4.1 Empty states for every list, and friendly 404 and 500 pages
- ✅ 4.2 An accessibility pass and an automated accessibility sweep over every page
- ✅ 4.3 A responsive review and a crawler test for internal links
- ✅ 4.4 An orange and black colour scheme with contrast-checked text colours

## Phase 5 — Linting and formatting ✅

- ✅ 5.1 Add ESLint (flat config, `typescript-eslint`) and `npm run lint`; fix or justify every finding
- ✅ 5.2 Add Prettier with a `.prettierrc` that matches the current style, and `npm run format`
- ✅ 5.3 Format the whole codebase in one separate commit, with no other changes
- ✅ 5.4 `npm run validate` becomes typecheck → lint → test; update the README

## Phase 6 — Staff CRUD ⬜

Each item is one small slice: data-layer function, route, view, and tests. Forms use POST-Redirect-GET and the validation and accessibility patterns from Phase 2.

- ⬜ 6.1 CSRF protection (Hono `csrf()`) on every POST, with a test that a cross-origin post is rejected
- ⬜ 6.2 A shared validation and error-summary pattern for catalog forms (taken from the booking form)
- ⬜ 6.3 Agents: create
- ⬜ 6.4 Agents: edit (name, model, bio)
- ⬜ 6.5 Agents: assign and unassign ailments
- ⬜ 6.6 Agents: delete, with a confirmation page, blocked when the agent has upcoming appointments (409)
- ⬜ 6.7 Ailments: create and edit
- ⬜ 6.8 Ailments: link and unlink therapies
- ⬜ 6.9 Ailments: delete, with a confirmation page
- ⬜ 6.10 Therapies: create and edit (name, description, duration > 0)
- ⬜ 6.11 Therapies: delete, with a confirmation page, blocked when the therapy has upcoming appointments (409)
- ⬜ 6.12 Notices for created, updated, and deleted records, plus "Manage" links from the staff dashboard
- ⬜ 6.13 Seed reset and the accessibility and link-crawler sweeps cover every new page

## Later (unscheduled)

These came up but aren't committed to yet. Each would become its own small phase:

- Browser end-to-end tests (Playwright) at phone and desktop widths
- CI that runs `npm run validate` on every push
- Search and filters for appointments, agents, and ailments
- Deployment: a container, a health check, and SQLite backups
- Dark mode and brand assets (favicon, social card)
