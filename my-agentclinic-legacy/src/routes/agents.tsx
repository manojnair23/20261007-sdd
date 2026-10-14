import { Hono, type Context } from 'hono'
import { validateAgent } from '../agents/validate'
import {
  countAppointmentsForAgent,
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  updateAgent,
  type Agent,
} from '../db/agents'
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
import { AGENTS_NOTICES, AgentsPage } from '../views/agents/AgentsPage'
import { countOf, noticeKey } from '../views/components'
import { CannotDeletePage, ConfirmDeletePage } from '../views/DeletePages'
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

  routes.get('/', (c) =>
    c.html(<AgentsPage agents={listAgents(db)} notice={noticeKey(AGENTS_NOTICES, c.req.query('notice'))} />),
  )

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

  const cannotDelete = (c: Context, agent: Agent) =>
    c.html(
      <CannotDeletePage name={agent.name} path={`/agents/${agent.id}/delete`}>
        <p>
          {agent.name} has {countOf(countAppointmentsForAgent(db, agent.id), 'appointment')} on record, counting
          upcoming, past, and cancelled ones. Agents with appointments stay, so the clinic's history still makes sense.
        </p>
        <p>
          <a href={`/agents/${agent.id}/dashboard`}>See {agent.name}'s appointments</a> or{' '}
          <a href={`/agents/${agent.id}`}>go back to {agent.name}</a>.
        </p>
      </CannotDeletePage>,
      409,
    )

  routes.get(`/${ID}/delete`, (c) => {
    const agent = getAgent(db, Number(c.req.param('id')))
    if (!agent) return c.notFound()
    if (countAppointmentsForAgent(db, agent.id) > 0) return cannotDelete(c, agent)

    const ailments = listAilmentsForAgent(db, agent.id).length
    return c.html(
      <ConfirmDeletePage name={agent.name} action={`/agents/${agent.id}/delete`} cancelHref={`/agents/${agent.id}`}>
        <p>
          This removes {agent.name} from the clinic
          {ailments > 0 ? `, along with their ${countOf(ailments, 'ailment')} on file` : ''}. The ailments themselves
          stay.
        </p>
      </ConfirmDeletePage>,
    )
  })

  routes.post(`/${ID}/delete`, (c) => {
    const agent = getAgent(db, Number(c.req.param('id')))
    if (!agent) return c.notFound()

    const outcome = deleteAgent(db, agent.id)
    if (outcome === 'not-found') return c.notFound()
    if (outcome === 'has-appointments') return cannotDelete(c, agent)
    return c.redirect('/agents?notice=deleted', 303)
  })

  routes.get(`/${ID}/dashboard`, (c) => {
    const dashboard = agentDashboard(db, Number(c.req.param('id')), nowSlot(deps))
    if (!dashboard) return c.notFound()
    return c.html(<AgentDashboardPage dashboard={dashboard} />)
  })

  return routes
}
