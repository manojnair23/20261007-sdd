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

- Staff create, edit, or delete forms for agents, ailments, and therapies. These records are seed data, as the roadmap implies. `specs/mission.md` lists this under "Out of scope (for now)".
- Authentication, accounts, or "logging in as" an agent. These are excluded by the mission. An agent's "own" dashboard (roadmap 3.2) is simply `/agents/:id/dashboard`. Anyone can open any agent's dashboard and cancel or reschedule its appointments. That is accepted for the MVP and is listed in `specs/mission.md`.
- Payments, email or notifications, and calendar export.
- Time zones. The clinic runs on one local "clinic time": the server's time zone (see D6).
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
| D6 | **Clinic time:** `starts_at` is stored as naive local `YYYY-MM-DDTHH:mm` text, which is exactly what `<input type="datetime-local">` submits. "Now" comes from the injected clock and is converted with the same format. Display goes through one `formatSlot()` helper with a fixed `en-US` locale. <br>**Clinic time is the server's local time zone.** Set the standard `TZ` environment variable (for example `TZ=Europe/London`) to pin it on hosts that default to UTC. | There is no time-zone handling and no conversion bugs, and the strings sort and compare correctly as text. Tests stay deterministic. |
| D7 | **Booking rules,** enforced by a validator that the booking and reschedule forms share: <br>• the agent and therapy exist; <br>• `starts_at` is a valid slot in the future; <br>• the minutes fall on a 15-minute boundary; <br>• the appointment falls within clinic hours, 09:00–17:00, ending by 17:00. **The clinic is open every day**, weekends included; <br>• it doesn't overlap another *scheduled* appointment for the same agent (using the therapy's duration). <br>**Therapies have unlimited capacity:** different agents may book the same therapy at the same time. Only an agent's own schedule can clash. <br>**Upcoming vs past:** a scheduled appointment is *upcoming* while `starts_at` is after now. From its start time onward, including while it is in progress, it counts as *past* and can no longer be cancelled or rescheduled. | These are realistic, easy to explain in a demo, and easy to test. Booth demos happen on weekends, and there are no therapists to schedule, so neither weekday nor capacity rules are needed. Any therapy can be booked. Recommended therapies, the ones that treat the agent's ailments, are listed first in the form. |
| D8 | **Forms use POST-Redirect-GET.** <br>• Valid input redirects with **303** to `/appointments?notice=booked\|rescheduled\|cancelled`, which shows a short confirmation notice. The notice comes from the query string, so refreshing or bookmarking the page shows it again; that is accepted. <br>• Invalid input re-renders the form with **400**: submitted values are kept, there's an error summary at the top, and each field gets `aria-invalid` and an `aria-describedby` error message. Nothing is written. <br>• Cancelling or rescheduling an appointment that isn't scheduled, or is in the past, returns **409** with a friendly message. | Works without JS, refreshing the page can't resubmit a form, and the forms are accessible. |
| D9 | **Routes:** `GET /agents`, `/agents/:id`, `/agents/:id/dashboard`; `/ailments`, `/ailments/:id`; `/therapies`; `/appointments`, `GET/POST /appointments/new` (`?agent=&therapy=` prefill), `GET/POST /appointments/:id/reschedule`, `POST /appointments/:id/cancel`; `GET /dashboard`. An unknown or non-numeric `:id` returns **404**. | This covers every roadmap item with conventional URLs. Integer ids keep the routing simple. |
| D10 | **Seeding resets the demo.** `npm run db:seed` deletes all domain rows (child tables first), then inserts the playful agents, ailments, therapies, and mappings, plus a handful of appointments relative to the seed time: two upcoming, one past, one cancelled. It stays explicit and never runs on startup (Phase 1 D5). The CLI prints that it resets data. <br>**Guard:** if the database already holds any appointments, `db:seed` refuses, exits non-zero, and explains why, unless it is run with `--force` (`npm run db:seed -- --force`). It seeds an empty or freshly migrated database without asking. | This resolves the Phase 1 seeder-idempotence deferral. A demo can always be reset to a known, lively state, but real bookings can't be wiped by accident. |
| D11 | **Nav:** Home, Agents, Ailments, Therapies, Appointments, Dashboard. Each link is added in the group that builds its page (Phase 0 D6), and the current page's link gets `aria-current="page"`. | Nothing links to a 404, and the nav says where you are. |
| D12 | **Errors:** `app.notFound` renders a playful 404 page inside `Layout`, and `app.onError` logs the error and renders a 500 page with no stack trace. Every list has an empty state with a next step, for example "No appointments yet — book one". | Covers 4.1. The tone stays playful, but correctness stays strict (see the mission). |
| D13 | **Pico-first markup:** lists use `<table>` (with `<caption>` and `scope`) or Pico `<article>` cards; forms use Pico's native `<label>`, `<select>`, `<input>`, and `<button>`. The only custom CSS is for layout gaps Pico doesn't cover. | This follows the tech stack (PicoCSS base, semantic HTML) and keeps CSS small. |
| D14 | **Accessibility baseline (4.2):** <br>• exactly one `<h1>` per page; <br>• a skip link to `<main>`; <br>• labelled form fields; <br>• table headers with `scope`; <br>• visible focus; <br>• text contrast of at least 4.5:1; <br>• every action reachable by keyboard. | These are measurable, and the tests check what can be automated. |
| D15 | **Recommended therapies without JavaScript:** the booking form lists recommended therapies first only when the agent is already known on the server. That means links that prefill `?agent=` (the agent page, the agent dashboard, and the "Try:" therapy links) or a form shown again after a validation error. Choosing an agent in the dropdown does **not** reorder the therapy list, because there is no client-side script. The plain `/appointments/new` form shows one flat list. | Keeps the "pages work without JS" constraint. Every main path into booking already starts from an agent, so the recommendations still show where they matter most. |

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

