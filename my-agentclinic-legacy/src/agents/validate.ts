import { agentNameTaken, type AgentInput } from '../db/agents'
import type { Db } from '../db/connection'
import { requiredText, type FieldErrors, type Validated } from '../validation'

export const NAME_MAX = 80
export const MODEL_MAX = 80
export const BIO_MAX = 500

export type AgentField = keyof AgentInput

export type AgentErrors = FieldErrors<AgentField>

/** Raw form values, kept as strings so an invalid form can be shown again exactly as submitted. */
export type AgentFormValues = Record<AgentField, string>

/**
 * Checks an agent form: every field is required, within its length limit, and the name isn't
 * used by another agent (ignoring case). `ignoreId` is the agent being edited.
 */
export function validateAgent(
  db: Db,
  input: AgentFormValues,
  { ignoreId }: { ignoreId?: number } = {},
): Validated<AgentInput, AgentField> {
  const values = { name: input.name.trim(), model: input.model.trim(), bio: input.bio.trim() }
  const errors: AgentErrors = {}

  const nameError = requiredText(values.name, 'a name', NAME_MAX)
  if (nameError) errors.name = nameError
  else if (agentNameTaken(db, values.name, ignoreId)) {
    errors.name = `There's already an agent called ${values.name}. Choose another name.`
  }

  const modelError = requiredText(values.model, 'a model', MODEL_MAX)
  if (modelError) errors.model = modelError

  const bioError = requiredText(values.bio, 'a bio', BIO_MAX)
  if (bioError) errors.bio = bioError

  if (Object.keys(errors).length > 0) return { ok: false, errors, values }
  return { ok: true, value: values }
}
