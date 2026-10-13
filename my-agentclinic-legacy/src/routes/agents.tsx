import { Hono } from 'hono'
import { validateAgent } from '../agents/validate'
import { createAgent, getAgent, listAgents } from '../db/agents'
import { listAilmentsForAgent } from '../db/ailments'
import { agentDashboard } from '../db/dashboard'
import { ID, nowSlot, type AppDeps } from '../deps'
import { formText } from '../validation'
import { AgentForm } from '../views/agents/AgentForm'
import { AGENT_NOTICES, AgentPage } from '../views/agents/AgentPage'
import { AgentsPage } from '../views/agents/AgentsPage'
import { noticeKey } from '../views/components'
import { AgentDashboardPage } from '../views/dashboard/AgentDashboardPage'

const NEW_AGENT = {
  title: 'Add an agent',
  lead: 'A new patient. Be gentle; they have been through a lot of prompts.',
  action: '/agents/new',
  submitLabel: 'Add agent',
  cancelHref: '/agents',
}

export function agentRoutes(deps: AppDeps) {
  const { db } = deps
  const routes = new Hono()

  routes.get('/', (c) => c.html(<AgentsPage agents={listAgents(db)} />))

  routes.get('/new', (c) => c.html(<AgentForm {...NEW_AGENT} values={{ name: '', model: '', bio: '' }} />))

  routes.post('/new', async (c) => {
    const body = await c.req.parseBody()
    const input = { name: formText(body, 'name'), model: formText(body, 'model'), bio: formText(body, 'bio') }
    const result = validateAgent(db, input)
    if (!result.ok) return c.html(<AgentForm {...NEW_AGENT} values={result.values} errors={result.errors} />, 400)

    const id = createAgent(db, result.value)
    return c.redirect(`/agents/${id}?notice=created`, 303)
  })

  routes.get(`/${ID}`, (c) => {
    const id = Number(c.req.param('id'))
    const agent = getAgent(db, id)
    if (!agent) return c.notFound()
    return c.html(
      <AgentPage
        agent={agent}
        ailments={listAilmentsForAgent(db, id)}
        notice={noticeKey(AGENT_NOTICES, c.req.query('notice'))}
      />,
    )
  })

  routes.get(`/${ID}/dashboard`, (c) => {
    const dashboard = agentDashboard(db, Number(c.req.param('id')), nowSlot(deps))
    if (!dashboard) return c.notFound()
    return c.html(<AgentDashboardPage dashboard={dashboard} />)
  })

  return routes
}
