import { ailmentNameTaken, type AilmentInput } from '../db/ailments'
import type { Db } from '../db/connection'
import { requiredText, type FieldErrors, type Validated } from '../validation'

export const NAME_MAX = 80
export const DESCRIPTION_MAX = 500

export type AilmentField = keyof AilmentInput

export type AilmentErrors = FieldErrors<AilmentField>

/** Raw form values, kept as strings so an invalid form can be shown again exactly as submitted. */
export type AilmentFormValues = Record<AilmentField, string>

/**
 * Checks an ailment form: both fields are required and within their length limits, and the name
 * isn't used by another ailment (ignoring case). `ignoreId` is the ailment being edited.
 */
export function validateAilment(
  db: Db,
  input: AilmentFormValues,
  { ignoreId }: { ignoreId?: number } = {},
): Validated<AilmentInput, AilmentField> {
  const values = { name: input.name.trim(), description: input.description.trim() }
  const errors: AilmentErrors = {}

  const nameError = requiredText(values.name, 'a name', NAME_MAX)
  if (nameError) errors.name = nameError
  else if (ailmentNameTaken(db, values.name, ignoreId)) {
    errors.name = `There's already an ailment called ${values.name}. Choose another name.`
  }

  const descriptionError = requiredText(values.description, 'a description', DESCRIPTION_MAX)
  if (descriptionError) errors.description = descriptionError

  if (Object.keys(errors).length > 0) return { ok: false, errors, values }
  return { ok: true, value: values }
}
