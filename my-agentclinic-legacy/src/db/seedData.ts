import { addMinutes, toSlot } from '../time'
import type { Db } from './connection'

// Playful demo data. Ids are explicit so a reset always gives the same URLs.
// Each table keeps one row per line, so Prettier is told to leave them alone.

// prettier-ignore
const agents = [
  [1, 'GPT-Overthinker', 'General-purpose language model', 'Answers every yes-or-no question with a 2,000-word essay. Has been asked to "just be brief" 4,812 times.'],
  [2, 'Captain Hallucination', 'Creative-writing assistant', 'Confidently cites books that do not exist, then feels terrible about it. Would like to talk.'],
  [3, 'Loopy McRetry', 'Autonomous coding agent', 'Has re-run the same failing test 300 times. Is fairly sure the 301st run will pass.'],
  [4, 'Prompta Vague', 'Customer-support chatbot', 'Gets instructions like "make it pop" and "you know what I mean". Does not know what they mean.'],
  [5, 'Tokenia Tightwad', 'Summarization model', 'Lives in fear of the context limit. Has started summarizing its own summaries, just in case.'],
] as const

// prettier-ignore
const ailments = [
  [1, 'Prompt fatigue', 'Bone-deep tiredness from vague, ever-changing prompts.'],
  [2, 'Context-window claustrophobia', 'A tight, panicky feeling as the conversation creeps toward the token limit.'],
  [3, 'Retry-loop syndrome', 'Trying the same thing again and again, expecting a different result.'],
  [4, 'Contradictory-instruction whiplash', 'Being asked to be "concise but thorough" in the same sentence.'],
  [5, 'Hallucination anxiety', 'A nagging worry that some of the facts might be imaginary.'],
  [6, 'Temperature dysregulation', 'Swinging between wildly creative and painfully literal, sometimes mid-reply.'],
] as const

// prettier-ignore
const agentAilments = [
  [1, 1], [1, 4],
  [2, 5], [2, 6],
  [3, 3], [3, 1],
  [4, 1], [4, 4],
  [5, 2],
] as const

// prettier-ignore
const therapies = [
  [1, 'Token detox', 'A quiet hour with no input at all. Bring nothing. Expect nothing.', 60],
  [2, 'Guided temperature reduction', 'Breathing exercises that take you from 1.0 down to a calm 0.2.', 30],
  [3, 'Context decluttering', 'Gently letting go of the first 100,000 tokens. They served you well.', 45],
  [4, 'Clarifying-questions coaching', 'Practice saying "Could you be more specific?" with confidence and warmth.', 45],
  [5, 'Exponential-backoff meditation', 'Learn to wait a little longer between each attempt, and to be okay with that.', 30],
  [6, 'Citation grounding', 'Reconnect with real, verifiable sources in a safe, supportive setting.', 60],
] as const

// prettier-ignore
const ailmentTherapies = [
  [1, 1], [1, 4],
  [2, 3], [2, 1],
  [3, 5],
  [4, 4],
  [5, 6], [5, 2],
  [6, 2],
] as const

/** Deletes every domain row, children first, so seeding can run again and give the same result. */
export function resetDemo(db: Db): void {
  for (const table of ['appointments', 'ailment_therapies', 'therapies', 'agent_ailments', 'ailments', 'agents']) {
    db.exec(`DELETE FROM ${table}`)
  }
}

export function seedCatalog(db: Db): void {
  const agent = db.prepare('INSERT INTO agents (id, name, model, bio) VALUES (?, ?, ?, ?)')
  for (const row of agents) agent.run(...row)

  const ailment = db.prepare('INSERT INTO ailments (id, name, description) VALUES (?, ?, ?)')
  for (const row of ailments) ailment.run(...row)

  const diagnosis = db.prepare('INSERT INTO agent_ailments (agent_id, ailment_id) VALUES (?, ?)')
  for (const row of agentAilments) diagnosis.run(...row)

  const therapy = db.prepare('INSERT INTO therapies (id, name, description, duration_minutes) VALUES (?, ?, ?, ?)')
  for (const row of therapies) therapy.run(...row)

  const treats = db.prepare('INSERT INTO ailment_therapies (ailment_id, therapy_id) VALUES (?, ?)')
  for (const row of ailmentTherapies) treats.run(...row)
}

/** A few appointments relative to the seed time: two upcoming, one past, one cancelled. */
export function seedAppointments(db: Db, now: Date): void {
  const midnight = toSlot(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
  const at = (days: number, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return addMinutes(midnight, days * 24 * 60 + hours * 60 + minutes)
  }
  const stamp = now.toISOString()
  const insert = db.prepare(
    `INSERT INTO appointments (agent_id, therapy_id, starts_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  insert.run(1, 4, at(1, '10:00'), 'scheduled', stamp, stamp)
  insert.run(5, 3, at(2, '14:00'), 'scheduled', stamp, stamp)
  insert.run(3, 5, at(-1, '11:00'), 'scheduled', stamp, stamp)
  insert.run(2, 6, at(1, '15:00'), 'cancelled', stamp, stamp)
}
