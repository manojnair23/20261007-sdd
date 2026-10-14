# Phase 5 — Linting and formatting: plan

Four small steps, in roadmap order. Each step ends with `npm run validate` passing and a pause for the user's review before anything is committed.

## Step 1 — ESLint (5.1)

1. Install the dev dependencies:
   `npm install --save-dev eslint @eslint/js typescript-eslint eslint-config-prettier`
2. Add `eslint.config.mjs`:

   ```js
   import js from '@eslint/js'
   import prettier from 'eslint-config-prettier'
   import { defineConfig } from 'eslint/config'
   import tseslint from 'typescript-eslint'

   export default defineConfig(
     { ignores: ['dist/', 'data/', 'node_modules/', 'src/db/__fixtures__/'] },
     js.configs.recommended,
     tseslint.configs.recommended,
     prettier,
   )
   ```

3. Add the `lint` script (ESLint only for now): `"lint": "eslint ."`, plus `"lint:fix": "eslint --fix ."`.
4. Run `npm run lint`. For each finding, either:
   - fix the code (preferred), or
   - when the code is right, add `// eslint-disable-next-line <rule> -- <reason>`.
   Record every finding and what was done with it in the "Findings" table at the end of this file.
5. Run `npm run validate`, then pause for review. **Commit 1:** "Add ESLint and fix its findings".

## Step 2 — Prettier config (5.2)

1. Install: `npm install --save-dev prettier`
2. Add `.prettierrc`:

   ```json
   {
     "semi": false,
     "singleQuote": true,
     "trailingComma": "all",
     "tabWidth": 2,
     "printWidth": 120,
     "endOfLine": "auto",
     "overrides": [{ "files": "*.css", "options": { "singleQuote": false } }]
   }
   ```

   The CSS override was added in Step 3. `singleQuote` also applies to CSS, which has always used double quotes, and the static-files test in `src/app.test.ts` checks for `@import url("layout.css")`.

3. Add `.prettierignore`:

   ```
   dist/
   data/
   node_modules/
   package-lock.json
   src/db/__fixtures__/
   *.md
   ```

4. Add the scripts `"format": "prettier --write ."` and `"format:check": "prettier --check ."`. Don't run `format` yet.
5. Run `npx prettier --list-different .` and note how many files would change, as a sanity check that the config is close to the current style. If more than about half the files change, revisit the config (for example `arrowParens` or `bracketSameLine` for JSX) before moving on.
6. Run `npm run validate`, then pause for review. **Commit 2:** "Add Prettier config and format scripts".

## Step 3 — Format the codebase (5.3)

1. Run `npm run validate` and note the test count.
2. Before formatting, add `// prettier-ignore` to the five seed tables in `src/db/seedData.ts`, so each keeps one row per line, and add the CSS override above. Commit these on their own first ("Tune Prettier for the seed tables and CSS quotes"), so the formatting commit stays pure Prettier output.
3. Run `npm run format`.
4. Run `npm run validate` again. It must pass with the same test count.
5. Check that `git status` shows only files in Prettier's scope (`.ts`, `.tsx`, `.css`, `.json`, `.mjs`), and that `package.json` changed only in layout, if at all.
6. Pause for review. **Commit 3:** "Format the codebase with Prettier", containing Prettier's output and nothing else.

## Step 4 — Wire it into validate, and update the docs (5.4)

1. Make lint also check formatting, and make validate run the three steps in order:

   ```json
   "lint": "eslint . && prettier --check .",
   "validate": "npm run typecheck && npm run lint && npm test"
   ```

2. Add `.git-blame-ignore-revs` with the full hash of commit 3 and a comment line saying what it is. Mention `git config blame.ignoreRevsFile .git-blame-ignore-revs` in the README.
3. Update the README's script table: `lint`, `lint:fix`, `format`, `format:check`, and the new meaning of `validate`.
4. Update `specs/tech-stack.md`: add ESLint and Prettier rows to "Current stack", and remove the linting row from "Gaps to close" (or mark it closed).
5. Mark 5.1–5.4 ✅ in `specs/roadmap.md`, and add a CHANGELOG entry.
6. Work through `validation.md`, then pause for review. **Commit 4:** "Run lint in validate and document the new scripts".

## Risks

| Risk | Mitigation |
|---|---|
| Prettier's JSX layout differs a lot from the hand-written views | Step 2.5 measures the diff before anything is formatted, and the config can be tuned then. |
| CRLF working tree on Windows makes `prettier --check` fail on every file | `endOfLine: "auto"` keeps whatever line ending each file already has. |
| A lint fix changes behaviour | Fixes go in commit 1, separate from formatting, and the full test suite runs after them. |
| ESLint picks up the built output or fixtures | They're listed in `ignores`, and `dist/` and `data/` are git-ignored anyway. |

## Findings

Filled in during Step 1.

| File:line | Rule | Fixed or disabled | Why |
|---|---|---|---|
| `src/time.ts:57` | `no-irregular-whitespace` | Fixed | The regex held a literal narrow no-break space (U+202F), which you can't see in the editor. It's now written as the escape `\u202f`. The behaviour is the same, and the `formatSlot` tests still pass. |
