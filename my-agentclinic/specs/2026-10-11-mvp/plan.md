# MVP: Plan

The plan is built from vertical slices. Every group from 2 to 8 adds its own migration, seed data, data-layer functions, pages, nav link, and tests. At the end of every group:
- `npm run validate` passes;
- `npm run db:seed` followed by `npm run dev` shows the new pages working;
- the new pages pass the responsive checks at ~320px, ~375px, and ~1280px.

## 1. Foundations (deferred from Phase 1)

1. Change `src/app.tsx` to export `createApp({ db, now }: AppDeps)`. Move the existing routes into it. `src/index.ts` passes the opened database and `() => new Date()`.
2. Add `src/test/testApp.ts`. It opens `:memory:`, runs migrations, runs the seed, and returns `{ app, db }` with a fixed clock, for example `2026-10-12T10:00`.
3. Switch the existing route tests to `testApp()`.
4. Add `src/time.ts`:
   - `toSlot(date)`, which turns a date into the `YYYY-MM-DDTHH:mm` slot format in local time;
   - `isSlot(text)`;
   - `addMinutes(slot, n)`;
   - `formatSlot(slot)`, which uses `en-US` (for example "Mon, Oct 12, 2026, 2:30 PM").
   Unit-test all four.
5. Make seeding a reset. `runSeed` first runs a `resetDemo` step that deletes rows from the domain tables, children first. The CLI prints "Resetting demo data…". Test that seeding twice leaves the same row counts.
6. Update `Header` to take the current path and set `aria-current="page"` on the matching link. Add a skip link ("Skip to content") before the header, targeting `<main id="main">`. Test both.

## 2. Agents (roadmap 2.1–2.3)

1. Add `migrations/0002_agents.sql`: `agents(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, model TEXT NOT NULL, bio TEXT NOT NULL)`.
2. Add an `agents` seeder with about 5 playful agents.
3. Add `src/db/agents.ts` with `listAgents(db)` and `getAgent(db, id)`. Test them.
4. Add `src/routes/agents.tsx` and `src/views/agents/`:
   - `GET /agents` shows a card grid of name, model, and a one-line bio;
   - `GET /agents/:id` shows the full bio;
   - an unknown or non-numeric id returns 404.
5. Add **Agents** to the nav.
6. Add route tests: 200 with every seeded name; the detail page shows its agent; 404 for `/agents/999` and `/agents/abc`.

## 3. Ailments (roadmap 2.4–2.6)

1. Add `migrations/0003_ailments.sql`:
   - `ailments(id, name UNIQUE, description)`;
   - `agent_ailments(agent_id → agents ON DELETE CASCADE, ailment_id → ailments ON DELETE CASCADE, PRIMARY KEY(agent_id, ailment_id))`.
2. Seed about 6 ailments, and give each agent 1–3 of them.
3. Add `src/db/ailments.ts` with `listAilments(db)` (each with the number of agents affected), `getAilment(db, id)`, `listAgentsWithAilment(db, id)`, and `listAilmentsForAgent(db, agentId)`. Test them.
4. Add the pages:
   - `GET /ailments` shows a list with counts;
   - `GET /ailments/:id` shows the description and the affected agents, linked to their pages;
   - the agent detail page gains an "Ailments" section linking to each ailment.
5. Add **Ailments** to the nav.
6. Add route tests: list, detail, 404, the agent page showing its ailments, and the ailment page showing its agents.

## 4. Therapies (roadmap 2.7–2.9)

1. Add `migrations/0004_therapies.sql`:
   - `therapies(id, name UNIQUE, description, duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0))`;
   - `ailment_therapies(ailment_id, therapy_id, PRIMARY KEY(...))`, both with `ON DELETE CASCADE`.
2. Seed about 5 therapies with durations of 30, 45, or 60 minutes, and map each ailment to 1–3 therapies.
3. Add `src/db/therapies.ts` with `listTherapies(db)` (each with the ailments it treats), `getTherapy(db, id)`, `listTherapiesForAilment(db, ailmentId)`, and `listRecommendedTherapies(db, agentId)`. Test them.
4. Add the pages:
   - `GET /therapies` shows a list with duration and the ailments each one treats, linked;
   - the ailment detail page gains a "Treated by" section.
5. Add **Therapies** to the nav.
6. Add route tests: list, the ailment page showing its therapies, and the recommendations for a seeded agent.

## 5. Appointments list (roadmap 2.10–2.11)

1. Add `migrations/0005_appointments.sql`: `appointments(id, agent_id → agents, therapy_id → therapies, starts_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`, with an index on `(agent_id, starts_at)`.
2. Seed appointments relative to the seed time: 2 upcoming, 1 past, and 1 cancelled.
3. Add `src/db/appointments.ts` with `listAppointments(db, now)`, which groups them into upcoming, past, and cancelled and includes the agent and therapy names, and `getAppointment(db, id)`. Test the grouping with a fixed clock.
4. Add `GET /appointments`:
   - sections for Upcoming, Past, and Cancelled, each with an empty state;
   - each row shows the time (`formatSlot`), agent, therapy, and status;
   - a "Book an appointment" link.
