// Clinic time: naive local "YYYY-MM-DDTHH:mm" slots, exactly what <input type="datetime-local"> submits.
// Slots sort and compare correctly as plain strings.

export type Slot = string

const SLOT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

const pad = (n: number) => String(n).padStart(2, '0')

/** Formats a date as a slot in local time. */
export function toSlot(date: Date): Slot {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** Parses a slot into a local Date, or returns undefined if it isn't a real date and time. */
export function parseSlot(text: string): Date | undefined {
  const match = SLOT.exec(text)
  if (!match) return undefined
  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day, hour, minute)
  // Reject values the Date constructor silently rolls over, such as Feb 30 or 25:00.
  return toSlot(date) === text ? date : undefined
}

export function isSlot(text: string): boolean {
  return parseSlot(text) !== undefined
}

export function addMinutes(slot: Slot, minutes: number): Slot {
  const date = parseSlot(slot)
  if (!date) throw new Error(`Not a slot: ${slot}`)
  date.setMinutes(date.getMinutes() + minutes)
  return toSlot(date)
}

/** The date part of a slot, "YYYY-MM-DD". */
export const slotDate = (slot: Slot) => slot.slice(0, 10)

/** The time part of a slot, "HH:mm". */
export const slotTime = (slot: Slot) => slot.slice(11, 16)

const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

// ICU puts a narrow no-break space before AM/PM; use a plain space so copy and tests stay simple.
const plain = (text: string) => text.replace(/\u202f/g, ' ')

/** Human-readable slot, for example "Mon, Oct 12, 2026, 2:30 PM". */
export function formatSlot(slot: Slot): string {
  const date = parseSlot(slot)
  return date ? plain(dateTimeFormat.format(date)) : slot
}

/** Human-readable time of day, for example "2:30 PM". */
export function formatTime(slot: Slot): string {
  const date = parseSlot(slot)
  return date ? plain(timeFormat.format(date)) : slot
}
