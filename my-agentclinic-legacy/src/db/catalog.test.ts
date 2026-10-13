import { describe, expect, it } from 'vitest'
import { FIXED_NOW, testApp } from '../test/testApp'
import { agentNameTaken, createAgent, getAgent, listAgents } from './agents'
import { getAilment, listAgentsWithAilment, listAilments, listAilmentsForAgent } from './ailments'
import { getTherapy, listRecommendedTherapies, listTherapies, listTherapiesForAilment } from './therapies'

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
})
