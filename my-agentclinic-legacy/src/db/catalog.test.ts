import { describe, expect, it } from 'vitest'
import { FIXED_NOW, testApp } from '../test/testApp'
import {
  agentNameTaken,
  countAppointmentsForAgent,
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  updateAgent,
} from './agents'
import {
  ailmentNameTaken,
  assignAilment,
  createAilment,
  deleteAilment,
  getAilment,
  listAgentsWithAilment,
  listAilments,
  listAilmentsForAgent,
  listAilmentsNotForAgent,
  unassignAilment,
  updateAilment,
} from './ailments'
import {
  getTherapy,
  linkTherapy,
  listRecommendedTherapies,
  listTherapies,
  listTherapiesForAilment,
  listTherapiesNotForAilment,
  unlinkTherapy,
} from './therapies'

const { db } = testApp({ now: FIXED_NOW })
const names = (rows: { name: string }[]) => rows.map((r) => r.name)

describe('agents', () => {
  it('lists every agent by name', () => {
    expect(names(listAgents(db))).toEqual([
      'Captain Hallucination',
      'GPT-Overthinker',
      'Loopy McRetry',
      'Prompta Vague',
      'Tokenia Tightwad',
    ])
  })

  it('gets one agent, or undefined', () => {
    expect(getAgent(db, 1)).toMatchObject({ id: 1, name: 'GPT-Overthinker', model: 'General-purpose language model' })
    expect(getAgent(db, 999)).toBeUndefined()
  })

  it('creates an agent and returns its new id', () => {
    const { db } = testApp()
    const agent = {
      name: 'Embedding Edna',
      model: 'Embedding model',
      bio: 'Feels close to everyone, in 1,536 dimensions.',
    }
    const id = createAgent(db, agent)
    expect(id).toBe(6)
    expect(getAgent(db, id)).toEqual({ id, ...agent })
  })

  it('updates an agent, and reports an unknown id', () => {
    const { db } = testApp()
    const changes = { name: 'GPT-Underthinker', model: 'Small language model', bio: 'Now answers in one word.' }
    expect(updateAgent(db, 1, changes)).toBe(true)
    expect(getAgent(db, 1)).toEqual({ id: 1, ...changes })
    expect(updateAgent(db, 999, changes)).toBe(false)
  })

  it('counts every appointment an agent has, whatever its status', () => {
    expect([1, 2, 3, 4, 5].map((id) => countAppointmentsForAgent(db, id))).toEqual([1, 1, 1, 0, 1])
  })

  it('deletes an agent without appointments, with their ailment links, and keeps the rest', () => {
    const { db } = testApp()
    expect(deleteAgent(db, 4)).toBe('ok')
    expect(getAgent(db, 4)).toBeUndefined()
    expect(listAgentsWithAilment(db, 4).map((a) => a.id)).not.toContain(4)
    expect(db.prepare('SELECT count(*) AS n FROM agent_ailments WHERE agent_id = 4').get()).toEqual({ n: 0 })

    expect(deleteAgent(db, 3)).toBe('has-appointments')
    expect(getAgent(db, 3)).toBeDefined()
    expect(deleteAgent(db, 999)).toBe('not-found')
  })

  it('knows when a name is taken, ignoring case, and can skip one agent', () => {
    expect(agentNameTaken(db, 'GPT-Overthinker')).toBe(true)
    expect(agentNameTaken(db, 'gpt-overTHINKER')).toBe(true)
    expect(agentNameTaken(db, 'GPT-Underthinker')).toBe(false)
    expect(agentNameTaken(db, 'GPT-Overthinker', 1)).toBe(false)
    expect(agentNameTaken(db, 'GPT-Overthinker', 2)).toBe(true)
  })
})

