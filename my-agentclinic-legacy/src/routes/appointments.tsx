import { Hono, type Context } from 'hono'
import { validateBooking, type BookingInput } from '../appointments/validate'
import { listAgents } from '../db/agents'
import {
  cancelAppointment,
  createAppointment,
  getAppointment,
  isChangeable,
  listAppointments,
  rescheduleAppointment,
} from '../db/appointments'
import { listRecommendedTherapies, listTherapies } from '../db/therapies'
import { ID, nowSlot, type AppDeps } from '../deps'
import { formText } from '../validation'
import { AppointmentsPage, NOTICES } from '../views/appointments/AppointmentsPage'
import { NewBookingForm, RescheduleForm } from '../views/appointments/BookingForm'
import { NotChangeablePage } from '../views/appointments/NotChangeablePage'
import { noticeKey } from '../views/components'

export function appointmentRoutes(deps: AppDeps) {
  const { db } = deps
  const routes = new Hono()

  const bookingForm = (c: Context, values: BookingInput, errors = {}, status: 200 | 400 = 200) => {
    const agentId = Number(values.agent)
    const recommended = Number.isInteger(agentId) && agentId > 0 ? listRecommendedTherapies(db, agentId) : []
    const others = listTherapies(db).filter((t) => !recommended.some((r) => r.id === t.id))
    return c.html(
      <NewBookingForm
        agents={listAgents(db)}
        recommended={recommended}
        others={others}
        values={values}
        errors={errors}
        now={nowSlot(deps)}
      />,
      status,
    )
  }

  routes.get('/', (c) =>
    c.html(
      <AppointmentsPage {...listAppointments(db, nowSlot(deps))} notice={noticeKey(NOTICES, c.req.query('notice'))} />,
    ),
  )

  routes.get('/new', (c) =>
    bookingForm(c, { agent: c.req.query('agent') ?? '', therapy: c.req.query('therapy') ?? '', startsAt: '' }),
  )

  routes.post('/new', async (c) => {
    const body = await c.req.parseBody()
    const input = {
      agent: formText(body, 'agent'),
      therapy: formText(body, 'therapy'),
      startsAt: formText(body, 'startsAt'),
    }
    const result = validateBooking(db, input, nowSlot(deps))
    if (!result.ok) return bookingForm(c, result.values, result.errors, 400)

    createAppointment(db, result.value, deps.now())
    return c.redirect('/appointments?notice=booked', 303)
  })

  routes.get(`/${ID}/reschedule`, (c) => {
    const appointment = getAppointment(db, Number(c.req.param('id')))
    if (!appointment) return c.notFound()
    if (!isChangeable(appointment, nowSlot(deps))) return c.html(<NotChangeablePage appointment={appointment} />, 409)
    return c.html(<RescheduleForm appointment={appointment} startsAt={appointment.startsAt} now={nowSlot(deps)} />)
  })

  routes.post(`/${ID}/reschedule`, async (c) => {
    const id = Number(c.req.param('id'))
    const appointment = getAppointment(db, id)
    if (!appointment) return c.notFound()
    const now = nowSlot(deps)
    if (!isChangeable(appointment, now)) return c.html(<NotChangeablePage appointment={appointment} />, 409)

    const startsAt = formText(await c.req.parseBody(), 'startsAt')
    const input = { agent: String(appointment.agentId), therapy: String(appointment.therapyId), startsAt }
    const result = validateBooking(db, input, now, { ignoreId: id })
    if (!result.ok) {
      return c.html(
        <RescheduleForm appointment={appointment} startsAt={result.values.startsAt} errors={result.errors} now={now} />,
        400,
      )
    }

    rescheduleAppointment(db, id, result.value.startsAt, deps.now(), now)
    return c.redirect('/appointments?notice=rescheduled', 303)
  })

  routes.post(`/${ID}/cancel`, (c) => {
    const id = Number(c.req.param('id'))
    const outcome = cancelAppointment(db, id, deps.now(), nowSlot(deps))
    if (outcome === 'not-found') return c.notFound()
    if (outcome === 'not-changeable') {
      return c.html(<NotChangeablePage appointment={getAppointment(db, id)!} />, 409)
    }
    return c.redirect('/appointments?notice=cancelled', 303)
  })

  return routes
}
