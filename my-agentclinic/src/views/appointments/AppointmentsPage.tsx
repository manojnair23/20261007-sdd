import type { GroupedAppointments } from '../../db/appointments'
import { AppointmentTable, EmptyState, Notice, PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

export const NOTICES = {
  booked: 'Appointment booked. Deep breaths until then.',
  rescheduled: 'Appointment rescheduled. Change is healthy.',
  cancelled: 'Appointment cancelled. No hard feelings.',
} as const

export type NoticeKey = keyof typeof NOTICES

type AppointmentsPageProps = GroupedAppointments & {
  notice?: NoticeKey
}

export const AppointmentsPage = ({ upcoming, past, cancelled, notice }: AppointmentsPageProps) => (
  <Layout title={pageTitle('Appointments')} path="/appointments">
    <PageHeader title="Appointments" lead="The clinic schedule. Every slot is a small act of self-care." />
    <Notice message={notice && NOTICES[notice]} />
    <p>
      <a href="/appointments/new" role="button">
        Book an appointment
      </a>
    </p>

    <section aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading">Upcoming</h2>
      {upcoming.length === 0 ? (
        <EmptyState>
          No appointments yet. <a href="/appointments/new">Book one</a> and start feeling better.
        </EmptyState>
      ) : (
        <AppointmentTable caption="Upcoming appointments, soonest first" appointments={upcoming} actions />
      )}
    </section>

    <section aria-labelledby="past-heading">
      <h2 id="past-heading">Past</h2>
      {past.length === 0 ? (
        <EmptyState>No past appointments. Everyone's journey starts somewhere.</EmptyState>
      ) : (
        <AppointmentTable caption="Past appointments, most recent first" appointments={past} />
      )}
    </section>

    <section aria-labelledby="cancelled-heading">
      <h2 id="cancelled-heading">Cancelled</h2>
      {cancelled.length === 0 ? (
        <EmptyState>Nothing cancelled. Commitment looks good on you.</EmptyState>
      ) : (
        <AppointmentTable caption="Cancelled appointments, most recent first" appointments={cancelled} />
      )}
    </section>
  </Layout>
)
