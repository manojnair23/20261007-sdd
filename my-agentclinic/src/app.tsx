import { join } from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { HomePage } from './views/HomePage'

// Resolve from this module (src/ or dist/) so the server works from any working directory.
const publicDir = join(__dirname, '..', 'public')

export const app = new Hono()

// Serve stylesheets and other assets from public/; unmatched requests fall through to the routes.
app.use('*', serveStatic({ root: publicDir }))

app.get('/', (c) => c.html(<HomePage />))
