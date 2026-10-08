import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { HomePage } from './views/HomePage'

export const app = new Hono()

app.use('/styles.css', serveStatic({ root: './public' }))

app.get('/', (c) => c.html(<HomePage />))
