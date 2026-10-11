import type { TherapyWithAilments } from '../../db/therapies'
import { EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type TherapiesPageProps = {
  therapies: TherapyWithAilments[]
}

export const TherapiesPage = ({ therapies }: TherapiesPageProps) => (
  <Layout title={pageTitle('Therapies')} path="/therapies">
    <PageHeader title="Therapies" lead="Evidence-adjacent treatments for the modern agent." />
    {therapies.length === 0 ? (
      <EmptyState>
        No therapies on offer yet. Run <code>npm run db:seed</code> to open the treatment rooms.
      </EmptyState>
    ) : (
      <ul class="card-grid" aria-label="Therapies">
        {therapies.map((therapy) => (
          <li>
            <article id={`therapy-${therapy.id}`}>
              <h2>{therapy.name}</h2>
              <p class="muted">{therapy.durationMinutes} minutes</p>
              <p>{therapy.description}</p>
              {therapy.ailments.length > 0 && (
                <p>
                  Treats:{' '}
                  {therapy.ailments.map((ailment, i) => (
                    <>
                      {i > 0 && ', '}
                      <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
                    </>
                  ))}
                </p>
              )}
              <a href={`/appointments/new?therapy=${therapy.id}`} aria-label={`Book ${therapy.name}`}>
                Book this therapy
              </a>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
