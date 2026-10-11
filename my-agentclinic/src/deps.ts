import type { Db } from './db/connection'
import { toSlot, type Slot } from './time'

/** What the app needs from the outside world. Tests pass a :memory: database and a fixed clock. */
export type AppDeps = {
  db: Db
  now: () => Date
}

/** The current time as a clinic-time slot. */
export const nowSlot = (deps: AppDeps): Slot => toSlot(deps.now())

/** Route pattern for a numeric id; anything else falls through to the 404 page. */
export const ID = ':id{[0-9]+}'
