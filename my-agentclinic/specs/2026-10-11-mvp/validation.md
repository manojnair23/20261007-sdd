# MVP: Validation

The `mvp` branch can be merged only when **every** check below passes.

## 1. Automated tests: `npm run validate`

Typecheck passes, Vitest exits 0, and every earlier test still passes. Route tests use `testApp()`, which builds a migrated and seeded `:memory:` database with a fixed clock. No test touches `data/`.

### Foundations
- [ ] `createApp({ db, now })` is the only way the app is built. `index.ts` and the tests both use it.
- [ ] `toSlot`, `isSlot`, `addMinutes`, and `formatSlot` are unit-tested, including the hour and day rollovers in `addMinutes`.
- [ ] Seeding twice leaves identical row counts, because seeding resets the data.
- [ ] The nav marks the current page with `aria-current="page"`, and every page has a skip link to `<main id="main">`.

### Data layer (each against `:memory:`)
- [ ] The agents, ailments, and therapies functions return the seeded rows, joins, and counts.
- [ ] `listRecommendedTherapies` returns only therapies that treat at least one of the agent's ailments.
- [ ] `listAppointments` groups appointments into upcoming, past, and cancelled correctly with a fixed clock.
- [ ] `clinicStats` and `agentDashboard` match the seed and reflect bookings and cancellations.
- [ ] The database rejects bad data: a duplicate name, a therapy with a duration of 0, an unknown status, and an orphan foreign key all throw.

### Routes and pages
- [ ] `GET` on `/agents`, `/agents/:id`, `/agents/:id/dashboard`, `/ailments`, `/ailments/:id`, `/therapies`, `/appointments`, `/appointments/new`, `/appointments/:id/reschedule`, and `/dashboard` returns 200 with seeded content.
- [ ] Unknown and non-numeric ids return **404** and show the playful 404 page. An unknown path also returns 404.
- [ ] A handler that throws returns **500** with the friendly page and no stack trace in the body.
- [ ] Agent pages show the agent's ailments, ailment pages show the affected agents and the therapies that treat them, and the therapies list shows the ailments each one treats.
- [ ] Every list and dashboard shows its empty state when the database is migrated but not seeded.

### Booking, reschedule, and cancel forms
- [ ] Each D7 rule rejects bad input with **400**, re-renders the form with the values kept, shows an error summary, and sets `aria-invalid` and `aria-describedby` on each field. The appointment count doesn't change. Each of these has its own test:
  - [ ] a missing or unknown agent or therapy;
  - [ ] a malformed or past time;
  - [ ] a time off a 15-minute boundary;
  - [ ] a time outside 09:00–17:00, including an appointment that runs past 17:00;
  - [ ] an overlap with the same agent's scheduled appointment.
- [ ] Ending at exactly 17:00 is accepted, back-to-back appointments are accepted, and a cancelled appointment does not block its slot.
- [ ] A valid booking returns **303** to `/appointments?notice=booked`, and the list shows the new appointment and the notice.
- [ ] A valid reschedule returns **303** with `notice=rescheduled`, and the appointment doesn't conflict with its own old slot.
- [ ] Cancel returns **303** with `notice=cancelled`, and the appointment moves to Cancelled.
- [ ] Cancelling or rescheduling an appointment that is cancelled or in the past returns **409**, and an unknown id returns **404**.

### Accessibility (automated)
- [ ] Every page in the route list has exactly one `<h1>`, a `<title>`, the viewport meta tag, the skip link, and `<main id="main">`.
- [ ] Every form `<input>`, `<select>`, and `<textarea>` has a `<label for>` that points at its id.
- [ ] Data tables have a `<caption>` and `<th scope>`.

## 2. Type-checked build

- [ ] `npm run build` has zero errors with `strict` on, and no test or fixture files end up in `dist/`.
- [ ] `npm start` runs the five migrations on a fresh `DB_PATH` and serves every page.

## 3. Manual demo walkthrough (JavaScript disabled)

Start from a fresh database (`DB_PATH` pointing at a new folder):

- [ ] `npm run db:migrate`, then `npm run db:seed`, then `npm run dev`. The home page cards link to Agents and the Dashboard.
- [ ] Browse: open an agent, then one of its ailments, then a therapy that treats it. Every link resolves.
- [ ] Book from the agent's page. The agent is prefilled and recommended therapies come first. Submit a past time and see the error. Fix it, submit, and see the "booked" notice and the new row.
- [ ] Reschedule that appointment so it overlaps another of the agent's appointments and see the error. Pick a free slot and see the "rescheduled" notice.
- [ ] Cancel it and see the "cancelled" notice. It now appears under Cancelled.
- [ ] The staff dashboard counts and "Next up" list, and the agent's dashboard, both reflect each step.
- [ ] Run `npm run db:seed` again. The demo resets to the seeded state.
- [ ] A bad URL (for example `/agents/999`) shows the 404 page with a way home.

## 4. Responsive and accessibility checks (every new page)

- [ ] No horizontal scroll at ~320px, and long names and text wrap.
- [ ] Layouts adapt at ~375px and ~1280px: card grids and stat cards go from 1 column to several, and tables either fit or stack readably.
- [ ] Nav links, buttons, and form controls are at least 44px tall. The wrapped six-link nav is usable at 320px.
- [ ] Keyboard only: the skip link works, every action can be reached in a sensible order, and focus is always visible.
- [ ] Form errors are announced: the error summary is focusable or near the top of the form, and each field's message is linked to the field.
- [ ] Text contrast is at least 4.5:1 throughout, including notices, errors, and muted text.
- [ ] Checked in Chrome or Edge **and** Firefox, and in Safari if one is available.

## 5. Specs kept in sync

- [ ] Items 2.1–2.13, 3.1–3.2, and 4.1–4.3 are ticked in `specs/roadmap.md`, and Phases 2–4 are marked complete.
- [ ] `README.md` documents setup, the scripts, `PORT` and `DB_PATH`, and the demo script.
- [ ] `requirements.md` has implementation notes for resolved open decisions and any changes from D1–D14.
- [ ] `CHANGELOG.md` is updated with the `changelog` skill.

## Definition of done

All boxes above are checked, the app runs, the demo walkthrough works end to end with JavaScript disabled, and the branch contains only MVP work plus spec updates.
