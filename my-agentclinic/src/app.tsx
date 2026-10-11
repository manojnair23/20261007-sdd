import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { HomePage } from './views/HomePage'

// Resolve from this module (src/ or dist/) so the server works from any working directory.
const publicDir = join(__dirname, '..', 'public')

// Pico is served from the installed package (no CDN), read once at startup.
const picoCss = readFileSync(require.resolve('@picocss/pico/css/pico.min.css'), 'utf8')

export const app = new Hono()

app.get('/pico.min.css', (c) => c.body(picoCss, 200, { 'Content-Type': 'text/css; charset=utf-8' }))

// Serve stylesheets and other assets from public/; unmatched requests fall through to the routes.
app.use('*', serveStatic({ root: publicDir }))

app.get('/', (c) => c.html(<HomePage />))
