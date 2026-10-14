import { Hono, type Context } from 'hono'
import {
  countAilmentLinksForTherapy,
  countAppointmentsForTherapy,
  createTherapy,
  deleteTherapy,
  getTherapy,
  listTherapies,
  updateTherapy,
  type Therapy,
} from '../db/therapies'
import { ID, nowSlot, type AppDeps } from '../deps'
import { validateTherapy } from '../therapies/validate'
import { formText } from '../validation'
import { countOf, noticeKey } from '../views/components'
import { CannotDeletePage, ConfirmDeletePage } from '../views/DeletePages'
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

  const cannotDelete = (c: Context, therapy: Therapy) =>
    c.html(
      <CannotDeletePage name={therapy.name} path={`/therapies/${therapy.id}/delete`}>
        <p>
          {therapy.name} has {countOf(countAppointmentsForTherapy(db, therapy.id), 'appointment')} on record, counting
          upcoming, past, and cancelled ones. Therapies with appointments stay, so the clinic's history still makes
          sense.
        </p>
        <p>
          <a href="/appointments">See the appointments</a> or <a href="/therapies">go back to the therapies</a>.
        </p>
      </CannotDeletePage>,
      409,
    )

  routes.get(`/${ID}/delete`, (c) => {
    const therapy = getTherapy(db, Number(c.req.param('id')))
    if (!therapy) return c.notFound()
    if (countAppointmentsForTherapy(db, therapy.id) > 0) return cannotDelete(c, therapy)

    const ailments = countAilmentLinksForTherapy(db, therapy.id)
    return c.html(
      <ConfirmDeletePage name={therapy.name} action={`/therapies/${therapy.id}/delete`} cancelHref="/therapies">
        <p>
          This removes {therapy.name} from the clinic
          {ailments > 0 ? `, along with its ${countOf(ailments, 'ailment link')}. The ailments themselves stay.` : '.'}
        </p>
      </ConfirmDeletePage>,
    )
  })

  routes.post(`/${ID}/delete`, (c) => {
    const therapy = getTherapy(db, Number(c.req.param('id')))
    if (!therapy) return c.notFound()

    const outcome = deleteTherapy(db, therapy.id)
    if (outcome === 'not-found') return c.notFound()
    if (outcome === 'has-appointments') return cannotDelete(c, therapy)
    return c.redirect('/therapies?notice=deleted', 303)
  })

  return routes
}
