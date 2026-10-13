# Phase 5 — Linting and formatting: validation

The phase is done when every box below is ticked.

## Automated

- [ ] `npm run validate` passes and runs, in order: `tsc`, `eslint .`, `prettier --check .`, `vitest run`.
- [ ] The test count is the same as before the phase started.
- [ ] `npm run lint` exits 0.
- [ ] `npm run build` succeeds, and `dist/` still contains no test files.

## Negative checks (the gate really catches problems)

Make each change, run the command, see it fail, then undo the change.

- [ ] Add `const unused = 1` to `src/time.ts`. `npm run lint` fails with `@typescript-eslint/no-unused-vars`.
- [ ] Add a semicolon to the end of a line in `src/port.ts`. `npm run lint` fails on `prettier --check` and names that file.
- [ ] Run `npm run format` after the semicolon change. It removes the semicolon, and `npm run lint` passes again.

## The formatting commit

- [ ] Commit 3 contains only Prettier's output. `git show --stat <commit 3>` lists only `.ts`, `.tsx`, `.css`, `.json`, and `.mjs` files.
- [ ] `git show <commit 3> -- '*.sql' '*.md'` is empty.
- [ ] `.git-blame-ignore-revs` holds commit 3's full hash, and `git blame --ignore-revs-file .git-blame-ignore-revs src/app.tsx` doesn't attribute any line to commit 3.

## Docs

- [ ] The README's script table lists `lint`, `lint:fix`, `format`, and `format:check`, and describes `validate` as typecheck → lint → test.
- [ ] `specs/tech-stack.md` lists ESLint and Prettier in the current stack, and the linting gap is closed.
- [ ] `specs/roadmap.md` marks 5.1–5.4 ✅.
- [ ] `CHANGELOG.md` has a Phase 5 entry.
- [ ] Every row in the "Findings" table in `plan.md` says whether it was fixed or disabled, and why.

## Manual browser checks

This phase shouldn't change anything that people can see. Run `npm run dev` and confirm:

- [ ] The home page renders with the orange and black scheme.
- [ ] `/agents`, `/ailments`, `/therapies`, and `/appointments` render, with their empty states when the database is empty.
- [ ] Booking an appointment still works, and a past time still shows the error summary (400).
- [ ] The staff dashboard and one agent dashboard render.
