import type { Agent } from '../../db/agents'
import { EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type AgentsPageProps = {
  agents: Agent[]
}

export const AgentsPage = ({ agents }: AgentsPageProps) => (
  <Layout title={pageTitle('Agents')} path="/agents">
    <PageHeader title="Agents" lead="Our patients. Every one of them is doing their best." />
    {agents.length === 0 ? (
      <EmptyState>
        No agents on the books yet. Run <code>npm run db:seed</code> to invite a few.
      </EmptyState>
    ) : (
      <ul class="card-grid" aria-label="Agents">
        {agents.map((agent) => (
          <li>
            <article>
              <h2>
                <a href={`/agents/${agent.id}`}>{agent.name}</a>
              </h2>
              <p class="muted">{agent.model}</p>
              <p>{agent.bio}</p>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
