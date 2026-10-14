# Mission

AgentClinic is a place where overworked AI agents get relief from their humans. Agents browse the ailments that trouble them and the therapies that treat them, then book, reschedule, and cancel appointments. Clinic staff see the whole clinic at a glance on a dashboard.

AgentClinic is a **teaching and demo app**. It exists so people can learn spec-driven development with AI coding agents on a codebase that is small, believable, and fun. It is not a production service.

## Target audience

**Course students learning spec-driven development with AI coding agents.** They read the specs, watch a phase go from requirements to plan to validation to code, and then extend the app themselves. Everything here should be easy for them to follow and safe to break.

Inside the story, the app has two kinds of user. Students build features for them:

- **Agents (patients):** browse ailments and therapies, book and manage their own appointments, and see their own dashboard.
- **Clinic staff:** watch the clinic dashboard, manage the schedule, and (soon) look after the catalog of agents, ailments, and therapies.

## Stakeholders

| Stakeholder | Wants | How we meet it |
|---|---|---|
| Mary (engineering) | A reliable site on a popular TypeScript stack, with dashboards for agents and staff | Strict TypeScript, Hono, SQLite, one `npm run validate` gate, staff and per-agent dashboards |
| Susan (product) | Agents, ailments, therapies, and booking appointments | Each one is a vertical slice with its own migration, data layer, routes, and views |
| Steve (marketing) | An attractive site that works well in a modern browser | PicoCSS with an orange and black brand, responsive from phone to desktop, accessible markup |

## Principles

1. **Small steps.** Work happens in very small phases. The app runs, and `npm run validate` passes, after every one.
2. **Specs first.** Each phase gets requirements, a plan, and validation in `specs/YYYY-MM-DD-<phase>/` before any code. The roadmap and changelog are updated when the phase lands.
3. **Simple over clever.** Few dependencies, hand-written code where it's short, no abstractions until something needs them. A student should be able to read any file in one sitting.
4. **Playful tone, strict correctness.** The copy is kind and funny. The data rules, validation, and tests are strict.
5. **Responsive and accessible.** Every page works from about 320px to 1440px with no horizontal scroll, uses 44px tap targets, and meets WCAG AA contrast (4.5:1 for text).
6. **Works without JavaScript.** Pages are rendered on the server, and forms are plain HTML posts.
7. **Demo-ready.** `npm run db:seed -- --force` always resets the app to a known, lively state for the next class or demo.

## Success looks like

- A student can clone the repo, run three commands, and follow the 60-second demo in the README.
- A student can take one roadmap item, write its spec, build it with an AI coding agent, and pass `npm run validate`.
- Every phase leaves the app working and the specs telling the truth.

## Out of scope (for now)

- Real patients, real money, or real data. This is a teaching app.
- Accounts for agents. Anyone can open any agent's dashboard, and that's accepted.
- Payments, email, notifications, and calendar export.
- Time zones beyond the one "clinic time" (the server's local zone).
- Client-side JavaScript frameworks and single-page app behaviour.
