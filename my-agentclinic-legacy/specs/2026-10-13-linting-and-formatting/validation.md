# Phase 5 — Linting and formatting: validation

The phase is done when every box below is ticked.

The formatting commit ("commit 3" below) is `75fa5a6`. Checked on 2026-10-13.

## Automated

- [x] `npm run validate` passes and runs, in order: `tsc`, `eslint .`, `prettier --check .`, `vitest run`.
- [x] The test count is the same as before the phase started (161 before, 161 after).
- [x] `npm run lint` exits 0.
- [x] `npm run build` succeeds, and `dist/` still contains no test files.

## Negative checks (the gate really catches problems)

Make each change, run the command, see it fail, then undo the change.

- [x] Add `const unused = 1` to `src/time.ts`. `npm run lint` fails with `@typescript-eslint/no-unused-vars`.
- [x] Add a semicolon to the end of a line in `src/port.ts`. `npm run lint` fails on `prettier --check` and names that file.
- [x] Run `npm run format` after the semicolon change. It removes the semicolon, and `npm run lint` passes again.

## The formatting commit

- [x] Commit 3 contains only Prettier's output. `git show --stat <commit 3>` lists only `.ts`, `.tsx`, `.css`, `.json`, and `.mjs` files. (It has 13 `.ts`, 5 `.tsx`, and 1 `.json`. The CSS keeps its double quotes, so it didn't change.)
- [x] `git show <commit 3> -- '*.sql' '*.md'` is empty.
- [x] `.git-blame-ignore-revs` holds commit 3's full hash, and `git blame` with the ignore file doesn't attribute any line to commit 3. (Checked on `src/views/components.tsx`, which commit 3 changed; `src/app.tsx` wasn't touched by it. The repository root is the parent folder, so the path is `my-agentclinic-legacy/.git-blame-ignore-revs`.)

## Docs

- [x] The README's script table lists `lint`, `lint:fix`, `format`, and `format:check`, and describes `validate` as typecheck → lint → test.
- [x] `specs/tech-stack.md` lists ESLint and Prettier in the current stack, and the linting gap is closed.
- [x] `specs/roadmap.md` marks 5.1–5.4 ✅.
- [x] `CHANGELOG.md` has a Phase 5 entry.
- [x] Every row in the "Findings" table in `plan.md` says whether it was fixed or disabled, and why.

## Manual browser checks

This phase shouldn't change anything that people can see. Run `npm run dev` and confirm:

The last three were checked over HTTP against throwaway databases (one seeded, one empty), not by eye in a browser.

- [ ] The home page renders with the orange and black scheme. (It returns 200 and links `pico.min.css` and `styles.css`, and Phase 5 left `styles.css` unchanged. It still needs a look in a browser.)
- [x] `/agents`, `/ailments`, `/therapies`, and `/appointments` render, with their empty states when the database is empty.
- [x] Booking an appointment still works (303 to `?notice=booked`), and a past time still shows the error summary (400).
- [x] The staff dashboard and one agent dashboard render.
