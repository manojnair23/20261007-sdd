// Small building blocks for validating plain HTML forms. Every form keeps its raw values as strings,
// so an invalid form can be shown again exactly as it was submitted.

/** One message per field that needs attention. */
export type FieldErrors<F extends string> = Partial<Record<F, string>>

/** What a form validator returns: the clean value, or the errors plus the trimmed raw values. */
export type Validated<T, F extends string> =
  { ok: true; value: T } | { ok: false; errors: FieldErrors<F>; values: Record<F, string> }

/** Reads a form field as a string; missing fields and file uploads become "". */
export const formText = (body: Record<string, unknown>, name: string): string => {
  const value = body[name]
  return typeof value === 'string' ? value : ''
}

/** A positive database id written as plain digits, or undefined. */
export const parseId = (text: string): number | undefined =>
  /^[1-9]\d{0,9}$/.test(text.trim()) ? Number(text.trim()) : undefined

/**
 * Checks a required text field. `what` completes "Enter …", for example "a name".
 * Returns an error message, or undefined when the value is fine.
 */
export function requiredText(value: string, what: string, max: number): string | undefined {
  const text = value.trim()
  if (!text) return `Enter ${what}.`
  if (text.length > max) return `Use ${max} characters or fewer. This is ${text.length}.`
  return undefined
}

/** Checks a whole number from `min` to `max`. `what` completes "Enter …", for example "a duration". */
export function wholeNumber(
  value: string,
  what: string,
  min: number,
  max: number,
): { ok: true; value: number } | { ok: false; error: string } {
  const text = value.trim()
  if (!text) return { ok: false, error: `Enter ${what}.` }
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter a whole number, like 45.' }
  const number = Number(text)
  if (number < min || number > max) return { ok: false, error: `Enter a number from ${min} to ${max}.` }
  return { ok: true, value: number }
}
