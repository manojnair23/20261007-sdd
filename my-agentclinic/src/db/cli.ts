import { openDb, resolveDbPath } from './connection'
import { runMigrations } from './migrate'
import { runSeed } from './seed'

const usage = 'Usage: tsx src/db/cli.ts <migrate|seed>'

const command = process.argv[2]
if (command !== 'migrate' && command !== 'seed') {
  console.error(usage)
  process.exit(1)
}

const path = resolveDbPath(process.env)
const db = openDb(path)
try {
  const applied = runMigrations(db)
  console.log(
    applied.length
      ? `Applied ${applied.length} migration(s) to ${path}: ${applied.join(', ')}`
      : `No migrations to apply to ${path}.`,
  )

  if (command === 'seed') {
    console.log(`Ran ${runSeed(db)} seeder(s).`)
  }
} finally {
  db.close()
}
