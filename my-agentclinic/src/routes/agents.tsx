import { Hono } from 'hono'
import { getAgent, listAgents } from '../db/agents'
import { listAilmentsForAgent } from '../db/ailments'
import { agentDashboard } from '../db/dashboard'
import { ID, nowSlot, type AppDeps } from '../deps'
import { AgentPage } from '../views/agents/AgentPage'
import { AgentsPage } from '../views/agents/AgentsPage'
import { AgentDashboardPage } from '../views/dashboard/AgentDashboardPage'

export function agentRoutes(deps: AppDeps) {
  const { db } = deps
  const routes = new Hono()

  routes.get('/', (c) => c.html(<AgentsPage agents={listAgents(db)} />))

  routes.get(`/${ID}`, (c) => {
    const id = Number(c.req.param('id'))
    const agent = getAgent(db, id)
    if (!agent) return c.notFound()
    return c.html(<AgentPage agent={agent} ailments={listAilmentsForAgent(db, id)} />)
  })

  routes.get(`/${ID}/dashboard`, (c) => {
    const dashboard = agentDashboard(db, Number(c.req.param('id')), nowSlot(deps))
    if (!dashboard) return c.notFound()
    return c.html(<AgentDashboardPage dashboard={dashboard} />)
  })

  return routes
}