## Implementation notes

- **Open decisions (resolved):**
  - *Seed content:* 5 agents (GPT-Overthinker, Captain Hallucination, Loopy McRetry, Prompta Vague, Tokenia Tightwad), 6 ailments, and 6 therapies (30, 45, or 60 minutes), with explicit ids so every reset gives the same URLs. The data lives in `src/db/seedData.ts`.
  - *Appointment list layout:* sections for Upcoming, Past, and Cancelled, each its own captioned table. Tables are mobile first: below 40rem each row stacks into a labelled card (`table.stack` with `data-label`), and from 40rem it's a normal table.
  - *Therapy detail page:* not added. Ailment and dashboard links point to `/therapies#therapy-N` anchors, and "Book this therapy" links prefill the booking form.
- **Structure:**
  - `AppDeps` and `nowSlot` live in `src/deps.ts` and are re-exported from `src/app.tsx`.
  - Routes are in `src/routes/`, data access in `src/db/`, and the booking rules in `src/appointments/validate.ts`.
  - `src/test/testApp.ts` (with `get` and `post` helpers) is excluded from the build in `tsconfig.build.json`.
- **Seeding:** `Seeder` is now `(db, now) => void`, and `runSeed(db, { now, list })` takes an options object. The default list is `[resetDemo, seedCatalog, seedAppointments]`, so a custom list in a test never wipes anything.
- **Nav (extends D11):** the exact page gets `aria-current="page"`, and on sub-pages (for example `/agents/1/dashboard`) the section link gets `aria-current="true"`.
- **Forms (extends D8):**
  - Forms use `novalidate`. `min` and `step="900"` still guide the date picker, but every rule is enforced and reported by the server in one consistent way, so the "submit a past time" demo step shows the server's error.
  - The status region (`role="status"`) is always rendered and is empty when there is no notice.
  - Unknown `?notice=` values are ignored.
- **Skip link:** it's the first element in `<body>`. `<main id="main" tabindex="-1">` takes focus when you follow it.
- **Contrast** (computed): notice text 8.6:1 and error text 9.0:1 on their backgrounds. Muted text is 5.4:1 on the page and 5.7:1 on cards, and the brand blue is 5.5:1 on white.
- **Evidence:**
  - `npm run validate` passes 161 tests in 17 files. These include an accessibility sweep over every page (`src/a11y.test.ts`) and a crawler that follows every internal link from `/` (`src/links.test.ts`).
  - `npm start` on a new `DB_PATH` applied all 5 migrations and served the empty states.
  - A JavaScript-free walkthrough with `curl` against the compiled server and a seeded database passed. A past booking got 400, a valid booking 303 with the notice, an overlapping reschedule 400, a free reschedule 303, cancel 303, and cancelling again 409. The dashboard counts went 2 → 3 → 2, the agent dashboard showed the cancelled entry, and `db:seed` reset everything.
- **Spec clarifications (plan group 10):**
  - `db:seed` now refuses when appointments exist unless `--force` is passed, and unknown flags print usage. `src/db/cli.test.ts` covers an empty clinic (seeds without the flag), refusal (exit 1, rows untouched), and `--force` (reset). The count comes from `countAppointments` in the data layer.
  - New tests pin the clarified D7 rules: Saturday and Sunday bookings are accepted, two agents can book the same therapy at the same time, and with the clock at 10:15 an appointment that started at 10:00 is listed under Past and gets 409 for cancel and reschedule.
