# Phase 0 — Foundation: Validation

The `phase-0-foundation` branch can be merged only when **every** check below passes.

## 1. Automated tests: `npm run validate`

The test files typecheck, Vitest exits 0, and the following tests exist and pass:

- [x] `GET /` returns **200** with an `text/html` content type.
- [x] `GET /` body contains **"Welcome to AgentClinic"**.
- [x] `GET /` body contains the layout landmarks: `<header`, `<nav`, `<main`, `<footer`, and a `<title>`.
- [x] `Header`, `Main`, and `Footer` each render their landmark when tested on their own, and `Layout` renders them in that order with the page content inside `<main>`.
- [x] `GET /` body contains the tagline "A place for AI agents to get relief from their humans.", the "For agents" and "For clinic staff" headings, and exactly one `<h1>`.
- [x] `GET /styles.css` returns **200** with a `text/css` content type, and the home page `<head>` links to it.
- [x] `Layout` renders the viewport meta tag `width=device-width, initial-scale=1`.

## 2. Type-checked build: `npm run build`

- [x] `tsc` completes with **zero errors**, with `strict: true` still enabled.
- [x] `npm start` runs the compiled `dist/index.js` and serves the home page.

## 3. Manual browser check: `npm run dev`

- [x] The server starts with `tsx watch` on port 3000 by default, and on another port when `PORT` is set.
- [x] http://localhost:3000 shows the home page with header, nav, hero, intro, both audience cards, and footer.
- [x] The audience cards sit in two columns at ~1280px and stack into one column at ~375px.
- [x] Styles apply: palette colors, typography, and a centered container.
- [x] The layout is responsive: no horizontal scroll at ~375px, and the content is comfortably centered at ~1280px.
- [ ] No horizontal scroll at ~320px, and long text wraps instead of overflowing.
- [ ] Nav links are at least 44px tall.
- [x] Editing a view reloads the server automatically in watch mode.
- [x] Checked in at least one current evergreen browser (Chrome, Edge, Firefox, or Safari).

## 4. Specs kept in sync

- [x] Item **0.5** (minimal home page) is added to Phase 0 in `specs/roadmap.md`, and items **0.1–0.5** are ticked on this branch.
- [x] `Header.tsx`, `Main.tsx`, and `Footer.tsx` exist as separate files in `src/views/layout/`, and `Layout.tsx` imports and composes them instead of inlining their markup.
- [x] Any change from `requirements.md` (for example, how the stylesheet ended up being served) is noted in that file.

## Definition of done

All boxes above are checked, the app runs, and the branch contains only Phase 0 work plus spec updates.
