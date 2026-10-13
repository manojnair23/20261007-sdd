import { serve } from '@hono/node-server'
import { createApp } from './app'
import { openDb, resolveDbPath } from './db/connection'
import { runMigrations } from './db/migrate'
import { parsePort } from './port'

const port = parsePort(process.env.PORT)

const dbPath = resolveDbPath(process.env)
const db = openDb(dbPath)
const applied = runMigrations(db)
console.log(`Database ready at ${dbPath} (${applied.length} migration(s) applied).`)

const app = createApp({ db, now: () => new Date() })

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`AgentClinic is open at http://localhost:${info.port}`)
})

// Close the database cleanly (checkpointing the WAL file) when the process is stopped.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close()
    db.close()
    process.exit(0)
  })
}
