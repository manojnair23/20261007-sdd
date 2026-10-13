import { Hono, type Context } from 'hono'
import { validateAgent } from '../agents/validate'
import { createAgent, getAgent, listAgents, updateAgent, type Agent } from '../db/agents'
import {
  assignAilment,
  getAilment,
  listAilmentsForAgent,
  listAilmentsNotForAgent,
  unassignAilment,
} from '../db/ailments'
import { agentDashboard } from '../db/dashboard'
import { ID, nowSlot, type AppDeps } from '../deps'
import { formText, parseId } from '../validation'
import { AgentForm } from '../views/agents/AgentForm'
import { AGENT_NOTICES, AgentPage, type AgentPageProps } from '../views/agents/AgentPage'
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

/** The edit form's framing. The title keeps the saved name, even while the form shows a new one. */
const editAgent = (agent: Agent) => ({
  title: `Edit ${agent.name}`,
  lead: 'Keep their records up to date. Agents change too.',
  action: `/agents/${agent.id}/edit`,
  submitLabel: 'Save changes',
  cancelHref: `/agents/${agent.id}`,
})

const agentInput = (body: Record<string, unknown>) => ({
  name: formText(body, 'name'),
  model: formText(body, 'model'),
  bio: formText(body, 'bio'),
})

export function agentRoutes(deps: AppDeps) {
  const { db } = deps
  const routes = new Hono()

  routes.get('/', (c) => c.html(<AgentsPage agents={listAgents(db)} />))

  routes.get('/new', (c) => c.html(<AgentForm {...NEW_AGENT} values={{ name: '', model: '', bio: '' }} />))

  routes.post('/new', async (c) => {
    const result = validateAgent(db, agentInput(await c.req.parseBody()))
    if (!result.ok) return c.html(<AgentForm {...NEW_AGENT} values={result.values} errors={result.errors} />, 400)

    const id = createAgent(db, result.value)
    return c.redirect(`/agents/${id}?notice=created`, 303)
  })

  const agentPage = (c: Context, agent: Agent, extra: Pick<AgentPageProps, 'notice' | 'addAilment'>) =>
    c.html(
      <AgentPage
        agent={agent}
        ailments={listAilmentsForAgent(db, agent.id)}
        unassigned={listAilmentsNotForAgent(db, agent.id)}
        {...extra}
      />,
      extra.addAilment ? 400 : 200,
    )

  routes.get(`/${ID}`, (c) => {
    const agent = getAgent(db, Number(c.req.param('id')))
    if (!agent) return c.notFound()
    return agentPage(c, agent, { notice: noticeKey(AGENT_NOTICES, c.req.query('notice')) })
  })

  routes.post(`/${ID}/ailments`, async (c) => {
    const agent = getAgent(db, Number(c.req.param('id')))
    if (!agent) return c.notFound()

    const value = formText(await c.req.parseBody(), 'ailment').trim()
    const ailmentId = parseId(value)
    if (!value) return agentPage(c, agent, { addAilment: { value, error: 'Choose an ailment to add.' } })
    if (ailmentId === undefined || !getAilment(db, ailmentId)) {
      return agentPage(c, agent, { addAilment: { value, error: 'Choose an ailment from the list.' } })
    }

    assignAilment(db, agent.id, ailmentId)
    return c.redirect(`/agents/${agent.id}?notice=ailment-added`, 303)
  })

  routes.post(`/${ID}/ailments/:ailmentId{[0-9]+}/remove`, (c) => {
    const agent = getAgent(db, Number(c.req.param('id')))
    const ailment = getAilment(db, Number(c.req.param('ailmentId')))
    if (!agent || !ailment) return c.notFound()

    unassignAilment(db, agent.id, ailment.id)
    return c.redirect(`/agents/${agent.id}?notice=ailment-removed`, 303)
  })

  routes.get(`/${ID}/edit`, (c) => {
    const agent = getAgent(db, Number(c.req.param('id')))
    if (!agent) return c.notFound()
    const { name, model, bio } = agent
    return c.html(<AgentForm {...editAgent(agent)} values={{ name, model, bio }} />)
  })

  routes.post(`/${ID}/edit`, async (c) => {
    const id = Number(c.req.param('id'))
    const agent = getAgent(db, id)
    if (!agent) return c.notFound()

    const result = validateAgent(db, agentInput(await c.req.parseBody()), { ignoreId: id })
    if (!result.ok) {
      return c.html(<AgentForm {...editAgent(agent)} values={result.values} errors={result.errors} />, 400)
    }

    updateAgent(db, id, result.value)
    return c.redirect(`/agents/${id}?notice=updated`, 303)
  })

  routes.get(`/${ID}/dashboard`, (c) => {
    const dashboard = agentDashboard(db, Number(c.req.param('id')), nowSlot(deps))
    if (!dashboard) return c.notFound()
    return c.html(<AgentDashboardPage dashboard={dashboard} />)
  })

  return routes
}
