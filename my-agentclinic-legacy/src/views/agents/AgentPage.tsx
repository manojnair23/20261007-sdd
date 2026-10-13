import type { Agent } from '../../db/agents'
import type { Ailment } from '../../db/ailments'
import { EmptyState, ErrorSummary, Notice, PageHeader } from '../components'
import { SelectField } from '../forms'
import { Layout, pageTitle } from '../Layout'

export const AGENT_NOTICES = {
  created: 'Agent added. Welcome to the clinic.',
  updated: 'Details saved. A fresh start.',
  'ailment-added': 'Ailment added. Naming it is the first step.',
  'ailment-removed': 'Ailment removed. One less thing to carry.',
} as const

export type AgentPageProps = {
  agent: Agent
  ailments: Ailment[]
  /** Ailments the agent doesn't have yet, offered in the "add" form. */
  unassigned: Ailment[]
  notice?: keyof typeof AGENT_NOTICES
  /** The "add an ailment" form as submitted, when it needs attention. */
  addAilment?: { value: string; error: string }
}

export const AgentPage = ({ agent, ailments, unassigned, notice, addAilment }: AgentPageProps) => (
  <Layout title={pageTitle(agent.name)} path={`/agents/${agent.id}`}>
    <PageHeader title={agent.name} lead={agent.model} />
    <Notice message={notice && AGENT_NOTICES[notice]} />
    <ErrorSummary errors={{ ailment: addAilment?.error }} />
    <p>{agent.bio}</p>

    <section aria-labelledby="ailments-heading">
      <h2 id="ailments-heading">Ailments</h2>
      {ailments.length === 0 ? (
        <EmptyState>No ailments on file. Lucky agent.</EmptyState>
      ) : (
        <ul class="linked-list">
          {ailments.map((ailment) => (
            <li>
              <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
              <form method="post" action={`/agents/${agent.id}/ailments/${ailment.id}/remove`}>
                <button
                  type="submit"
                  class="secondary outline"
                  aria-label={`Remove ${ailment.name} from ${agent.name}`}
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {unassigned.length === 0 ? (
        <p class="muted">There are no other ailments to add.</p>
      ) : (
        <form method="post" action={`/agents/${agent.id}/ailments`} novalidate class="narrow">
          <SelectField id="ailment" label="Add an ailment" error={addAilment?.error}>
            <option value="" selected={!addAilment?.value}>
              Choose an ailment…
            </option>
            {unassigned.map((ailment) => (
              <option value={String(ailment.id)} selected={addAilment?.value === String(ailment.id)}>
                {ailment.name}
              </option>
            ))}
          </SelectField>
          <button type="submit" class="secondary">
            Add ailment
          </button>
        </form>
      )}
    </section>

    <div class="actions">
      <a href={`/appointments/new?agent=${agent.id}`} role="button">
        Book an appointment
      </a>
      <a href={`/agents/${agent.id}/dashboard`} role="button" class="secondary outline">
        {agent.name}'s dashboard
      </a>
      <a href={`/agents/${agent.id}/edit`} role="button" class="secondary outline">
        Edit details
      </a>
      <a href={`/agents/${agent.id}/delete`} role="button" class="secondary outline">
        Delete agent
      </a>
    </div>
  </Layout>
)
