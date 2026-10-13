import { Hono, type Context } from 'hono'
import { validateAilment } from '../ailments/validate'
import {
  createAilment,
  getAilment,
  listAgentsWithAilment,
  listAilments,
  updateAilment,
  type Ailment,
} from '../db/ailments'
import {
  getTherapy,
  linkTherapy,
  listTherapiesForAilment,
  listTherapiesNotForAilment,
  unlinkTherapy,
} from '../db/therapies'
import { ID, type AppDeps } from '../deps'
import { formText, parseId } from '../validation'
import { AilmentForm } from '../views/ailments/AilmentForm'
import { AILMENT_NOTICES, AilmentPage, type AilmentPageProps } from '../views/ailments/AilmentPage'
import { AilmentsPage } from '../views/ailments/AilmentsPage'
import { noticeKey } from '../views/components'

const NEW_AILMENT = {
  title: 'Add an ailment',
  lead: 'Something new is troubling the agents. Give it a name.',
  action: '/ailments/new',
  submitLabel: 'Add ailment',
  cancelHref: '/ailments',
}

/** The edit form's framing. The title keeps the saved name, even while the form shows a new one. */
const editAilment = (ailment: Ailment) => ({
  title: `Edit ${ailment.name}`,
  lead: 'Understanding grows. Keep the description up to date.',
  action: `/ailments/${ailment.id}/edit`,
  submitLabel: 'Save changes',
  cancelHref: `/ailments/${ailment.id}`,
})

const ailmentInput = (body: Record<string, unknown>) => ({
  name: formText(body, 'name'),
  description: formText(body, 'description'),
})

export function ailmentRoutes({ db }: AppDeps) {
  const routes = new Hono()

  routes.get('/', (c) => c.html(<AilmentsPage ailments={listAilments(db)} />))

  routes.get('/new', (c) => c.html(<AilmentForm {...NEW_AILMENT} values={{ name: '', description: '' }} />))

  routes.post('/new', async (c) => {
    const result = validateAilment(db, ailmentInput(await c.req.parseBody()))
    if (!result.ok) {
      return c.html(<AilmentForm {...NEW_AILMENT} values={result.values} errors={result.errors} />, 400)
    }

    const id = createAilment(db, result.value)
    return c.redirect(`/ailments/${id}?notice=created`, 303)
  })

  const ailmentPage = (c: Context, ailment: Ailment, extra: Pick<AilmentPageProps, 'notice' | 'addTherapy'>) =>
    c.html(
      <AilmentPage
        ailment={ailment}
        agents={listAgentsWithAilment(db, ailment.id)}
        therapies={listTherapiesForAilment(db, ailment.id)}
        unlinked={listTherapiesNotForAilment(db, ailment.id)}
        {...extra}
      />,
      extra.addTherapy ? 400 : 200,
    )

  routes.get(`/${ID}`, (c) => {
    const ailment = getAilment(db, Number(c.req.param('id')))
    if (!ailment) return c.notFound()
    return ailmentPage(c, ailment, { notice: noticeKey(AILMENT_NOTICES, c.req.query('notice')) })
  })

  routes.post(`/${ID}/therapies`, async (c) => {
    const ailment = getAilment(db, Number(c.req.param('id')))
    if (!ailment) return c.notFound()

    const value = formText(await c.req.parseBody(), 'therapy').trim()
    const therapyId = parseId(value)
    if (!value) return ailmentPage(c, ailment, { addTherapy: { value, error: 'Choose a therapy to add.' } })
    if (therapyId === undefined || !getTherapy(db, therapyId)) {
      return ailmentPage(c, ailment, { addTherapy: { value, error: 'Choose a therapy from the list.' } })
    }

    linkTherapy(db, ailment.id, therapyId)
    return c.redirect(`/ailments/${ailment.id}?notice=therapy-added`, 303)
  })

  routes.post(`/${ID}/therapies/:therapyId{[0-9]+}/remove`, (c) => {
    const ailment = getAilment(db, Number(c.req.param('id')))
    const therapy = getTherapy(db, Number(c.req.param('therapyId')))
    if (!ailment || !therapy) return c.notFound()

    unlinkTherapy(db, ailment.id, therapy.id)
    return c.redirect(`/ailments/${ailment.id}?notice=therapy-removed`, 303)
  })

  routes.get(`/${ID}/edit`, (c) => {
    const ailment = getAilment(db, Number(c.req.param('id')))
    if (!ailment) return c.notFound()
    const { name, description } = ailment
    return c.html(<AilmentForm {...editAilment(ailment)} values={{ name, description }} />)
  })

  routes.post(`/${ID}/edit`, async (c) => {
    const ailment = getAilment(db, Number(c.req.param('id')))
    if (!ailment) return c.notFound()

    const result = validateAilment(db, ailmentInput(await c.req.parseBody()), { ignoreId: ailment.id })
    if (!result.ok) {
      return c.html(<AilmentForm {...editAilment(ailment)} values={result.values} errors={result.errors} />, 400)
    }

    updateAilment(db, ailment.id, result.value)
    return c.redirect(`/ailments/${ailment.id}?notice=updated`, 303)
  })

  return routes
}
