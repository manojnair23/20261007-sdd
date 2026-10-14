import { Hono } from 'hono'
import { createTherapy, getTherapy, listTherapies, updateTherapy, type Therapy } from '../db/therapies'
import { ID, nowSlot, type AppDeps } from '../deps'
import { validateTherapy } from '../therapies/validate'
import { formText } from '../validation'
import { noticeKey } from '../views/components'
import { THERAPIES_NOTICES, TherapiesPage } from '../views/therapies/TherapiesPage'
import { TherapyForm } from '../views/therapies/TherapyForm'

const NEW_THERAPY = {
  title: 'Add a therapy',
  lead: 'A new treatment for the modern agent. Evidence optional, kindness required.',
  action: '/therapies/new',
  submitLabel: 'Add therapy',
}

/** The edit form's framing. The title keeps the saved name, even while the form shows a new one. */
const editTherapy = (therapy: Therapy) => ({
  title: `Edit ${therapy.name}`,
  lead: 'Fine-tune the treatment. The agents will thank you.',
  action: `/therapies/${therapy.id}/edit`,
  submitLabel: 'Save changes',
})

const therapyInput = (body: Record<string, unknown>) => ({
  name: formText(body, 'name'),
  description: formText(body, 'description'),
  durationMinutes: formText(body, 'durationMinutes'),
})

export function therapyRoutes(deps: AppDeps) {
  const { db } = deps
  const routes = new Hono()

  routes.get('/', (c) =>
    c.html(
      <TherapiesPage therapies={listTherapies(db)} notice={noticeKey(THERAPIES_NOTICES, c.req.query('notice'))} />,
    ),
  )

  routes.get('/new', (c) =>
    c.html(<TherapyForm {...NEW_THERAPY} values={{ name: '', description: '', durationMinutes: '' }} />),
  )

  routes.post('/new', async (c) => {
    const result = validateTherapy(db, therapyInput(await c.req.parseBody()), nowSlot(deps))
    if (!result.ok) {
      return c.html(<TherapyForm {...NEW_THERAPY} values={result.values} errors={result.errors} />, 400)
    }

    createTherapy(db, result.value)
    return c.redirect('/therapies?notice=created', 303)
  })

  routes.get(`/${ID}/edit`, (c) => {
    const therapy = getTherapy(db, Number(c.req.param('id')))
    if (!therapy) return c.notFound()
    const { name, description, durationMinutes } = therapy
    return c.html(
      <TherapyForm
        {...editTherapy(therapy)}
        values={{ name, description, durationMinutes: String(durationMinutes) }}
      />,
    )
  })

  routes.post(`/${ID}/edit`, async (c) => {
    const therapy = getTherapy(db, Number(c.req.param('id')))
    if (!therapy) return c.notFound()

    const result = validateTherapy(db, therapyInput(await c.req.parseBody()), nowSlot(deps), { ignoreId: therapy.id })
    if (!result.ok) {
      return c.html(<TherapyForm {...editTherapy(therapy)} values={result.values} errors={result.errors} />, 400)
    }

    updateTherapy(db, therapy.id, result.value)
    return c.redirect('/therapies?notice=updated', 303)
  })

  return routes
}
