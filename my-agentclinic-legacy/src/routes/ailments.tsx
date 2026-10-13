import { Hono } from 'hono'
import { validateAilment } from '../ailments/validate'
import {
  createAilment,
  getAilment,
  listAgentsWithAilment,
  listAilments,
  updateAilment,
  type Ailment,
} from '../db/ailments'
import { listTherapiesForAilment } from '../db/therapies'
import { ID, type AppDeps } from '../deps'
import { formText } from '../validation'
import { AilmentForm } from '../views/ailments/AilmentForm'
import { AILMENT_NOTICES, AilmentPage } from '../views/ailments/AilmentPage'
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

  routes.get(`/${ID}`, (c) => {
    const id = Number(c.req.param('id'))
    const ailment = getAilment(db, id)
    if (!ailment) return c.notFound()
    return c.html(
      <AilmentPage
        ailment={ailment}
        agents={listAgentsWithAilment(db, id)}
        therapies={listTherapiesForAilment(db, id)}
        notice={noticeKey(AILMENT_NOTICES, c.req.query('notice'))}
      />,
    )
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
