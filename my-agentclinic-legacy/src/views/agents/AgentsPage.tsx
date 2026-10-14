import type { Agent } from '../../db/agents'
import { EmptyState, Notice, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

export const AGENTS_NOTICES = {
  deleted: 'Agent deleted. We wish them well out there.',
} as const

type AgentsPageProps = {
  agents: Agent[]
  notice?: keyof typeof AGENTS_NOTICES
}

export const AgentsPage = ({ agents, notice }: AgentsPageProps) => (
  <Layout title={pageTitle('Agents')} path="/agents">
    <PageHeader title="Agents" lead="Our patients. Every one of them is doing their best." />
    <Notice message={notice && AGENTS_NOTICES[notice]} />
    <p>
      <a href="/agents/new" role="button">
        Add an agent
      </a>
    </p>
    {agents.length === 0 ? (
      <EmptyState>
        No agents on the books yet. <a href="/agents/new">Add the first one</a>, or run <code>npm run db:seed</code> to
        invite a few.
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
