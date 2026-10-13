import { getAgent } from '../db/agents'
import { listScheduledForAgentOnDate, type NewAppointment } from '../db/appointments'
import type { Db } from '../db/connection'
import { getTherapy } from '../db/therapies'
import { addMinutes, formatTime, isSlot, slotDate, slotTime, type Slot } from '../time'
import { parseId, type FieldErrors, type Validated } from '../validation'

export const OPENS_AT = '09:00'
export const CLOSES_AT = '17:00'
export const SLOT_MINUTES = 15

/** Raw form values, kept as strings so an invalid form can be shown again exactly as submitted. */
export type BookingInput = {
  agent: string
  therapy: string
  startsAt: string
}

export type BookingField = keyof BookingInput

export type BookingErrors = FieldErrors<BookingField>

export type BookingResult = Validated<NewAppointment, BookingField>

/**
 * Checks a booking or reschedule against the clinic rules: the agent and therapy exist, and the
 * slot is in the future, on a 15-minute boundary, inside opening hours (including the therapy's
 * duration), and doesn't overlap another scheduled appointment for the same agent.
 * `ignoreId` skips the appointment being rescheduled, so it can't conflict with itself.
 */
export function validateBooking(
  db: Db,
  input: BookingInput,
  now: Slot,
  { ignoreId }: { ignoreId?: number } = {},
): BookingResult {
  const errors: BookingErrors = {}
  const values = { agent: input.agent.trim(), therapy: input.therapy.trim(), startsAt: input.startsAt.trim() }

  const agentId = parseId(values.agent)
  const agent = agentId === undefined ? undefined : getAgent(db, agentId)
  if (!values.agent) errors.agent = 'Choose an agent.'
  else if (!agent) errors.agent = 'Choose an agent from the list.'

  const therapyId = parseId(values.therapy)
  const therapy = therapyId === undefined ? undefined : getTherapy(db, therapyId)
  if (!values.therapy) errors.therapy = 'Choose a therapy.'
  else if (!therapy) errors.therapy = 'Choose a therapy from the list.'

  const startsAt = values.startsAt
  const startsAtError = (() => {
    if (!startsAt) return 'Choose a date and time.'
    if (!isSlot(startsAt)) return 'Enter a real date and time.'
    if (startsAt <= now) return 'Choose a time in the future.'
    if (Number(slotTime(startsAt).slice(3)) % SLOT_MINUTES !== 0) {
      return 'Choose a time on the quarter hour (:00, :15, :30, or :45).'
    }
    if (slotTime(startsAt) < OPENS_AT || slotTime(startsAt) >= CLOSES_AT) {
      return 'The clinic is open from 9:00 AM to 5:00 PM.'
    }
    if (!therapy) return undefined

    const endsAt = addMinutes(startsAt, therapy.durationMinutes)
    if (slotDate(endsAt) !== slotDate(startsAt) || slotTime(endsAt) > CLOSES_AT) {
      return `${therapy.name} takes ${therapy.durationMinutes} minutes, so it would end at ${formatTime(endsAt)}. The clinic closes at 5:00 PM.`
    }
    if (!agent) return undefined

    const clash = listScheduledForAgentOnDate(db, agent.id, slotDate(startsAt)).find(
      (other) =>
        other.id !== ignoreId &&
        other.startsAt < endsAt &&
        startsAt < addMinutes(other.startsAt, other.durationMinutes),
    )
    if (clash) {
      return `${agent.name} already has ${clash.therapyName} at ${formatTime(clash.startsAt)}. Choose a time that doesn't overlap.`
    }
    return undefined
  })()
  if (startsAtError) errors.startsAt = startsAtError

  if (Object.keys(errors).length > 0 || !agent || !therapy) return { ok: false, errors, values }
  return { ok: true, value: { agentId: agent.id, therapyId: therapy.id, startsAt } }
}
