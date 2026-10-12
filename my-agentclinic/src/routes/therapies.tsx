import { Hono } from 'hono'
import { listTherapies } from '../db/therapies'
import type { AppDeps } from '../deps'
import { TherapiesPage } from '../views/therapies/TherapiesPage'

export function therapyRoutes({ db }: AppDeps) {
  const routes = new Hono()

  routes.get('/', (c) => c.html(<TherapiesPage therapies={listTherapies(db)} />))

  return routes
}
