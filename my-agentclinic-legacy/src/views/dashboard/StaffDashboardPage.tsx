import type { ClinicStats } from '../../db/dashboard'
import { AppointmentTable, EmptyState, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type StaffDashboardPageProps = {
  stats: ClinicStats
}

export const StaffDashboardPage = ({ stats }: StaffDashboardPageProps) => (
  <Layout title={pageTitle('Staff dashboard')} path="/dashboard">
    <PageHeader title="Staff dashboard" lead="The clinic at a glance. Coffee not included." />

    <ul class="stats" aria-label="Clinic numbers">
      <li>
        <a href="/agents">
          <strong>{stats.agents}</strong> agents
        </a>
      </li>
      <li>
        <a href="/ailments">
          <strong>{stats.ailments}</strong> ailments
        </a>
      </li>
      <li>
        <a href="/appointments">
          <strong>{stats.upcoming}</strong> upcoming appointments
        </a>
      </li>
    </ul>

    <section aria-labelledby="next-heading">
      <h2 id="next-heading">Next up</h2>
      {stats.next.length === 0 ? (
        <EmptyState>
          A quiet schedule. <a href="/appointments/new">Book an appointment</a> to change that.
        </EmptyState>
      ) : (
        <AppointmentTable caption="The next appointments, soonest first" appointments={stats.next} actions />
      )}
      <p>
        <a href="/appointments">See all appointments</a>
      </p>
    </section>

    <section aria-labelledby="manage-heading">
      <h2 id="manage-heading">Manage the catalog</h2>
      <p>Add new records here. To edit or delete one, open it from its list.</p>
      <div class="actions">
        <a href="/agents/new" role="button" class="secondary outline">
          Add an agent
        </a>
        <a href="/ailments/new" role="button" class="secondary outline">
          Add an ailment
        </a>
        <a href="/therapies/new" role="button" class="secondary outline">
          Add a therapy
        </a>
      </div>
      <ul>
        <li>
          <a href="/agents">All agents</a>
        </li>
        <li>
          <a href="/ailments">All ailments</a>
        </li>
        <li>
          <a href="/therapies">All therapies</a>
        </li>
      </ul>
    </section>
  </Layout>
)
