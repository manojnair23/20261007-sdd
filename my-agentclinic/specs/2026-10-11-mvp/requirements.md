# MVP — Agents, ailments, therapies, appointments, dashboards, polish: Requirements

## Context

AgentClinic is a server-rendered TypeScript site where overworked AI agents get relief from their humans (see `specs/mission.md`). Phases 0 and 1 left a running Hono app with a shared layout, PicoCSS styling, a home page, SQLite with an ordered migration runner and an empty seed hook, and a Vitest suite behind `npm run validate`.

The MVP finishes every remaining roadmap item, so the mission is met end to end:

- an agent can browse ailments and therapies, then book, reschedule, and cancel appointments;
- clinic staff can see the clinic at a glance on a dashboard and manage the schedule.

Roadmap items covered: **2.1–2.13, 3.1–3.2, 4.1–4.3** in `specs/roadmap.md`.

## Scope

### In scope

1. **Foundations.**
   - Replace the module-level `app` with `createApp({ db, now })`, so routes get the database and tests pass a migrated, seeded `:memory:` database. This was deferred from Phase 1.
   - Make seeding a repeatable demo reset.
   - Grow the nav as each domain lands.
2. **Agents (2.1–2.3).** An `agents` table with playful seeds, a list page, and a detail page.
3. **Ailments (2.4–2.6).** An `ailments` table with seeds and a list page. An ailment detail page shows the agents who have that ailment. Each agent's ailments appear on the agent's detail page.
4. **Therapies (2.7–2.9).** A `therapies` table with seeds and a list page. A mapping says which therapies treat which ailments, and each ailment's page lists the therapies that treat it.
5. **Appointments (2.10–2.13).**
   - An `appointments` table and a list page.
   - A server-rendered, validated booking form.
   - Cancel and reschedule, done with plain HTML forms that need no JavaScript.
6. **Dashboards (3.1–3.2).**
   - A staff dashboard with counts of agents and ailments, the number of upcoming appointments, and the next few appointments.
   - A per-agent dashboard with that agent's ailments, upcoming appointments, and past or cancelled appointments.
7. **Polish (4.1–4.3).**
   - Empty states for every list.
   - A friendly 404 and 500 page.
   - An accessibility pass and a cross-browser responsive review.

### Out of scope

