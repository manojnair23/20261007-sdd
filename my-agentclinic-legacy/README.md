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
| `npm run validate` | Typecheck, then run the full Vitest suite. Run this before review |
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled server |
| `npm run db:migrate` | Apply pending SQL migrations from `migrations/` |
| `npm run db:seed` | Load the demo data into an empty clinic. If appointments already exist it refuses; `npm run db:seed -- --force` **wipes** all clinic data and reloads the seed |

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
6. `npm run db:seed -- --force` resets everything for the next visitor.

Everything works with JavaScript disabled.
