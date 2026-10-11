import { Hono } from 'hono'
import { getAilment, listAgentsWithAilment, listAilments } from '../db/ailments'
import { listTherapiesForAilment } from '../db/therapies'
import { ID, type AppDeps } from '../deps'
import { AilmentPage } from '../views/ailments/AilmentPage'
import { AilmentsPage } from '../views/ailments/AilmentsPage'

export function ailmentRoutes({ db }: AppDeps) {
  const routes = new Hono()

  routes.get('/', (c) => c.html(<AilmentsPage ailments={listAilments(db)} />))

  routes.get(`/${ID}`, (c) => {
    const id = Number(c.req.param('id'))
    const ailment = getAilment(db, id)
    if (!ailment) return c.notFound()
    return c.html(
      <AilmentPage
        ailment={ailment}
        agents={listAgentsWithAilment(db, id)}
        therapies={listTherapiesForAilment(db, id)}
      />,
    )
  })

  return routes
}
