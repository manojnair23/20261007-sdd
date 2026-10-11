import type { Agent } from '../../db/agents'
import type { Ailment } from '../../db/ailments'
import type { Therapy } from '../../db/therapies'
import { EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type AilmentPageProps = {
  ailment: Ailment
  agents: Agent[]
  therapies: Therapy[]
}

export const AilmentPage = ({ ailment, agents, therapies }: AilmentPageProps) => (
  <Layout title={pageTitle(ailment.name)} path={`/ailments/${ailment.id}`}>
    <PageHeader title={ailment.name} lead={ailment.description} />

    <div class="two-up">
      <section aria-labelledby="agents-heading">
        <h2 id="agents-heading">Agents affected</h2>
        {agents.length === 0 ? (
          <EmptyState>No agents have this right now.</EmptyState>
        ) : (
          <ul>
            {agents.map((agent) => (
              <li>
                <a href={`/agents/${agent.id}`}>{agent.name}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="therapies-heading">
        <h2 id="therapies-heading">Treated by</h2>
        {therapies.length === 0 ? (
          <EmptyState>No therapy for this one yet. We're working on it.</EmptyState>
        ) : (
          <ul>
            {therapies.map((therapy) => (
              <li>
                <a href={`/therapies#therapy-${therapy.id}`}>{therapy.name}</a> ({therapy.durationMinutes} min)
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  </Layout>
)
