import type { Child } from 'hono/jsx'

// Form fields with the accessibility pattern from the booking form: a label tied to the control,
// aria-invalid and the error message when the field needs attention, otherwise an optional hint.
// The field's id is also its name, so the error summary can link straight to it.

/** aria attributes for a control: invalid plus its error message, or its hint. */
export const fieldAria = (id: string, error?: string, hasHint = false) =>
  error
    ? { 'aria-invalid': 'true', 'aria-describedby': `${id}-error` }
    : hasHint
      ? { 'aria-describedby': `${id}-hint` }
      : {}

type FieldMessageProps = {
  id: string
  error?: string
  hint?: Child
}

/** The field's error message when it has one, otherwise its hint (if any). */
export const FieldMessage = ({ id, error, hint }: FieldMessageProps) =>
  error ? <small id={`${id}-error`}>{error}</small> : hint ? <small id={`${id}-hint`}>{hint}</small> : null

type FieldProps = {
  id: string
  label: string
  value: string
  error?: string
  hint?: Child
}

type TextFieldProps = FieldProps & {
  /** Stops typing past the limit in the browser; the server still checks it. */
  maxlength?: number
}

export const TextField = ({ id, label, value, error, hint, maxlength }: TextFieldProps) => (
  <>
    <label for={id}>{label}</label>
    <input type="text" id={id} name={id} value={value} maxlength={maxlength} {...fieldAria(id, error, Boolean(hint))} />
    <FieldMessage id={id} error={error} hint={hint} />
  </>
)

type TextAreaProps = TextFieldProps & {
  rows?: number
}

export const TextArea = ({ id, label, value, error, hint, maxlength, rows = 4 }: TextAreaProps) => (
  <>
    <label for={id}>{label}</label>
    <textarea id={id} name={id} rows={rows} maxlength={maxlength} {...fieldAria(id, error, Boolean(hint))}>
      {value}
    </textarea>
    <FieldMessage id={id} error={error} hint={hint} />
  </>
)

type NumberFieldProps = FieldProps & {
  min?: number
  max?: number
}

export const NumberField = ({ id, label, value, error, hint, min, max }: NumberFieldProps) => (
  <>
    <label for={id}>{label}</label>
    <input
      type="number"
      id={id}
      name={id}
      value={value}
      min={min}
      max={max}
      step={1}
      inputmode="numeric"
      {...fieldAria(id, error, Boolean(hint))}
    />
    <FieldMessage id={id} error={error} hint={hint} />
  </>
)

type SelectFieldProps = Omit<FieldProps, 'value'> & {
  /** The `<option>` and `<optgroup>` elements, with `selected` already set. */
  children: Child
}

export const SelectField = ({ id, label, error, hint, children }: SelectFieldProps) => (
  <>
    <label for={id}>{label}</label>
    <select id={id} name={id} {...fieldAria(id, error, Boolean(hint))}>
      {children}
    </select>
    <FieldMessage id={id} error={error} hint={hint} />
  </>
)
