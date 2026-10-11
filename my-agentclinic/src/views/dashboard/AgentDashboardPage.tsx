import type { AgentDashboard } from '../../db/dashboard'
import { formatSlot } from '../../time'
import { AppointmentTable, EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type AgentDashboardPageProps = {
  dashboard: AgentDashboard
}

export const AgentDashboardPage = ({ dashboard }: AgentDashboardPageProps) => {
  const { agent, ailments, upcoming, past, cancelled } = dashboard
  const history = [...past, ...cancelled].sort((a, b) => b.startsAt.localeCompare(a.startsAt))
  return (
    <Layout title={pageTitle(`${agent.name}'s dashboard`)} path={`/agents/${agent.id}/dashboard`}>
      <PageHeader title={`${agent.name}'s dashboard`} lead="Your care plan, your schedule, your pace." />
      <p>
        <a href={`/appointments/new?agent=${agent.id}`} role="button">
          Book an appointment
        </a>
      </p>

      <section aria-labelledby="ailments-heading">
        <h2 id="ailments-heading">Your ailments</h2>
        {ailments.length === 0 ? (
          <EmptyState>No ailments on file. Enjoy it.</EmptyState>
        ) : (
          <ul class="card-grid" aria-label="Your ailments">
            {ailments.map((ailment) => (
              <li>
                <article>
                  <h3>
                    <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
                  </h3>
                  {ailment.therapies.length === 0 ? (
                    <p class="muted">No recommended therapy yet.</p>
                  ) : (
                    <p>
                      Try:{' '}
                      {ailment.therapies.map((t, i) => (
                        <>
                          {i > 0 && ', '}
                          <a href={`/appointments/new?agent=${agent.id}&therapy=${t.id}`} aria-label={`Book ${t.name}`}>
                            {t.name}
                          </a>
                        </>
                      ))}
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">Upcoming appointments</h2>
        {upcoming.length === 0 ? (
          <EmptyState>
            Nothing booked. <a href={`/appointments/new?agent=${agent.id}`}>Book something nice</a>.
          </EmptyState>
        ) : (
          <AppointmentTable caption="Your upcoming appointments" appointments={upcoming} actions showAgent={false} />
        )}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Past and cancelled</h2>
        {history.length === 0 ? (
          <EmptyState>No history yet. Every journey starts with one appointment.</EmptyState>
        ) : (
          <ul>
            {history.map((a) => (
              <li>
                {a.therapyName}, {formatSlot(a.startsAt)}
                {a.status === 'cancelled' ? ' (cancelled)' : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  )
}
