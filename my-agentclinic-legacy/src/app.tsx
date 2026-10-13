import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import type { AppDeps } from './deps'
import { agentRoutes } from './routes/agents'
import { ailmentRoutes } from './routes/ailments'
import { appointmentRoutes } from './routes/appointments'
import { dashboardRoutes } from './routes/dashboard'
import { therapyRoutes } from './routes/therapies'
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from './views/ErrorPages'
import { HomePage } from './views/HomePage'

export type { AppDeps } from './deps'

// Resolve from this module (src/ or dist/) so the server works from any working directory.
const publicDir = join(__dirname, '..', 'public')

// Pico is served from the installed package (no CDN), read once at startup.
const picoCss = readFileSync(require.resolve('@picocss/pico/css/pico.min.css'), 'utf8')

/** Builds the app around its database and clock, so tests can pass their own. */
export function createApp(deps: AppDeps) {
  const app = new Hono()

  // Reject form posts that come from another site: the Origin (or Sec-Fetch-Site) must be this app.
  app.use('*', csrf())

  app.get('/pico.min.css', (c) => c.body(picoCss, 200, { 'Content-Type': 'text/css; charset=utf-8' }))

  // Serve stylesheets and other assets from public/; unmatched requests fall through to the routes.
  app.use('*', serveStatic({ root: publicDir }))

  app.get('/', (c) => c.html(<HomePage />))
  app.route('/agents', agentRoutes(deps))
  app.route('/ailments', ailmentRoutes(deps))
  app.route('/therapies', therapyRoutes(deps))
  app.route('/appointments', appointmentRoutes(deps))
  app.route('/dashboard', dashboardRoutes(deps))

  app.notFound((c) => c.html(<NotFoundPage path={c.req.path} />, 404))

  app.onError((err, c) => {
    // csrf() throws a 403; it's an expected refusal, not a server fault, so it isn't logged.
    if (err instanceof HTTPException && err.status === 403) return c.html(<ForbiddenPage />, 403)
    console.error(err)
    return c.html(<ServerErrorPage />, 500)
  })

  return app
}
