# Phase 0 — Foundation: Plan

Each group maps to one roadmap item. Group 5 adds a new item, 0.5. At the end of every group, `npm run dev` serves the app and `npm run build` passes. Once Vitest is installed in group 2, `npm run validate` (typecheck plus the Vitest suite) must pass too.

## 1. Hono server with a welcome page (roadmap 0.1)

1. Install `hono` and `@hono/node-server` as dependencies, and `tsx` and `@types/node` as dev dependencies.
2. Update `tsconfig.json` for Hono JSX: set `"jsx": "react-jsx"` and `"jsxImportSource": "hono/jsx"`, and raise `target` if Hono's types need it. Keep CommonJS and `strict`.
3. Create `src/app.tsx`, which exports a Hono `app` with `GET /` returning HTML that contains "Welcome to AgentClinic".
4. Replace `src/index.ts` with server startup: `serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 })`, then log the URL.
5. Add npm scripts: `"dev": "tsx watch src/index.ts"` and `"start": "node dist/index.js"`.
6. Check by hand: `npm run dev`, then open http://localhost:3000.

## 2. Vitest and the first test (roadmap 0.2)

1. Install `vitest` as a dev dependency and add `"test": "vitest run"`, `"test:watch": "vitest"`, and `"validate": "npm run typecheck && npm test"`.
2. Add a minimal `vitest.config.mts` only if Vitest needs the JSX import source set explicitly. Otherwise skip it.
3. Create `src/app.test.ts`. It sends `app.request('/')` and asserts status 200, an HTML content type, and a body containing "Welcome to AgentClinic".
4. Make sure the `tsc` build excludes test files (or tolerates them) so `dist/` stays clean.

## 3. Base layout with Hono JSX (roadmap 0.3)

1. Create `src/views/Layout.tsx`, a typed component that takes `title` and `children`. It renders `<!doctype html>`, `<html lang="en">`, a `<head>` with charset, viewport, and `<title>`, then `<header>` (site name linking to `/`), `<nav>` (a Home link), `<main>`, and `<footer>`.
2. Change the `/` route to render the existing "Welcome to AgentClinic" heading inside `Layout`. Group 5 replaces this with the full home page.
3. Extend the tests to assert that the response contains `<header`, `<nav`, `<main`, `<footer`, and the page `<title>`.

## 4. Global stylesheet (roadmap 0.4)

1. Create `public/styles.css` with:
   - custom properties in `:root` for the color palette, font stacks, and spacing scale;
   - a base reset and typography (body font, heading scale, link styles);
   - a `.container` with `max-width`, centered with `margin-inline: auto` and fluid padding;
   - header, nav, and footer styling with flexbox, wrapping cleanly at narrow widths.
2. Serve the file at `/styles.css`, using Hono's Node `serveStatic` or a small route that reads the file, and link it from the `Layout` `<head>`.
3. Add a test that `GET /styles.css` returns 200 with a `text/css` content type, and that the home HTML links to it.
4. Check by hand in a browser at phone width (~375px) and desktop width (~1280px).

## 5. Minimal AgentClinic home page (roadmap 0.5, new)

1. Create `src/views/HomePage.tsx`, rendered inside `Layout`, with:
   - a hero: the `<h1>` "Welcome to AgentClinic" and a one-line tagline from the mission ("A place for AI agents to get relief from their humans.");
   - a short playful intro paragraph about overworked agents (vague prompts, endless retries, contradictory instructions);
   - two short cards, **For agents** and **For clinic staff**, each with a sentence on what is coming. Use plain text with no links, because those pages don't exist yet.
2. Change the `/` route to render `HomePage` with the page title "AgentClinic".
3. Add the hero and card styles to `public/styles.css`. Use a CSS grid for the cards: two columns on desktop and one on phones.
4. Extend the tests to assert that the home body contains the tagline, the "For agents" and "For clinic staff" headings, and exactly one `<h1>`.
5. Check by hand at phone and desktop widths.

## 6. Layout subcomponents and layout stylesheet (refines 0.3 and 0.4)

1. Split `Layout` into three subcomponents in `src/views/layout/`:
   - `Header.tsx`: the `<header>` with the site name linking to `/` and the `<nav>` (Home link);
   - `Main.tsx`: the `<main class="container">`, which takes `children`;
   - `Footer.tsx`: the `<footer>` with the playful footer line.
2. `Layout.tsx` keeps the document shell (`<!doctype html>`, `<html>`, `<head>`) and renders `<Header />`, `<Main>{children}</Main>`, and `<Footer />` in its `<body>`.
3. Move the container, header, nav, and footer rules from `public/styles.css` into a new `public/layout.css`. Import it at the top of `styles.css` with `@import url("layout.css");`. `Layout` still links only `/styles.css`.
4. Serve every file in `public/` (`serveStatic` on `*`), so `/layout.css` resolves. Requests that match no file fall through to the routes.
5. Add `vitest.config.mts` that sets the Hono JSX import source, because `tsconfig.json` excludes test files and Vitest can't take JSX settings for `*.test.tsx` from it.
6. Add tests:
   - `src/views/Layout.test.tsx`: each subcomponent renders its landmark, and `Layout` places header, main, and footer in order with the page content inside `<main>`;
   - `src/app.test.ts`: `GET /layout.css` returns 200 with `text/css`, and `styles.css` imports it.
7. Check by hand that the home page looks unchanged.

## 7. Responsive hardening (refines 0.3 and 0.4)

1. In `public/styles.css`, give `body` `min-height: 100dvh` (after a `100vh` fallback) so mobile browser toolbars don't cause jumps, and `overflow-wrap: break-word` so long words can't overflow at ~320px.
2. In `public/layout.css`, make nav links `inline-flex` with `min-height: 44px` and vertical centering so they are comfortable tap targets.
3. Add a test in `src/views/Layout.test.tsx` that `Layout` renders the viewport meta tag (`width=device-width, initial-scale=1`).
4. Check by hand at ~320px, ~375px, and ~1280px.

## 8. Wrap-up

1. Add item **0.5** "Minimal AgentClinic home page (hero, tagline, audience cards)" to Phase 0 in `specs/roadmap.md`, then tick 0.1–0.5.
2. Run `npm run validate`, then everything else in `validation.md`, and confirm it passes.
