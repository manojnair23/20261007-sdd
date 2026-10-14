# Phase 6 — Staff CRUD: plan

Thirteen small slices in roadmap order. Each one is: data-layer functions → validator (if any) → route → view → tests. After each slice, `npm run validate` must pass, then pause for the user's review and commit the slice on its own. Work happens on the `phase-6-staff-crud` branch.

## New routes at a glance

| Method and path | Slice | Success | Other responses |
|---|---|---|---|
| `GET /agents/new` | 6.3 | 200 form | |
| `POST /agents/new` | 6.3 | 303 → `/agents/:id?notice=created` | 400 |
| `GET /agents/:id/edit` | 6.4 | 200 form | 404 |
| `POST /agents/:id/edit` | 6.4 | 303 → `/agents/:id?notice=updated` | 400, 404 |
| `POST /agents/:id/ailments` | 6.5 | 303 → `/agents/:id?notice=ailment-added` | 400, 404 |
| `POST /agents/:id/ailments/:ailmentId/remove` | 6.5 | 303 → `/agents/:id?notice=ailment-removed` | 404 |
| `GET /agents/:id/delete` | 6.6 | 200 confirmation | 404, 409 |
| `POST /agents/:id/delete` | 6.6 | 303 → `/agents?notice=deleted` | 404, 409 |
| `GET /ailments/new`, `POST /ailments/new` | 6.7 | 303 → `/ailments/:id?notice=created` | 400 |
| `GET /ailments/:id/edit`, `POST /ailments/:id/edit` | 6.7 | 303 → `/ailments/:id?notice=updated` | 400, 404 |
| `POST /ailments/:id/therapies` | 6.8 | 303 → `/ailments/:id?notice=therapy-added` | 400, 404 |
| `POST /ailments/:id/therapies/:therapyId/remove` | 6.8 | 303 → `/ailments/:id?notice=therapy-removed` | 404 |
| `GET /ailments/:id/delete`, `POST /ailments/:id/delete` | 6.9 | 303 → `/ailments?notice=deleted` | 404 |
| `GET /therapies/new`, `POST /therapies/new` | 6.10 | 303 → `/therapies?notice=created` | 400 |
| `GET /therapies/:id/edit`, `POST /therapies/:id/edit` | 6.10 | 303 → `/therapies?notice=updated` | 400, 404 |
| `GET /therapies/:id/delete`, `POST /therapies/:id/delete` | 6.11 | 303 → `/therapies?notice=deleted` | 404, 409 |

Therapies have no detail page, so their notices show on `/therapies`. Every new route uses the `ID` pattern from `src/deps.ts`, so a non-numeric id falls through to the 404 page.

## 6.1 — CSRF protection

1. In `createApp`, add `app.use('*', csrf())` from `hono/csrf`, before the routes.
2. In `app.onError`, check for `HTTPException` with status 403 first, and render a new `ForbiddenPage` in `src/views/ErrorPages.tsx` with a 403 ("That form came from somewhere else. Go back, reload the page, and try again.").
3. In `src/test/testApp.ts`, make `post()` send `Origin: http://localhost` (the origin `app.request` uses), and add an option to override or leave out headers for the CSRF tests.
4. Tests in `src/app.test.ts`:
   - a POST with `Origin: https://evil.example` → 403 with the friendly page, and nothing changes in the database;
   - a POST with neither `Origin` nor `Sec-Fetch-Site` → 403;
   - a POST with `Sec-Fetch-Site: same-origin` and no `Origin` → allowed;
   - a GET is never checked;
   - every existing POST test still passes.
5. Add the 403 page to the accessibility sweep.

## 6.2 — Shared form pattern

1. Add `src/views/forms.tsx`, generalized from `BookingForm.tsx`:
   - `fieldAria(id, error, hintId?)`
   - `FieldError`
   - `TextField` (an `<input>` with `maxlength` for the hint, though the server still checks)
   - `TextArea`
   - `NumberField`
   - `SelectField`
   Each one takes `id`, `label`, `value`, `error`, and an optional `hint`.
