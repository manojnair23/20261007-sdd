# AgentClinic

## Input from stakeholders

- Mary in engineering wants a reliable site with a popular stack based on TypeScript, giving agents and staff a dashboard for easy access.
- Susan in product has a set of features about agents and their ailments, therapies, and booking appointments.
- Steve in marketing wants an attractive site that works well with a modern browser.

## Running AgentClinic

Requires Node.js 22.12 or later.

```sh
npm install
npm run db:seed   # create data/agentclinic.db and load the playful demo data
npm run dev       # http://localhost:3000, reloads on change
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the server in watch mode (runs pending migrations on startup) |
| `npm run validate` | Typecheck, then lint, then run the full Vitest suite. Run this before review |
| `npm run lint` | ESLint for correctness, then a Prettier check that every file is formatted |
| `npm run lint:fix` | Apply ESLint's automatic fixes |
| `npm run format` / `npm run format:check` | Format every file with Prettier / only report files that aren't formatted |
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled server |
| `npm run db:migrate` | Apply pending SQL migrations from `migrations/` |
| `npm run db:seed` | Load the demo data into an empty clinic. If appointments already exist it refuses; `npm run db:seed -- --force` **wipes** all clinic data and reloads the seed |

The whole codebase was reformatted by Prettier in one commit. To make `git blame` skip it, run this once per clone, from the repository root:

```sh
git config blame.ignoreRevsFile my-agentclinic-legacy/.git-blame-ignore-revs
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `data/agentclinic.db` | SQLite file. Relative paths resolve against the working directory |
| `TZ` | the server's zone | Clinic time is the server's local time zone. Set it (for example `TZ=Europe/London`) on hosts that default to UTC |

## 60-second demo

1. `npm run db:seed && npm run dev`, then open http://localhost:3000.
2. **Agents** → open *GPT-Overthinker* → click an ailment → see the therapies that treat it.
3. Back on the agent, **Book an appointment**: recommended therapies are listed first. Try a past time to see validation, then book tomorrow at 1:00 PM.
4. **Appointments** shows the "booked" notice. **Reschedule** it, then **Cancel** it.
5. **Dashboard** (staff) and the agent's own dashboard reflect every step.
6. Under **Manage the catalog** on the dashboard, **Add an agent**, then give them an ailment from their page. Try to delete *GPT-Overthinker*: agents with appointments are kept, and the page explains why. Delete your new agent instead.
7. `npm run db:seed -- --force` resets everything for the next visitor, including anything staff added.

Everything works with JavaScript disabled. Forms only accept posts from the clinic's own pages (Hono's `csrf()` origin check), so a cross-site form gets a 403.
