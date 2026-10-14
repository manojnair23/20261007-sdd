# Tech stack

The stack is popular, TypeScript from end to end, and deliberately small, so students can hold the whole thing in their heads.

## Current stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 22.12+ | Set in `engines`. |
| Language | TypeScript 5, `strict` on | `tsconfig.json` typechecks everything, including tests. `tsconfig.build.json` builds `src/` (without the tests) to `dist/`. |
| Web framework | [Hono](https://hono.dev) 4 on `@hono/node-server` | Small and fast, with a familiar Express-like API. Hono JSX renders on the server. |
| Views | Hono JSX (`.tsx`) | Server-rendered HTML only. There are no client bundles. |
| Styling | [PicoCSS](https://picocss.com) 2 + `public/styles.css`, `public/layout.css` | Pico is served from the installed package (no CDN). The brand is black primary with an orange accent; orange text is `#c2410c` or darker for contrast. Custom CSS only covers what Pico doesn't. |
| Database | SQLite via `better-sqlite3` | One file, `data/agentclinic.db` (override with `DB_PATH`). It's synchronous, needs no server, and is perfect for demos. |
| Migrations | Hand-written ordered SQL in `migrations/NNNN_name.sql` | They run on startup and with `npm run db:migrate`. There's no `BEGIN`/`COMMIT` inside a migration file; the runner wraps each one. |
| Seed data | `src/db/seedData.ts`, run by `npm run db:seed` | Resets the demo. It refuses if appointments exist, unless `--force` is passed. |
| Tests | Vitest 5 | Unit, data-layer, route, accessibility sweep, and link-crawler tests. Tests use an in-memory database and a fixed clock through `createApp({ db, now })`. |
| Linting | ESLint 10, flat config (`eslint.config.mjs`) with `@eslint/js` and `typescript-eslint` recommended rules | For correctness only. `eslint-config-prettier` turns off every rule that Prettier owns. |
| Formatting | Prettier 3 (`.prettierrc`) | No semicolons, single quotes (double in CSS), trailing commas, print width 120. Markdown, SQL, and test fixtures aren't formatted. The seed tables in `src/db/seedData.ts` opt out with `// prettier-ignore`. |
| Dev loop | `tsx watch` | `npm run dev` reloads on change. |

## Conventions

- **Structure:** `src/routes/<domain>.tsx` (routes), `src/db/<domain>.ts` (data access), `src/views/<domain>/` (pages), and shared rules such as `src/appointments/validate.ts`.
- **No SQL in route handlers.** Routes call typed data-layer functions that return plain row types.
- **Dependency injection:** `createApp(deps)` takes the database and the clock. Never import a global database into a route.
- **Forms:** POST-Redirect-GET with a 303 on success, a re-rendered form with a 400 on validation errors, and a 409 for actions that are no longer allowed. Forms use `novalidate`, and the server enforces every rule. Fields come from `src/views/forms.tsx` and validators return `Validated` from `src/validation.ts`.
- **CSRF:** `csrf()` runs on every request; a post without a same-origin `Origin` (or `Sec-Fetch-Site`) gets a 403 page. Tests post through `post()` in `src/test/testApp.ts`, which sends the same-origin header.
- **Deleting:** always a GET confirmation page, then a POST. Agents and therapies with any appointment can't be deleted (409), so history stays whole.
- **Notices:** `?notice=<key>` after a redirect, read with `noticeKey()`. They read "<Record> <verb>. <a short, kind line>.", and `src/views/notices.test.ts` checks that.
- **Clinic time:** naive local `YYYY-MM-DDTHH:mm` strings. Set `TZ` to pin the zone.
- **Accessibility:** one `<h1>` per page, a skip link, labelled fields, `scope` on table headers, visible focus, and `aria-current` in the nav.
- **One gate:** `npm run validate` (typecheck → lint → test) must pass before review and after every phase. `npm run lint` covers both ESLint and the Prettier check, and `npm run format` fixes formatting.

## Gaps to close

| Gap | Decision | Roadmap |
|---|---|---|
| ~~**Linting and formatting**~~ | **Closed in Phase 5.** ESLint and Prettier are in the current stack above, and `npm run validate` runs typecheck → lint → test. | Phase 5 ✅ |
| ~~**Staff writes and CSRF**~~ | **Closed in Phase 6.** Staff manage agents, ailments, and therapies with plain HTML posts, and `csrf()` checks the origin of every post. See the conventions above. | Phase 6 ✅ |

### Deliberately not added (for now)

- **An ORM or query builder.** Hand-written SQL in a small data layer is easier to read and teach.
- **Client-side JavaScript or SPA frameworks.** See the mission principle "Works without JavaScript".
- **Authentication.** It's out of scope in the mission. We'll revisit it if a phase really needs to tell staff apart from agents.
- **Browser end-to-end tests, CI, and deployment tooling.** These are useful, but not needed for the teaching goal yet. Each can become a small roadmap phase later.

## Non-goals

- No runtime dependency is added without a sentence in a phase spec saying why.
- No build step for CSS or client assets.
