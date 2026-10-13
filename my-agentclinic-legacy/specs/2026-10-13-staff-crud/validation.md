# Phase 6 — Staff CRUD: validation

The phase is done when every box below is ticked. Tick each slice's boxes as it's finished.

## Every slice

- [ ] `npm run validate` passes (typecheck → lint → test) after each slice, and the test count only goes up.
- [ ] No SQL in route handlers. `grep -n "prepare\|exec(" src/routes` finds nothing.
- [ ] No new runtime dependencies in `package.json`.

## Automated (by slice)

- [x] **6.1** A cross-origin POST returns 403 with the friendly page and changes nothing. A POST with no `Origin` and no `Sec-Fetch-Site` returns 403. A same-origin POST works. GETs aren't checked.
- [x] **6.2** The validation helpers have unit tests. The booking form's HTML is unchanged (the existing tests pass without edits).
- [x] **6.3** Creating an agent: 303 to the new agent with the "created" notice. Each field rule returns 400, keeps the values, and links the error summary to the field. A duplicate name in a different case is refused.
- [x] **6.4** Editing an agent: saving without changes works, renaming to another agent's name is refused, and an unknown id returns 404.
- [x] **6.5** Assigning and unassigning ailments works and is idempotent. An unknown ailment in the body returns 400. The booking form's recommended therapies follow the change.
- [x] **6.6** Deleting an agent with no appointments removes the agent and their ailment links. An agent with any appointment returns 409 on both GET and POST, and the database doesn't change.
- [x] **6.7** Creating and editing an ailment follows the same rules as agents.
- [x] **6.8** Linking and unlinking therapies works and is idempotent, and `/therapies` shows the change.
- [ ] **6.9** Deleting an ailment removes it and its links to agents and therapies. It's never blocked.
- [ ] **6.10** Creating and editing a therapy: the duration must be a whole number from 1 to 480. A therapy with upcoming appointments can't change its duration, but can change its name and description.
- [ ] **6.11** Deleting a therapy with no appointments works. One with any appointment returns 409 and the database doesn't change.
- [ ] **6.12** The staff dashboard links to every "add" page and every list. An unknown `?notice=` shows nothing.
- [ ] **6.13** The accessibility sweep includes every new page, every 400 form, both 409 pages, and the 403 page. The link crawler reaches every new page. `db:seed --force` removes staff-created records.

## Docs

- [ ] The README demo includes managing the catalog.
- [ ] `specs/tech-stack.md`: the "Staff writes and CSRF" gap is closed.
- [ ] `specs/roadmap.md`: 6.1–6.13 are ✅, with notes on the two changes from the roadmap's wording (6.6/6.11 and 6.12).
- [ ] `CHANGELOG.md` has a Phase 6 entry.

## Manual browser checks

Run `npm run db:seed -- --force && npm run dev`, and turn JavaScript off in the browser for at least one full pass.

- [ ] Add an agent, edit their bio, give them two ailments, remove one, then delete the agent. Each step shows its notice.
- [ ] Try to delete GPT-Overthinker. The page explains that they have appointments and links to their dashboard.
- [ ] Add an ailment, link a therapy to it, and see the therapy recommended when booking for an agent with that ailment.
- [ ] Add a therapy with a duration of 0, then of 45. The first shows the error summary, and the second is saved.
- [ ] Try to change the duration of a therapy with an upcoming appointment. The field error explains why.
- [ ] Submit an empty form with the keyboard only. Focus can reach the error summary, and each link jumps to its field.
- [ ] At phone width (about 375px), every form, the confirmation pages, and the Remove buttons are usable, with no sideways scrolling.
- [ ] The staff dashboard's "Manage the catalog" links all work.
