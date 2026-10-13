import type { Appointment } from '../../db/appointments'
import { formatSlot } from '../../time'
import { PageHeader } from '../components'
import { Layout, pageTitle } from '../Layout'

type NotChangeablePageProps = {
  appointment: Appointment
}

/** Shown with 409 when someone tries to cancel or reschedule a past or cancelled appointment. */
export const NotChangeablePage = ({ appointment }: NotChangeablePageProps) => (
  <Layout title={pageTitle("That can't be changed")} path={`/appointments/${appointment.id}`}>
    <PageHeader title="That appointment can't be changed" />
    <p>
      {appointment.therapyName} for {appointment.agentName} on {formatSlot(appointment.startsAt)} is{' '}
      {appointment.status === 'cancelled' ? 'already cancelled' : 'in the past'}. Only upcoming appointments can be
      cancelled or rescheduled. Even we can't edit history.
    </p>
    <p>
      <a href="/appointments">Back to appointments</a>
    </p>
  </Layout>
)
