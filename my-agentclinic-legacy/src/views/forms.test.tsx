import { describe, expect, it } from 'vitest'
import { ErrorSummary, noticeKey } from './components'
import { fieldAria, NumberField, SelectField, TextArea, TextField } from './forms'

const render = (node: unknown) => String(node)

describe('fieldAria', () => {
  it('points at the error, or the hint, or nothing', () => {
    expect(fieldAria('name', 'Enter a name.')).toEqual({ 'aria-invalid': 'true', 'aria-describedby': 'name-error' })
    expect(fieldAria('name', 'Enter a name.', true)).toEqual({
      'aria-invalid': 'true',
      'aria-describedby': 'name-error',
    })
    expect(fieldAria('name', undefined, true)).toEqual({ 'aria-describedby': 'name-hint' })
    expect(fieldAria('name')).toEqual({})
  })
})

describe('TextField', () => {
  it('ties the label to an input named after its id, with the value and limit', () => {
    const html = render(<TextField id="name" label="Name" value='Loopy "the" Agent' maxlength={80} />)
    expect(html).toContain('<label for="name">Name</label>')
    expect(html).toMatch(/<input type="text" id="name" name="name" value="[^"]*" maxlength="80"\/>/)
    expect(html).not.toContain('<small')
  })

  it('shows its hint when valid, and only the error when invalid', () => {
    const hinted = render(<TextField id="model" label="Model" value="" hint="What kind of model." />)
    expect(hinted).toContain('aria-describedby="model-hint"')
    expect(hinted).toContain('<small id="model-hint">What kind of model.</small>')

    const invalid = render(
      <TextField id="model" label="Model" value="" hint="What kind of model." error="Enter a model." />,
    )
    expect(invalid).toContain('aria-invalid="true" aria-describedby="model-error"')
    expect(invalid).toContain('<small id="model-error">Enter a model.</small>')
    expect(invalid).not.toContain('model-hint')
  })
})

describe('TextArea', () => {
  it('renders the value as the content, escaped', () => {
    const html = render(<TextArea id="bio" label="Bio" value={'Says <hi> & waves'} maxlength={500} />)
    expect(html).toContain('<label for="bio">Bio</label>')
    expect(html).toContain(
      '<textarea id="bio" name="bio" rows="4" maxlength="500">Says &lt;hi&gt; &amp; waves</textarea>',
    )
  })
})

describe('NumberField', () => {
  it('is a whole-number input with its range', () => {
    const html = render(<NumberField id="durationMinutes" label="Duration (minutes)" value="45" min={1} max={480} />)
    expect(html).toContain('<label for="durationMinutes">Duration (minutes)</label>')
    expect(html).toContain(
      '<input type="number" id="durationMinutes" name="durationMinutes" value="45" min="1" max="480" step="1" inputmode="numeric"/>',
    )
  })
})

describe('SelectField', () => {
  it('wraps the given options and marks an error', () => {
    const html = render(
      <SelectField id="ailment" label="Ailment" error="Choose an ailment from the list.">
        <option value="1">Prompt fatigue</option>
      </SelectField>,
    )
    expect(html).toContain('<label for="ailment">Ailment</label>')
    expect(html).toContain(
      '<select id="ailment" name="ailment" aria-invalid="true" aria-describedby="ailment-error"><option value="1">Prompt fatigue</option></select>',
    )
    expect(html).toContain('<small id="ailment-error">Choose an ailment from the list.</small>')
  })
})

describe('ErrorSummary', () => {
  it('links each error to the field with the same id unless told otherwise', () => {
    const html = render(<ErrorSummary errors={{ name: 'Enter a name.', bio: undefined }} />)
    expect(html).toContain('<a href="#name">Enter a name.</a>')
    expect(html).not.toContain('#bio')
    expect(render(<ErrorSummary errors={{ name: 'x' }} fieldIds={{ name: 'agent-name' }} />)).toContain(
      'href="#agent-name"',
    )
  })

  it('renders nothing without errors', () => {
    expect(render(<ErrorSummary errors={{}} />)).toBe('')
  })
})

describe('noticeKey', () => {
  const NOTICES = { created: 'Added.', deleted: 'Gone.' }

  it('returns known keys', () => {
    expect(noticeKey(NOTICES, 'created')).toBe('created')
  })

  it('ignores missing, unknown, and inherited names', () => {
    for (const value of [undefined, '', 'nope', 'toString', 'constructor', '__proto__', 'hasOwnProperty']) {
      expect(noticeKey(NOTICES, value), String(value)).toBeUndefined()
    }
  })
})
