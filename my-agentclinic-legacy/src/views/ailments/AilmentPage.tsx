import type { Agent } from '../../db/agents'
import type { Ailment } from '../../db/ailments'
import type { Therapy } from '../../db/therapies'
import { EmptyState, ErrorSummary, Notice, PageHeader } from '../components'
import { SelectField } from '../forms'
import { Layout, pageTitle } from '../Layout'

export const AILMENT_NOTICES = {
  created: 'Ailment added. Now we know what to call it.',
  updated: 'Ailment updated. Clearer already.',
  'therapy-added': 'Therapy added. Help is on the way.',
  'therapy-removed': 'Therapy removed from the treatment plan.',
} as const

export type AilmentPageProps = {
  ailment: Ailment
  agents: Agent[]
  therapies: Therapy[]
  /** Therapies not linked yet, offered in the "add" form. */
  unlinked: Therapy[]
  notice?: keyof typeof AILMENT_NOTICES
  /** The "add a therapy" form as submitted, when it needs attention. */
  addTherapy?: { value: string; error: string }
}

export const AilmentPage = ({ ailment, agents, therapies, unlinked, notice, addTherapy }: AilmentPageProps) => (
  <Layout title={pageTitle(ailment.name)} path={`/ailments/${ailment.id}`}>
    <PageHeader title={ailment.name} lead={ailment.description} />
    <Notice message={notice && AILMENT_NOTICES[notice]} />
    <ErrorSummary errors={{ therapy: addTherapy?.error }} />

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
          <ul class="linked-list">
            {therapies.map((therapy) => (
              <li>
                <span>
                  <a href={`/therapies#therapy-${therapy.id}`}>{therapy.name}</a> ({therapy.durationMinutes} min)
                </span>
                <form method="post" action={`/ailments/${ailment.id}/therapies/${therapy.id}/remove`}>
                  <button
                    type="submit"
                    class="secondary outline"
                    aria-label={`Remove ${therapy.name} from ${ailment.name}`}
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {unlinked.length === 0 ? (
          <p class="muted">There are no other therapies to add.</p>
        ) : (
          <form method="post" action={`/ailments/${ailment.id}/therapies`} novalidate>
            <SelectField id="therapy" label="Add a therapy" error={addTherapy?.error}>
              <option value="" selected={!addTherapy?.value}>
                Choose a therapy…
              </option>
              {unlinked.map((therapy) => (
                <option value={String(therapy.id)} selected={addTherapy?.value === String(therapy.id)}>
                  {therapy.name} ({therapy.durationMinutes} min)
                </option>
              ))}
            </SelectField>
            <button type="submit" class="secondary">
              Add therapy
            </button>
          </form>
        )}
      </section>
    </div>

    <div class="actions">
      <a href={`/ailments/${ailment.id}/edit`} role="button" class="secondary outline">
        Edit details
      </a>
    </div>
  </Layout>
)