2. Add `src/validation.ts` with small helpers:
   - `requiredText(value, label, max)`, which returns an error message or undefined;
   - `wholeNumber(value, label, min, max)`;
   - `parseId(text)`, the existing `toId` moved out of `appointments/validate.ts`;
   - `Validated<T, F>`, the shared result type `{ ok: true; value: T } | { ok: false; errors: Partial<Record<F, string>>; values: Record<F, string> }`.
3. Move `BookingForm.tsx` and `appointments/validate.ts` onto these helpers. The rendered HTML must not change: the existing booking and accessibility tests are the proof.
4. Add a `NOTICES` helper to `src/views/components.tsx`: `noticeFrom(query, map)` returns the message for a known key and ignores anything else. Appointments use it too.
5. Tests: unit tests for `requiredText`, `wholeNumber`, and `parseId`, covering blanks, whitespace, too long, non-numbers, and the edges.

## 6.3 — Agents: create

1. Data layer (`src/db/agents.ts`):
   - `createAgent(db, { name, model, bio }): number`
   - `agentNameTaken(db, name, ignoreId?)`, a case-insensitive check: `lower(name) = lower(?)`.
2. Validator `src/agents/validate.ts`: `validateAgent(db, input, { ignoreId })`, with the field rules from the requirements.
3. View `src/views/agents/AgentForm.tsx`, used for both create and edit (title, action, and button text change).
4. Routes `GET /agents/new` and `POST /agents/new`. Register `/new` before `/:id`.
5. `AgentsPage`: an "Add an agent" button. The empty state says "Add the first agent" (link) as well as mentioning the seed.
6. `AgentPage`: show the `created` notice.
7. Tests: the validator (each rule, and duplicates in different case), `createAgent`, the route (303 and `Location`; 400 that keeps the values and shows the summary), and the new agent appearing on `/agents`.

## 6.4 — Agents: edit

1. Data layer: `updateAgent(db, id, input): boolean`.
2. Routes `GET /agents/:id/edit` and `POST /agents/:id/edit`. The name check ignores the agent's own row, so saving without changes works.
3. `AgentPage` gets an "Edit" link and the `updated` notice.
4. Tests: the update, an unchanged save, renaming to another agent's name (400), and an unknown id (404).

## 6.5 — Agents: assign and unassign ailments

1. Data layer:
   - `assignAilment(db, agentId, ailmentId)`, using `INSERT OR IGNORE`;
   - `unassignAilment(db, agentId, ailmentId)`;
   - `listAilmentsNotForAgent(db, agentId)`.
2. On `AgentPage`, under "Ailments":
   - each ailment gets a "Remove" button (`aria-label="Remove <ailment> from <agent>"`);
   - below the list there's a small form with a labelled `<select>` of unassigned ailments and an "Add ailment" button. It's hidden when every ailment is already assigned, with a short note instead.
3. Routes as in the table. An invalid body re-renders `AgentPage` with a 400 and the error next to the select.
4. Tests: add, add again (no-op, 303), remove, remove one that isn't linked (no-op), an unknown ailment in the body (400), an unknown agent (404), and that the booking form's recommended therapies change to match.

## 6.6 — Agents: delete

1. Data layer:
   - `countAppointmentsForAgent(db, id)`;
   - `deleteAgent(db, id): 'ok' | 'not-found' | 'has-appointments'`, which checks and deletes in one transaction. The ailment links cascade.
2. Views:
   - `ConfirmDeletePage`, a shared component: title, what will be removed, a "Delete" button (`class="secondary"`), and a "Keep it" link;
   - `CannotDeletePage` (409), which says how many appointments there are and links to the agent's dashboard.
3. Routes as in the table. The GET also returns 409 when deleting is blocked, so staff learn before they confirm.
4. Tests: deleting a new agent with no appointments, the ailment links being removed, a seeded agent being blocked (409) both before and after confirming, the database not changing on a 409, and 404s.

## 6.7 — Ailments: create and edit

The same shape as 6.3 and 6.4: `createAilment`, `updateAilment`, `ailmentNameTaken`, `validateAilment`, an `AilmentForm` view, "Add an ailment" on the list, and "Edit" plus notices on `AilmentPage`.

## 6.8 — Ailments: link and unlink therapies

