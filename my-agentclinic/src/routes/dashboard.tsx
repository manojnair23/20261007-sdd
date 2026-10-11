import { Hono } from 'hono'
import { clinicStats } from '../db/dashboard'
import { nowSlot, type AppDeps } from '../deps'
import { StaffDashboardPage } from '../views/dashboard/StaffDashboardPage'

export function dashboardRoutes(deps: AppDeps) {
  const routes = new Hono()

  routes.get('/', (c) => c.html(<StaffDashboardPage stats={clinicStats(deps.db, nowSlot(deps))} />))

  return routes
}
