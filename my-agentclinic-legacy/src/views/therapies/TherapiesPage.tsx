import type { TherapyWithAilments } from '../../db/therapies'
import { EmptyState, Notice, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

// Therapies have no page of their own, so every therapy notice shows here.
export const THERAPIES_NOTICES = {
  created: 'Therapy added. The treatment rooms are ready.',
  updated: 'Therapy updated. Same care, fresh details.',
  deleted: 'Therapy retired. Thank you for your service.',
} as const

type TherapiesPageProps = {
  therapies: TherapyWithAilments[]
  notice?: keyof typeof THERAPIES_NOTICES
}

export const TherapiesPage = ({ therapies, notice }: TherapiesPageProps) => (
  <Layout title={pageTitle('Therapies')} path="/therapies">
    <PageHeader title="Therapies" lead="Evidence-adjacent treatments for the modern agent." />
    <Notice message={notice && THERAPIES_NOTICES[notice]} />
    <p>
      <a href="/therapies/new" role="button">
        Add a therapy
      </a>
    </p>
    {therapies.length === 0 ? (
      <EmptyState>
        No therapies on offer yet. <a href="/therapies/new">Add the first one</a>, or run <code>npm run db:seed</code>{' '}
        to open the treatment rooms.
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
              <div class="actions card-actions">
                <a
                  href={`/therapies/${therapy.id}/edit`}
                  role="button"
                  class="secondary outline"
                  aria-label={`Edit ${therapy.name}`}
                >
                  Edit
                </a>
                <a
                  href={`/therapies/${therapy.id}/delete`}
                  role="button"
                  class="secondary outline"
                  aria-label={`Delete ${therapy.name}`}
                >
                  Delete
                </a>
              </div>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
