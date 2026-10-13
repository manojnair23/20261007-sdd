import type { Agent } from '../../db/agents'
import type { Ailment } from '../../db/ailments'
import { EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type AgentPageProps = {
  agent: Agent
  ailments: Ailment[]
}

export const AgentPage = ({ agent, ailments }: AgentPageProps) => (
  <Layout title={pageTitle(agent.name)} path={`/agents/${agent.id}`}>
    <PageHeader title={agent.name} lead={agent.model} />
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
    </div>
  </Layout>
)
