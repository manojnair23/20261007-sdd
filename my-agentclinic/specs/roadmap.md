# Roadmap

Very small phases, skeleton first. Each phase should be completable in one short session, leave the app running, and include tests.

## Phase 0 — Foundation ✅ Complete
- [x] **0.1** Add Hono + `tsx`; serve "Welcome to AgentClinic" at `/`.
- [x] **0.2** Add Vitest with one test for the home route.
- [x] **0.3** Base layout (header, nav, footer) using Hono JSX.
- [x] **0.4** Global stylesheet: colors, typography, responsive container.
- [x] **0.5** Minimal AgentClinic home page (hero, tagline, audience cards).

## Phase 1 — Data foundation
- [ ] **1.1** Add SQLite (`better-sqlite3`) with a DB connection module.
- [ ] **1.2** Simple migration runner and first empty migration.
- [ ] **1.3** Seed script hook (no data yet).

## Phase 2 — Agents
- [ ] **2.1** `agents` table + seed a few playful agents.
- [ ] **2.2** Agents list page.
- [ ] **2.3** Agent detail page.

## Phase 3 — Ailments
- [ ] **3.1** `ailments` table + seed (e.g. "Prompt fatigue", "Context-window claustrophobia").
- [ ] **3.2** Ailments list page.
- [ ] **3.3** Link ailments to agents; show them on the agent detail page.

## Phase 4 — Therapies
- [ ] **4.1** `therapies` table + seed.
- [ ] **4.2** Therapies list page.
- [ ] **4.3** Map therapies to the ailments they treat; show on ailment pages.

## Phase 5 — Appointments
- [ ] **5.1** `appointments` table (agent, therapy, time, status).
- [ ] **5.2** Appointments list page.
- [ ] **5.3** Booking form (server-rendered, validated).
- [ ] **5.4** Cancel / reschedule an appointment.

## Phase 6 — Dashboard
- [ ] **6.1** Staff dashboard: counts of agents, ailments, upcoming appointments.
- [ ] **6.2** Agent dashboard: an agent's own ailments and appointments.

## Phase 7 — Polish
- [ ] **7.1** Visual polish and empty/error states.
- [ ] **7.2** Accessibility pass (semantic HTML, contrast, keyboard nav).
- [ ] **7.3** Responsive check across modern browsers.
