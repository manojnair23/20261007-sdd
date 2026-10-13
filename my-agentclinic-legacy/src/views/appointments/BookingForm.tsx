import type { Agent } from '../../db/agents'
import type { Appointment } from '../../db/appointments'
import type { Therapy } from '../../db/therapies'
import type { BookingErrors, BookingInput } from '../../appointments/validate'
import { formatSlot, type Slot } from '../../time'
import { ErrorSummary, PageHeader } from '../components'
import { fieldAria, FieldMessage, SelectField } from '../forms'
import { Layout, pageTitle } from '../Layout'

const therapyLabel = (t: Therapy) => `${t.name} (${t.durationMinutes} min)`

type StartsAtFieldProps = {
  value: string
  min: Slot
  errors: BookingErrors
}

const StartsAtField = ({ value, min, errors }: StartsAtFieldProps) => (
  <>
    <label for="startsAt">Date and time</label>
    <input
      type="datetime-local"
      id="startsAt"
      name="startsAt"
      value={value}
      min={min}
      step={900}
      {...fieldAria('startsAt', errors.startsAt, true)}
    />
    <FieldMessage id="startsAt" error={errors.startsAt} hint="Open 9:00 AM to 5:00 PM, starting on the quarter hour." />
  </>
)

type NewBookingFormProps = {
  agents: Agent[]
  /** Therapies that treat the chosen agent's ailments, listed first. */
  recommended: Therapy[]
  others: Therapy[]
  values: BookingInput
  errors?: BookingErrors
  now: Slot
}

export const NewBookingForm = ({ agents, recommended, others, values, errors = {}, now }: NewBookingFormProps) => {
  const chosenAgent = agents.find((a) => String(a.id) === values.agent)
  const option = (t: Therapy) => (
    <option value={String(t.id)} selected={values.therapy === String(t.id)}>
      {therapyLabel(t)}
    </option>
  )
  return (
    <Layout title={pageTitle('Book an appointment')} path="/appointments/new">
      <PageHeader title="Book an appointment" lead="Pick a patient, a therapy, and a time. We'll take it from there." />
      <ErrorSummary errors={errors} />
      <form method="post" action="/appointments/new" novalidate class="narrow">
        <SelectField id="agent" label="Agent" error={errors.agent}>
          <option value="" selected={!chosenAgent}>
            Choose an agent…
          </option>
          {agents.map((a) => (
            <option value={String(a.id)} selected={chosenAgent?.id === a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>

        <SelectField id="therapy" label="Therapy" error={errors.therapy}>
          <option value="" selected={!values.therapy}>
            Choose a therapy…
          </option>
          {recommended.length > 0 ? (
            <>
              <optgroup label={`Recommended for ${chosenAgent?.name ?? 'this agent'}`}>
                {recommended.map(option)}
              </optgroup>
              <optgroup label="Other therapies">{others.map(option)}</optgroup>
            </>
          ) : (
            others.map(option)
          )}
        </SelectField>

        <StartsAtField value={values.startsAt} min={now} errors={errors} />

        <button type="submit">Book appointment</button>
      </form>
    </Layout>
  )
}

type RescheduleFormProps = {
  appointment: Appointment
  startsAt: string
  errors?: BookingErrors
  now: Slot
}

export const RescheduleForm = ({ appointment, startsAt, errors = {}, now }: RescheduleFormProps) => (
  <Layout title={pageTitle('Reschedule appointment')} path={`/appointments/${appointment.id}/reschedule`}>
    <PageHeader title="Reschedule appointment" lead="Plans change. That's allowed." />
    <ErrorSummary errors={errors} />
    <dl class="details">
      <dt>Agent</dt>
      <dd>{appointment.agentName}</dd>
      <dt>Therapy</dt>
      <dd>
        {appointment.therapyName} ({appointment.durationMinutes} min)
      </dd>
      <dt>Currently</dt>
      <dd>{formatSlot(appointment.startsAt)}</dd>
    </dl>
    <form method="post" action={`/appointments/${appointment.id}/reschedule`} novalidate class="narrow">
      <StartsAtField value={startsAt} min={now} errors={errors} />
      <button type="submit">Reschedule</button>
    </form>
    <p>
      <a href="/appointments">Back to appointments</a>
    </p>
  </Layout>
)
