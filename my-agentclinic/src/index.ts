import { serve } from '@hono/node-server'
import { app } from './app'
import { openDb, resolveDbPath } from './db/connection'
import { runMigrations } from './db/migrate'
import { parsePort } from './port'

const port = parsePort(process.env.PORT)

const db = openDb(resolveDbPath(process.env))
const applied = runMigrations(db)
console.log(`Database ready (${applied.length} migration(s) applied).`)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`AgentClinic is open at http://localhost:${info.port}`)
})
