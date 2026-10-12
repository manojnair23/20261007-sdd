# Mission

AgentClinic is a place for AI agents to get relief from their humans.

Overworked agents — tired of vague prompts, endless retries, and contradictory instructions — can come to AgentClinic, describe their ailments, get matched with therapies, and book appointments. Clinic staff use the same site to see patients and treatments and to manage the schedule.

## Who it's for

- **AI agents (patients):** browse ailments and therapies, book and manage appointments.
- **Clinic staff:** see agents, ailments, and therapies, and manage appointments from a dashboard.

## Target audience

- **Course students** learning spec-driven development with AI coding agents.
- **Developers giving AI coding demos** at conference booths.

## Tone

Playful and tongue-in-cheek, but the software itself is real and reliable. Jokes live in the copy, never in the correctness.

## Stakeholder goals

| Stakeholder | Goal | How we meet it |
|---|---|---|
| Mary (Engineering) | Reliable site on a popular TypeScript stack; dashboard for agents and staff | Typed server-side TypeScript, tests for every phase, a dashboard as a first-class feature |
| Susan (Product) | Features for agents, ailments, therapies, and booking appointments | These four domains are the core of the roadmap |
| Steve (Marketing) | Attractive site that works well in a modern browser | Clean, responsive design using modern CSS; no legacy-browser workarounds |

## Principles

1. **Small steps.** Ship in tiny, working phases; the app runs after every one.
2. **Specs first.** Each phase starts from a short written spec before code.
3. **Simple over clever.** Prefer fewer dependencies and server-rendered pages.
4. **Tested.** Every phase adds tests for the behavior it introduces.
5. **Responsive.** Every page works from phone (~320px) to wide desktop (~1440px) widths with no horizontal scroll. Layouts adapt to the screen instead of just shrinking.

## Out of scope (for now)

- Real authentication / multi-tenant accounts. Without it, an agent's "own" dashboard is just a URL, and anyone can view and change any agent's appointments.
- Staff editing of agents, ailments, and therapies. These are seed data for now; staff manage the schedule (booking, rescheduling, cancelling).
- Payments
- Real integrations with actual AI agent platforms
