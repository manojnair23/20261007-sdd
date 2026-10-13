import type { Child } from 'hono/jsx'
import type { Appointment } from '../db/appointments'
import { formatSlot } from '../time'

type PageHeaderProps = {
  title: string
  lead?: Child
}

export const PageHeader = ({ title, lead }: PageHeaderProps) => (
  <hgroup class="page-header">
    <h1>{title}</h1>
    {lead && <p>{lead}</p>}
  </hgroup>
)

/** "1 appointment", "3 appointments". For nouns that just add an "s". */
export const countOf = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

type EmptyStateProps = {
  children: Child
}

export const EmptyState = ({ children }: EmptyStateProps) => <p class="empty-state">{children}</p>

/**
 * The notice key from a `?notice=` query value, when the page knows it. Unknown values (including
 * inherited names like "toString") give undefined, so a crafted link can't show anything.
 */
export const noticeKey = <K extends string>(notices: Record<K, string>, value: string | undefined): K | undefined =>
  value !== undefined && Object.hasOwn(notices, value) ? (value as K) : undefined

type NoticeProps = {
  message?: string
}

/** A polite status message after a form succeeds. The region is always present so it is announced. */
export const Notice = ({ message }: NoticeProps) => (
  <div role="status" class={message ? 'notice' : undefined}>
    {message}
  </div>
)

type ErrorSummaryProps = {
  errors: Partial<Record<string, string>>
  /** Maps each error key to the id of the field it belongs to. By default the id is the key. */
  fieldIds?: Record<string, string>
}

export const ErrorSummary = ({ errors, fieldIds }: ErrorSummaryProps) => {
  const entries = Object.entries(errors).filter((entry): entry is [string, string] => Boolean(entry[1]))
  if (entries.length === 0) return null
  return (
    <div class="error-summary" role="alert" aria-labelledby="error-summary-title" tabindex={-1} id="error-summary">
      <h2 id="error-summary-title">Something needs your attention</h2>
      <ul>
        {entries.map(([key, message]) => (
          <li>
            <a href={`#${fieldIds?.[key] ?? key}`}>{message}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const describe = (a: Appointment) => `${a.therapyName} for ${a.agentName} on ${formatSlot(a.startsAt)}`

type AppointmentActionsProps = {
  appointment: Appointment
}

export const AppointmentActions = ({ appointment }: AppointmentActionsProps) => (
  <div class="actions">
    <a
      href={`/appointments/${appointment.id}/reschedule`}
      role="button"
      class="secondary outline"
      aria-label={`Reschedule ${describe(appointment)}`}
    >
      Reschedule
    </a>
    <form method="post" action={`/appointments/${appointment.id}/cancel`}>
      <button type="submit" class="secondary" aria-label={`Cancel ${describe(appointment)}`}>
        Cancel
      </button>
    </form>
  </div>
)

type AppointmentTableProps = {
  caption: string
  appointments: Appointment[]
  /** Show Cancel and Reschedule buttons (only for upcoming appointments). */
  actions?: boolean
  /** Hide the agent column, e.g. on an agent's own dashboard. */
  showAgent?: boolean
}

/** A table on wide screens that stacks into labelled rows on phones (see .stack in styles.css). */
export const AppointmentTable = ({
  caption,
  appointments,
  actions = false,
  showAgent = true,
}: AppointmentTableProps) => (
  <table class="stack">
    <caption>{caption}</caption>
    <thead>
      <tr>
        <th scope="col">When</th>
        {showAgent && <th scope="col">Agent</th>}
        <th scope="col">Therapy</th>
        {actions && <th scope="col">Actions</th>}
      </tr>
    </thead>
    <tbody>
      {appointments.map((a) => (
        <tr>
          <th scope="row" data-label="When">
            {formatSlot(a.startsAt)}
          </th>
          {showAgent && (
            <td data-label="Agent">
              <a href={`/agents/${a.agentId}`}>{a.agentName}</a>
            </td>
          )}
          <td data-label="Therapy">
            {a.therapyName} ({a.durationMinutes} min)
          </td>
          {actions && (
            <td data-label="Actions">
              <AppointmentActions appointment={a} />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
)