- Staff create, edit, or delete forms for agents, ailments, and therapies. These records are seed data, as the roadmap implies.
- Authentication, accounts, or "logging in as" an agent. These are excluded by the mission. The agent dashboard is reached by URL.
- Payments, email or notifications, and calendar export.
- Time zones. The clinic runs on one local "clinic time" (see D6).
- Client-side JavaScript, a SPA framework, or an ORM (see the tech stack non-goals).
- CSRF protection. Without auth or sessions there is nothing to hijack; revisit when auth arrives.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **`createApp({ db, now })`** in `src/app.tsx` builds the Hono app. `index.ts` passes the real database and `() => new Date()`. Tests use a `testApp()` helper that builds a migrated, seeded `:memory:` database and a fixed clock. | This resolves the Phase 1 deferral. Tests never touch `data/`, and anything that depends on time is deterministic. |
| D2 | **Schema, one migration per domain:** `0002_agents.sql`, `0003_ailments.sql` (with `agent_ailments`), `0004_therapies.sql` (with `ailment_therapies`), `0005_appointments.sql`. All tables use integer primary keys, `NOT NULL` where it applies, `UNIQUE` names, foreign keys with `ON DELETE CASCADE` on the join tables, and `CHECK` constraints. | This follows the vertical slices: each group adds its own migration, and the database enforces integrity. |
| D3 | **Tables:** `agents(id, name, model, bio)`; `ailments(id, name, description)`; `agent_ailments(agent_id, ailment_id)`; `therapies(id, name, description, duration_minutes CHECK > 0)`; `ailment_therapies(ailment_id, therapy_id)`; `appointments(id, agent_id, therapy_id, starts_at, status CHECK IN ('scheduled','cancelled'), created_at, updated_at)`. | These are the smallest set of tables that covers every roadmap item. "Completed" isn't stored: a scheduled appointment in the past simply shows as past. |
| D4 | **Data layer per domain** in `src/db/` (`agents.ts`, `ailments.ts`, `therapies.ts`, `appointments.ts`, `dashboard.ts`). These are typed functions that take `db` and return plain row types. Route handlers never contain SQL. | Required by the tech stack ("no raw SQL in route handlers"). |
| D5 | **Routes grouped by domain** in `src/routes/` (`agents.tsx`, `ailments.tsx`, `therapies.tsx`, `appointments.tsx`, `dashboard.tsx`), each mounted by `createApp`. Views live in `src/views/<domain>/`. | This follows the tech stack conventions. |
| D6 | **Clinic time:** `starts_at` is stored as naive local `YYYY-MM-DDTHH:mm` text, which is exactly what `<input type="datetime-local">` submits. "Now" comes from the injected clock and is converted with the same format. Display goes through one `formatSlot()` helper with a fixed `en-US` locale. | There is no time-zone handling and no conversion bugs, and the strings sort and compare correctly as text. Tests stay deterministic. |
| D7 | **Booking rules,** enforced by a validator that the booking and reschedule forms share: <br>• the agent and therapy exist; <br>• `starts_at` is a valid slot in the future; <br>• the minutes fall on a 15-minute boundary; <br>• the appointment falls within clinic hours, 09:00–17:00, ending by 17:00; <br>• it doesn't overlap another *scheduled* appointment for the same agent (using the therapy's duration). | These are realistic, easy to explain in a demo, and easy to test. Any therapy can be booked. Recommended therapies, the ones that treat the agent's ailments, are listed first in the form. |
| D8 | **Forms use POST-Redirect-GET.** <br>• Valid input redirects with **303** to `/appointments?notice=booked\|rescheduled\|cancelled`, which shows a dismissible-free notice. <br>• Invalid input re-renders the form with **400**: submitted values are kept, there's an error summary at the top, and each field gets `aria-invalid` and an `aria-describedby` error message. Nothing is written. <br>• Cancelling or rescheduling an appointment that isn't scheduled, or is in the past, returns **409** with a friendly message. | Works without JS, refreshing the page can't resubmit a form, and the forms are accessible. |
| D9 | **Routes:** `GET /agents`, `/agents/:id`, `/agents/:id/dashboard`; `/ailments`, `/ailments/:id`; `/therapies`; `/appointments`, `GET/POST /appointments/new` (`?agent=&therapy=` prefill), `GET/POST /appointments/:id/reschedule`, `POST /appointments/:id/cancel`; `GET /dashboard`. An unknown or non-numeric `:id` returns **404**. | This covers every roadmap item with conventional URLs. Integer ids keep the routing simple. |
| D10 | **Seeding resets the demo.** `npm run db:seed` deletes all domain rows (child tables first), then inserts the playful agents, ailments, therapies, and mappings, plus a handful of appointments relative to the seed time: two upcoming, one past, one cancelled. It stays explicit and never runs on startup (Phase 1 D5). The CLI prints that it resets data. | This resolves the Phase 1 seeder-idempotence deferral. A demo can always be reset to a known, lively state. |
| D11 | **Nav:** Home, Agents, Ailments, Therapies, Appointments, Dashboard. Each link is added in the group that builds its page (Phase 0 D6), and the current page's link gets `aria-current="page"`. | Nothing links to a 404, and the nav says where you are. |
| D12 | **Errors:** `app.notFound` renders a playful 404 page inside `Layout`, and `app.onError` logs the error and renders a 500 page with no stack trace. Every list has an empty state with a next step, for example "No appointments yet — book one". | Covers 4.1. The tone stays playful, but correctness stays strict (see the mission). |
| D13 | **Pico-first markup:** lists use `<table>` (with `<caption>` and `scope`) or Pico `<article>` cards; forms use Pico's native `<label>`, `<select>`, `<input>`, and `<button>`. The only custom CSS is for layout gaps Pico doesn't cover. | This follows the tech stack (PicoCSS base, semantic HTML) and keeps CSS small. |
| D14 | **Accessibility baseline (4.2):** <br>• exactly one `<h1>` per page; <br>• a skip link to `<main>`; <br>• labelled form fields; <br>• table headers with `scope`; <br>• visible focus; <br>• text contrast of at least 4.5:1; <br>• every action reachable by keyboard. | These are measurable, and the tests check what can be automated. |

## Constraints

- TypeScript `strict` stays on. No new runtime dependencies; validation and date formatting are hand-written (principle 3, "Simple over clever").
- The app runs, and `npm run validate` passes, after every task group (principle 1, "Small steps").
- Every new page is responsive from ~320px to ~1440px with no horizontal scroll, and tap targets are at least 44px (principle 5, "Responsive").
- Pages work with JavaScript disabled.
- Migrations follow the Phase 1 rule: no `BEGIN`/`COMMIT` inside a migration file.

## Open decisions (resolve during implementation)

- **Seed content:** the exact playful names and copy, for example agents like "GPT-Overthinker" and "Captain Hallucination", ailments like "Prompt fatigue" and "Context-window claustrophobia", and therapies like "Token detox" and "Guided temperature reduction". Keep it kind and funny.
- **Appointment list layout:** whether to use one table with a status column, or sections for Upcoming, Past, and Cancelled. Prefer sections if they read better on phones.
- **Therapy detail page:** not on the roadmap. Add one only if the ailment↔therapy links need somewhere to point; otherwise therapies stay a list.
