import type { Db } from '../db/connection'
import { countUpcomingAppointmentsForTherapy, getTherapy, therapyNameTaken, type TherapyInput } from '../db/therapies'
import type { Slot } from '../time'
import { requiredText, wholeNumber, type FieldErrors, type Validated } from '../validation'

export const NAME_MAX = 80
export const DESCRIPTION_MAX = 500
export const DURATION_MIN = 1
/** The clinic is open eight hours a day, so nothing longer could ever be booked. */
export const DURATION_MAX = 480

export type TherapyField = keyof TherapyInput

export type TherapyErrors = FieldErrors<TherapyField>

/** Raw form values, kept as strings so an invalid form can be shown again exactly as submitted. */
export type TherapyFormValues = Record<TherapyField, string>

/**
 * Checks a therapy form: name and description are required and within their limits, the name
 * isn't used by another therapy (ignoring case), and the duration is a whole number of minutes
 * from 1 to 480. When editing (`ignoreId`), the duration can't change while the therapy has
 * upcoming appointments, because those slots were checked against the old duration.
 */
export function validateTherapy(
  db: Db,
  input: TherapyFormValues,
  now: Slot,
  { ignoreId }: { ignoreId?: number } = {},
): Validated<TherapyInput, TherapyField> {
  const values = {
    name: input.name.trim(),
    description: input.description.trim(),
    durationMinutes: input.durationMinutes.trim(),
  }
  const errors: TherapyErrors = {}

  const nameError = requiredText(values.name, 'a name', NAME_MAX)
  if (nameError) errors.name = nameError
  else if (therapyNameTaken(db, values.name, ignoreId)) {
    errors.name = `There's already a therapy called ${values.name}. Choose another name.`
  }

  const descriptionError = requiredText(values.description, 'a description', DESCRIPTION_MAX)
  if (descriptionError) errors.description = descriptionError

  const duration = wholeNumber(values.durationMinutes, 'a duration', DURATION_MIN, DURATION_MAX)
  if (!duration.ok) errors.durationMinutes = duration.error
  else if (ignoreId !== undefined) {
    const saved = getTherapy(db, ignoreId)
    if (saved && saved.durationMinutes !== duration.value) {
      const upcoming = countUpcomingAppointmentsForTherapy(db, ignoreId, now)
      if (upcoming > 0) {
        errors.durationMinutes =
          `This therapy has ${upcoming === 1 ? '1 upcoming appointment' : `${upcoming} upcoming appointments`}, ` +
          `booked for ${saved.durationMinutes} minutes. ` +
          "Change the duration after they've happened, or cancel them first."
      }
    }
  }

  if (Object.keys(errors).length > 0 || !duration.ok) return { ok: false, errors, values }
  return { ok: true, value: { name: values.name, description: values.description, durationMinutes: duration.value } }
}