The same shape as 6.5, from the ailment's side: `linkTherapy`, `unlinkTherapy`, `listTherapiesNotForAilment`, and the controls on `AilmentPage` under "Therapies". Tests include the change showing up on `/therapies` (the "treats" list) and in the booking form's recommendations.

## 6.9 — Ailments: delete

`deleteAilment(db, id): 'ok' | 'not-found'`, with the agent and therapy links cascading. The confirmation page lists how many agents and therapies will lose this ailment. Deleting is never blocked.

## 6.10 — Therapies: create and edit

1. Data layer:
   - `createTherapy` and `updateTherapy`;
   - `therapyNameTaken`;
   - `countUpcomingAppointmentsForTherapy(db, id, now)`.
2. Validator `validateTherapy(db, input, now, { ignoreId })`. The duration must be a whole number from 1 to 480. On edit, a changed duration is refused while there are upcoming appointments ("This therapy has 2 upcoming appointments. Change the duration after they've happened, or cancel them first.").
3. A `TherapyForm` view, with the duration as a number input labelled "Duration (minutes)".
4. `TherapiesPage`: an "Add a therapy" button, "Edit" and "Delete" on each card (`aria-label` names the therapy), and notices.
5. Tests: each rule, including the duration lock (the seeded therapy with an upcoming appointment can't change its duration, but can change its name), and the booking form showing the new duration.

## 6.11 — Therapies: delete

The same shape as 6.6: `countAppointmentsForTherapy` and `deleteTherapy(db, id): 'ok' | 'not-found' | 'has-appointments'`, and the `ConfirmDeletePage` and `CannotDeletePage` views. A seeded therapy with appointments returns 409, and a new one deletes.

## 6.12 — Manage links and consistent notices

1. `StaffDashboardPage`: add a "Manage the catalog" section with links to add an agent, add an ailment, and add a therapy, plus the three list pages.
2. Check every notice against one style: short, kind, a little playful (for example "Agent added. Welcome to the clinic."). The notice texts live in the view next to the page that shows them, like `NOTICES` in `AppointmentsPage`.
3. Tests: the dashboard links, and that an unknown `?notice=` value shows nothing.

## 6.13 — Sweeps and seed reset

1. Accessibility sweep (`src/a11y.test.ts`): add every new GET page, every form re-rendered with a 400, both 409 pages, and the 403 page.
2. Link crawler (`src/links.test.ts`): it must reach `/agents/new`, `/agents/1/edit`, `/agents/1/delete`, `/ailments/new`, `/ailments/1/edit`, `/ailments/1/delete`, `/therapies/new`, `/therapies/1/edit`, and `/therapies/1/delete`. A 409 page counts as reachable, not broken.
3. Seed test: create an agent, an ailment, and a therapy, run the seed with `--force`, and check that only the seeded records are left, with their usual ids.
4. Docs: the README (a demo step for managing the catalog), `specs/tech-stack.md` (mark the CSRF gap closed), the roadmap (mark Phase 6 done once the browser checks pass), and the CHANGELOG.

## Risks

| Risk | Mitigation |
|---|---|
| CSRF breaks every existing POST test | 6.1 updates the shared `post()` helper first and runs the full suite before anything else changes. |
| The shared form refactor (6.2) changes the booking form's HTML | The existing booking and accessibility tests must pass unchanged. Any test that needs editing is a sign to stop and look. |
| Deleting fails on a foreign key with an unhelpful 500 | Delete functions check for appointments inside the same transaction and return `'has-appointments'`, so the route never reaches a foreign-key error. |
| A duration change makes existing bookings overlap or run past closing | The duration can't change while there are upcoming appointments (6.10). |
| Route order lets `/agents/new` match `/:id` | `ID` only matches digits, so `new` can't match. There's a test for it anyway. |
| Thirteen slices make for a long review | Each slice is one commit. The user can ask to review several slices together. |

## Decisions made while writing this spec

- **2026-10-13:** deleting an agent or therapy is blocked by any appointment, not just upcoming ones (user's choice, see requirements).
- **2026-10-13:** Phase 6 is built on the `phase-6-staff-crud` branch, made from `constitution-specs` (PR #1).