5. Add **Appointments** to the nav.
6. Add route tests: the sections and their order, and empty states shown against an unseeded database.

## 6. Booking (roadmap 2.12)

1. Add `src/appointments/validate.ts` with `validateBooking(db, input, now, { ignoreId? })`. It returns `{ ok: true, value }` or `{ ok: false, errors: Record<field, message>, values }` and applies every rule in D7: the agent and therapy exist, the slot is in the future, it's on a 15-minute boundary, it's within 09:00–17:00 including the therapy's duration, and it doesn't overlap the same agent's other scheduled appointments.
2. Unit-test every rule, including boundaries: exactly 17:00 at the end is OK, one minute over is not; back-to-back bookings are OK, overlapping ones are not; and a cancelled appointment never blocks a slot.
3. Add `createAppointment(db, value, now)` to the data layer.
4. Add `GET /appointments/new`:
   - a form with an agent `<select>`, a therapy `<select>` (when an agent is chosen, recommended therapies come first in an `<optgroup>`), and a `datetime-local` input (`step="900"`, `min` set to now);
   - `?agent=` and `?therapy=` prefill the form.
5. Add `POST /appointments/new`:
   - invalid input returns 400 with the form re-rendered, the values kept, an error summary, and `aria-invalid` and `aria-describedby` on each field;
   - valid input inserts the row and returns 303 to `/appointments?notice=booked`;
   - `/appointments` shows the notice in a `role="status"` region.
6. Add "Book an appointment" links on the agent detail page (prefilled with the agent) and on each therapy (prefilled with the therapy).
7. Add route tests: a GET shows the prefills; each invalid case returns 400 and leaves the row count unchanged; a valid POST returns 303 and the new row appears on the list.

## 7. Cancel and reschedule (roadmap 2.13)

1. Add `cancelAppointment(db, id, now)` and `rescheduleAppointment(db, id, startsAt, now)`. Both touch only scheduled, future appointments and update `updated_at`.
2. Add `POST /appointments/:id/cancel`:
   - each upcoming row has a small form with a "Cancel" button that names the appointment in an `aria-label`;
   - success returns 303 to `?notice=cancelled`;
   - an appointment that is already cancelled or in the past returns 409 with a friendly page;
   - an unknown id returns 404.
3. Add `GET` and `POST /appointments/:id/reschedule`:
   - the form is prefilled with the current slot, and the agent and therapy are shown read-only;
   - it reuses `validateBooking` with `ignoreId`, so the appointment doesn't conflict with itself;
   - the outcomes are 400, 303 to `?notice=rescheduled`, 409, or 404.
4. Add route tests for every outcome above, and check that cancelling frees the slot so another booking can take it.

## 8. Dashboards (roadmap 3.1–3.2)

1. Add `src/db/dashboard.ts`:
   - `clinicStats(db, now)` returns counts of agents and ailments, the number of upcoming appointments, and the next 5 appointments;
   - `agentDashboard(db, agentId, now)` returns the agent, their ailments, their upcoming appointments, and their past and cancelled ones.
   Test both with a fixed clock.
2. Add `GET /dashboard`, the staff page:
   - stat cards in a responsive grid: one column on phones, three from 40rem;
   - a "Next up" list with Cancel and Reschedule actions;
   - empty states.
3. Add `GET /agents/:id/dashboard`:
   - the agent's ailments with recommended therapies, upcoming appointments with actions, and past and cancelled appointments;
   - a "Book an appointment" link;
   - a link from the agent detail page.
4. Add **Dashboard** to the nav (the staff dashboard). Update the home page cards to link to `/agents` ("For agents") and `/dashboard` ("For clinic staff"), now that both pages exist.
5. Add route tests: the counts match the seed, the lists reflect a booking or cancellation, and unknown agents return 404.

## 9. Polish (roadmap 4.1–4.3)

1. Add `app.notFound`, a playful 404 page inside `Layout`, and `app.onError`, which logs the error and shows a 500 page without the stack. Test both; for the 500, use a test-only route that throws.
2. Review every list page and dashboard for empty states, and test them against an unseeded database.
3. Accessibility pass (D14):
   - add an automated test that every page in a route list has exactly one `<h1>`, a `<title>`, the skip link, and `<main id="main">`;
   - add an automated test that every form `<input>` and `<select>` has a matching `<label for>`;
   - check by hand: keyboard-only walkthrough, focus visible, and contrast.
4. Visual polish: consistent page headers, spacing, and the table and card styles on Pico variables. Keep custom CSS small.
5. Cross-browser responsive review: every page at ~320px, ~375px, and ~1280px in Chrome or Edge plus Firefox, and in Safari if one is available.

## 10. Wrap-up

1. Tick 2.1–2.13, 3.1–3.2, and 4.1–4.3 in `specs/roadmap.md`, and mark Phases 2–4 complete.
2. Update `README.md` with setup steps, the scripts (`dev`, `validate`, `db:migrate`, `db:seed`), `PORT` and `DB_PATH`, and a 60-second demo script.
3. Add implementation notes to `requirements.md` covering resolved open decisions and anything that changed from the decisions.
4. Run `npm run validate`, then everything else in `validation.md`.
5. Use the `changelog` skill to update `CHANGELOG.md` before merging.
