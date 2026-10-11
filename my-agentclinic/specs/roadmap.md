# Roadmap

Very small phases, skeleton first. Each phase should be completable in one short session, leave the app running, and include Vitest tests. A phase is complete only when `npm run validate` passes (see `specs/tech-stack.md`).

Every page a phase adds must be responsive and pass the responsive checks in `specs/tech-stack.md` before the phase is complete.

## Phase 0 — Foundation ✅ Complete
- [x] **0.1** Add Hono + `tsx`; serve "Welcome to AgentClinic" at `/`.
- [x] **0.2** Add Vitest with one test for the home route.
- [x] **0.3** Base layout (header, nav, footer) using Hono JSX.
- [x] **0.4** Global stylesheet: colors, typography, responsive container.
- [x] **0.5** Minimal AgentClinic home page (hero, tagline, audience cards).

## Phase 1 — Data foundation (manual browser checks pending)
- [x] **1.1** Add SQLite (`better-sqlite3`) with a DB connection module.
- [x] **1.2** Simple migration runner and first empty migration.
- [x] **1.3** Seed script hook (no data yet).
- [x] **1.4** Adopt PicoCSS as the styling base.

## Phase 2 — Agents, ailments, therapies, appointments
- [ ] **2.1** `agents` table + seed a few playful agents.
- [ ] **2.2** Agents list page.
- [ ] **2.3** Agent detail page.
- [ ] **2.4** `ailments` table + seed (e.g. "Prompt fatigue", "Context-window claustrophobia").
- [ ] **2.5** Ailments list page.
- [ ] **2.6** Link ailments to agents; show them on the agent detail page.
- [ ] **2.7** `therapies` table + seed.
- [ ] **2.8** Therapies list page.
- [ ] **2.9** Map therapies to the ailments they treat; show on ailment pages.
- [ ] **2.10** `appointments` table (agent, therapy, time, status).
- [ ] **2.11** Appointments list page.
- [ ] **2.12** Booking form (server-rendered, validated).
- [ ] **2.13** Cancel / reschedule an appointment.

## Phase 3 — Dashboard
- [ ] **3.1** Staff dashboard: counts of agents, ailments, upcoming appointments.
- [ ] **3.2** Agent dashboard: an agent's own ailments and appointments.

## Phase 4 — Polish
- [ ] **4.1** Visual polish and empty/error states.
- [ ] **4.2** Accessibility pass (semantic HTML, contrast, keyboard nav).
- [ ] **4.3** Cross-browser responsive review (each phase already checks its own pages).
