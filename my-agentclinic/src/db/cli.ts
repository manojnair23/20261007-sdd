import { countAppointments } from './appointments'
import { openDb, resolveDbPath } from './connection'
import { runMigrations } from './migrate'
import { runSeed } from './seed'

const usage = 'Usage: tsx src/db/cli.ts <migrate|seed> [--force]'

const [command, ...flags] = process.argv.slice(2)
const force = flags.includes('--force')
if ((command !== 'migrate' && command !== 'seed') || flags.some((flag) => flag !== '--force')) {
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
    // Seeding wipes the clinic, so never throw away bookings by accident.
    const existing = countAppointments(db)
    if (existing > 0 && !force) {
      console.error(
        `The clinic has ${existing} appointment(s). Re-run with --force to wipe them and reload the demo data.`,
      )
      process.exitCode = 1
    } else {
      console.log('Resetting demo data…')
      console.log(`Ran ${runSeed(db)} seeder(s).`)
    }
  }
} catch (err) {
  console.error((err as Error).message)
  process.exitCode = 1
} finally {
  db.close()
}
