import type { Agent } from '../../db/agents'
import type { Ailment } from '../../db/ailments'
import { EmptyState, Notice, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

export const AGENT_NOTICES = {
  created: 'Agent added. Welcome to the clinic.',
  updated: 'Details saved. A fresh start.',
} as const

type AgentPageProps = {
  agent: Agent
  ailments: Ailment[]
  notice?: keyof typeof AGENT_NOTICES
}

export const AgentPage = ({ agent, ailments, notice }: AgentPageProps) => (
  <Layout title={pageTitle(agent.name)} path={`/agents/${agent.id}`}>
    <PageHeader title={agent.name} lead={agent.model} />
    <Notice message={notice && AGENT_NOTICES[notice]} />
    <p>{agent.bio}</p>

    <section aria-labelledby="ailments-heading">
      <h2 id="ailments-heading">Ailments</h2>
      {ailments.length === 0 ? (
        <EmptyState>No ailments on file. Lucky agent.</EmptyState>
      ) : (
        <ul>
          {ailments.map((ailment) => (
            <li>
              <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
            </li>
          ))}
        </ul>
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
    </div>
  </Layout>
)