describe('ailments', () => {
  it('lists ailments with how many agents have each', () => {
    const fatigue = listAilments(db).find((a) => a.name === 'Prompt fatigue')
    expect(fatigue?.agentCount).toBe(3)
    expect(listAilments(db)).toHaveLength(6)
  })

  it('links agents and ailments both ways', () => {
    expect(names(listAilmentsForAgent(db, 1))).toEqual(['Contradictory-instruction whiplash', 'Prompt fatigue'])
    expect(names(listAgentsWithAilment(db, 1))).toEqual(['GPT-Overthinker', 'Loopy McRetry', 'Prompta Vague'])
    expect(getAilment(db, 2)?.name).toBe('Context-window claustrophobia')
    expect(getAilment(db, 999)).toBeUndefined()
  })

  it('creates and updates an ailment, and reports an unknown id', () => {
    const { db } = testApp()
    const ailment = { name: 'Emoji overload', description: 'Ends every reply with a rocket.' }
    const id = createAilment(db, ailment)
    expect(id).toBe(7)
    expect(getAilment(db, id)).toEqual({ id, ...ailment })

    const changes = { name: 'Emoji fatigue', description: 'Has stopped using the rocket.' }
    expect(updateAilment(db, id, changes)).toBe(true)
    expect(getAilment(db, id)).toEqual({ id, ...changes })
    expect(updateAilment(db, 999, changes)).toBe(false)
  })

  it('deletes an ailment with its agent and therapy links', () => {
    const { db } = testApp()
    expect(deleteAilment(db, 1)).toBe('ok')
    expect(getAilment(db, 1)).toBeUndefined()
    expect(listAgentsWithAilment(db, 1)).toEqual([])
    expect(listTherapiesForAilment(db, 1)).toEqual([])
    expect(db.prepare('SELECT count(*) AS n FROM agent_ailments WHERE ailment_id = 1').get()).toEqual({ n: 0 })
    expect(db.prepare('SELECT count(*) AS n FROM ailment_therapies WHERE ailment_id = 1').get()).toEqual({ n: 0 })
    expect(deleteAilment(db, 1)).toBe('not-found')
  })

  it('knows when an ailment name is taken, ignoring case, and can skip one ailment', () => {
    expect(ailmentNameTaken(db, 'prompt FATIGUE')).toBe(true)
    expect(ailmentNameTaken(db, 'Prompt fatigue', 1)).toBe(false)
    expect(ailmentNameTaken(db, 'Prompt fatigue', 2)).toBe(true)
    expect(ailmentNameTaken(db, 'Prompt euphoria')).toBe(false)
  })

  it("lists the ailments an agent doesn't have", () => {
    expect(names(listAilmentsNotForAgent(db, 1))).toEqual([
      'Context-window claustrophobia',
      'Hallucination anxiety',
      'Retry-loop syndrome',
      'Temperature dysregulation',
    ])
  })

  it('assigns and unassigns ailments, ignoring repeats', () => {
    const { db } = testApp()
    assignAilment(db, 5, 5)
    assignAilment(db, 5, 5)
    expect(names(listAilmentsForAgent(db, 5))).toEqual(['Context-window claustrophobia', 'Hallucination anxiety'])

    unassignAilment(db, 5, 2)
    unassignAilment(db, 5, 2)
    expect(names(listAilmentsForAgent(db, 5))).toEqual(['Hallucination anxiety'])
    expect(names(listAilmentsNotForAgent(db, 5))).toHaveLength(5)
  })
})

describe('therapies', () => {
  it('lists therapies with the ailments each treats', () => {
    const detox = listTherapies(db).find((t) => t.name === 'Token detox')
    expect(detox).toMatchObject({ durationMinutes: 60 })
    expect(names(detox!.ailments)).toEqual(['Context-window claustrophobia', 'Prompt fatigue'])
  })

  it('lists the therapies for an ailment', () => {
    expect(names(listTherapiesForAilment(db, 1))).toEqual(['Clarifying-questions coaching', 'Token detox'])
    expect(getTherapy(db, 2)).toMatchObject({ name: 'Guided temperature reduction', durationMinutes: 30 })
    expect(getTherapy(db, 999)).toBeUndefined()
  })

  it("recommends only therapies that treat one of the agent's ailments, without duplicates", () => {
    // GPT-Overthinker has Prompt fatigue and Contradictory-instruction whiplash; both are treated by coaching.
    expect(names(listRecommendedTherapies(db, 1))).toEqual(['Clarifying-questions coaching', 'Token detox'])
    // Tokenia Tightwad has only Context-window claustrophobia.
    expect(names(listRecommendedTherapies(db, 5))).toEqual(['Context decluttering', 'Token detox'])
    expect(listRecommendedTherapies(db, 999)).toEqual([])
  })

  it('lists the therapies not linked to an ailment', () => {
    expect(names(listTherapiesNotForAilment(db, 1))).toEqual([
      'Citation grounding',
      'Context decluttering',
      'Exponential-backoff meditation',
      'Guided temperature reduction',
    ])
  })

  it('links and unlinks therapies, ignoring repeats', () => {
    const { db } = testApp()
    linkTherapy(db, 3, 2)
    linkTherapy(db, 3, 2)
    expect(names(listTherapiesForAilment(db, 3))).toEqual([
      'Exponential-backoff meditation',
      'Guided temperature reduction',
    ])

    unlinkTherapy(db, 3, 5)
    unlinkTherapy(db, 3, 5)
    expect(names(listTherapiesForAilment(db, 3))).toEqual(['Guided temperature reduction'])
  })
})
