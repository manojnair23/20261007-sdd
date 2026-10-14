# Phase 6 — Staff CRUD: requirements

Roadmap items 6.1–6.13. This closes the "Staff writes and CSRF" gap in `specs/tech-stack.md`.

## Why

- Susan in product wants staff to look after agents, ailments, and therapies. Today the catalog can only change through `npm run db:seed`.
- Mary in engineering wants the site to be reliable. New forms that change state need CSRF protection and the same validation as booking.
- For students, each record type is a small, repeatable slice (data layer → route → view → tests), which makes it a good thing to build with an AI coding agent one spec item at a time.

## Users and access

Staff use these pages. As the mission says, there's no authentication; anyone who can reach the site can manage the catalog. That's fine for a teaching and demo app, and these pages don't change that.

## Scope

### In scope

1. **CSRF protection** with Hono's built-in `csrf()` on every request. A form POST from another origin, or one with neither `Origin` nor `Sec-Fetch-Site`, gets a friendly **403** page instead of the generic 500.
2. **A shared form pattern**, taken from the booking form: labelled fields, `aria-invalid` and `aria-describedby`, the error summary, `novalidate`, and validators that return `{ ok: true, value } | { ok: false, errors, values }`. The booking form moves onto the shared field components, and its output stays the same.
3. **Agents:** create; edit name, model, and bio; assign and unassign ailments; delete with a confirmation page.
4. **Ailments:** create and edit name and description; link and unlink therapies; delete with a confirmation page.
5. **Therapies:** create and edit name, description, and duration; delete with a confirmation page.
6. **Notices** after every create, update, link change, and delete, using the `?notice=` pattern from appointments. Each slice adds its own notice, so no step finishes with a success page that says nothing (see "Changes to the roadmap").
7. **"Manage" links**: an "Add" button on each list page, and "Edit" and "Delete" on each detail page (or on each therapy card, since therapies have no detail page). The staff dashboard gets a short "Manage the catalog" section.
8. The **accessibility sweep and the link crawler** cover every new page, including each form re-rendered with errors. A test checks that `db:seed --force` removes staff-created records.

### Out of scope

- Authentication, roles, and audit history.
- Creating or editing appointments beyond what Phase 2 already does.
- Bulk edits, search, filters, and pagination.
- Any client-side JavaScript. Every form is a plain HTML POST.
- Schema migrations. The current tables already have everything these features need.

## Rules

### Fields

| Record | Field | Rule |
|---|---|---|
| Agent | name | Required, at most 80 characters, unique (ignoring case) |
| Agent | model | Required, at most 80 characters |
| Agent | bio | Required, at most 500 characters |
| Ailment | name | Required, at most 80 characters, unique (ignoring case) |
| Ailment | description | Required, at most 500 characters |
| Therapy | name | Required, at most 80 characters, unique (ignoring case) |
| Therapy | description | Required, at most 500 characters |
| Therapy | duration | A whole number of minutes from 1 to 480. It can't change while the therapy has upcoming appointments, because those slots were checked against the old duration. |

Values are trimmed before they're checked and saved. An invalid form comes back with a **400**, keeps what was typed, and shows the error summary.

### Deleting

| Record | Rule | When blocked |
|---|---|---|
| Agent | Allowed only when the agent has **no appointments at all**, of any status. Their ailment links are removed with them. | **409**, with a page that explains why and links to the agent's dashboard |
| Ailment | Always allowed. Its links to agents and therapies are removed with it. | Never blocked |
| Therapy | Allowed only when the therapy has **no appointments at all**, of any status. Its ailment links are removed with it. | **409**, with a page that explains why |

Appointments reference agents and therapies without `ON DELETE CASCADE`, and foreign keys are on. Blocking on *any* appointment keeps the history whole and needs no migration. This was decided on 2026-10-13. The roadmap says "blocked when the agent has upcoming appointments", and this rule is stricter.

Every delete starts with a GET confirmation page that says what will be removed. The POST does the delete, then redirects with a 303 to the list page with a notice.

### Links between records

- Assigning an ailment to an agent, or linking a therapy to an ailment, is a POST from a `<select>` of the options not linked yet. Removing a link is a POST button next to each linked item.
- Adding a link that already exists, or removing one that doesn't, changes nothing and still redirects (303).
- An unknown id in the URL gives 404. An unknown or missing id in the form body gives 400, with the error shown next to the select.

### HTTP

- Successful POSTs redirect with a 303 (POST-Redirect-GET).
- 400 for invalid input, 404 for unknown records, 409 for a blocked delete, 403 for a failed CSRF check.

## Constraints

- No new runtime dependencies. `csrf()` ships with Hono.
- Follow the conventions in `specs/tech-stack.md`: no SQL in routes, `createApp(deps)`, `src/routes/<domain>.tsx`, `src/db/<domain>.ts`, `src/views/<domain>/`.
- Every page keeps the accessibility baseline: one `<h1>`, labelled controls, captions and scoped headers on tables, named buttons, 44px tap targets, and nothing that needs JavaScript.
- `npm run validate` passes after every slice.
- Nothing is committed until the user has reviewed it.

## Changes to the roadmap

- **6.6 and 6.11:** a delete is blocked by *any* appointment, not just upcoming ones (see "Deleting").
- **6.12:** each slice adds its own notice as it's built, so 6.12 only adds the "Manage" links on the dashboard and checks that the notices are consistent.

## Acceptance criteria

- Staff can create, edit, link, unlink, and delete agents, ailments, and therapies from the browser, with JavaScript off.
- A cross-origin form POST is rejected with a 403, and same-origin forms keep working.
- Every rule in the tables above has a test at the data layer or the route level.
- The accessibility sweep and the link crawler pass, and they include every new page.
- `npm run validate` passes. `README.md`, `specs/tech-stack.md`, `specs/roadmap.md`, and `CHANGELOG.md` are updated.
