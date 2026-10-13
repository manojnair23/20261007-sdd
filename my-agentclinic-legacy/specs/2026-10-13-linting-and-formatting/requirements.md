# Phase 5 — Linting and formatting: requirements

Roadmap items 5.1–5.4. This closes the "Linting and formatting" gap in `specs/tech-stack.md`.

## Why

- Students copy what they see. A linter catches correctness mistakes (unused variables, floating code, unsafe `any`) before review, and a formatter ends style debates in pull requests.
- AI coding agents follow the same rules when `npm run validate` enforces them, so generated code matches the codebase without extra prompting.
- Today the style is consistent only by habit. Nothing checks it.

## Scope

### In scope

1. **ESLint** with a flat config (`eslint.config.mjs`), `@eslint/js` recommended rules, and `typescript-eslint` recommended rules, covering `src/**/*.ts`, `src/**/*.tsx`, and the root config files.
2. **Prettier** with a `.prettierrc` that matches the current style, so the formatting commit is as small as it can be:
   - no semicolons
   - single quotes
   - 2-space indent
   - trailing commas everywhere
   - print width 120 (the code already runs past 100 columns in about 130 lines and past 120 in about 20)
   - `endOfLine: "auto"`, because this repo uses `core.autocrlf=true` on Windows and the working tree is CRLF
3. `eslint-config-prettier` so ESLint never reports formatting. ESLint is for correctness and Prettier is for layout.
4. A `.prettierignore` that skips `dist/`, `data/`, `node_modules/`, `package-lock.json`, `src/db/__fixtures__/`, and Markdown files. Markdown is left out so the specs, README, and CHANGELOG don't churn; it can be added later in its own commit.
5. New npm scripts:
   - `npm run lint`: ESLint, then `prettier --check`. It fails on any lint error or any unformatted file.
   - `npm run lint:fix`: `eslint --fix`.
   - `npm run format`: `prettier --write .`.
6. `npm run validate` becomes **typecheck → lint → test**.
7. Every existing ESLint finding is fixed or, when the code is right, disabled on that line with a comment that says why.
8. The whole codebase is formatted in **one separate commit** that contains only Prettier's output.
9. A `.git-blame-ignore-revs` file lists that formatting commit, so `git blame` skips it.
10. The README's script table and `specs/tech-stack.md` are updated, and the roadmap marks 5.1–5.4 done.

### Out of scope

- Type-aware lint rules (`recommendedTypeChecked`). They're slower and harder for students to read; we can revisit them in a later phase.
- Linting or formatting SQL migrations and Markdown.
- Editor setup (`.vscode/` is git-ignored), pre-commit hooks, and CI.
- Any behaviour change in the app. Pages, routes, and tests stay the same.

## Constraints

- **Dev dependencies only:** `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `prettier`. There are no runtime dependencies (per the tech-stack non-goal).
- The package stays CommonJS, so the ESLint config is `eslint.config.mjs`.
- `npm run build`, `npm run dev`, `npm start`, and the `db:*` scripts work exactly as before.
- Nothing is committed until the user has reviewed the change. The formatting commit (5.3) is reviewed on its own.

## Acceptance criteria

- `npm run lint` exits 0 on the finished branch, and exits non-zero for an unused variable or an unformatted file.
- `npm run validate` runs typecheck, then lint, then the tests, and passes.
- The formatting commit changes layout only: the test suite gives the same result before and after it, and it touches no file outside Prettier's scope.
- The README, tech stack, and roadmap describe the new scripts.
