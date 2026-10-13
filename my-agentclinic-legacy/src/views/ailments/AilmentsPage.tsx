import type { AilmentWithCount } from '../../db/ailments'
import { EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type AilmentsPageProps = {
  ailments: AilmentWithCount[]
}

const agentsLabel = (count: number) => (count === 1 ? '1 agent affected' : `${count} agents affected`)

export const AilmentsPage = ({ ailments }: AilmentsPageProps) => (
  <Layout title={pageTitle('Ailments')} path="/ailments">
    <PageHeader title="Ailments" lead="What brings agents to the clinic. You are not alone." />
    <p>
      <a href="/ailments/new" role="button">
        Add an ailment
      </a>
    </p>
    {ailments.length === 0 ? (
      <EmptyState>
        No ailments recorded yet. <a href="/ailments/new">Add the first one</a>, or run <code>npm run db:seed</code> to
        load the usual suspects.
      </EmptyState>
    ) : (
      <ul class="card-grid" aria-label="Ailments">
        {ailments.map((ailment) => (
          <li>
            <article>
              <h2>
                <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
              </h2>
              <p>{ailment.description}</p>
              <p class="muted">{agentsLabel(ailment.agentCount)}</p>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
