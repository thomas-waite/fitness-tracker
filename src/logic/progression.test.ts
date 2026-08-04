import { describe, expect, it } from 'vitest'
import {
  applyProgression,
  incrementFor,
  initialProgress,
  roundToPlate,
  slotSucceeded,
  slotWeight,
} from './progression'
import { getDay } from '../data/program'
import type { LoggedEntry } from '../types'

function entriesFor(
  dayKey: 'monday' | 'wednesday' | 'friday',
  repsBySlot: Record<string, number[]>,
  weight = 50,
): LoggedEntry[] {
  return getDay(dayKey).slots.map((slot) => ({
    slotId: slot.slotId,
    exerciseId: slot.exerciseId,
    name: slot.label ?? slot.exerciseId,
    kind: 'weight',
    targetSets: slot.sets,
    targetReps: slot.reps,
    sets: (repsBySlot[slot.slotId] ?? Array(slot.sets).fill(slot.reps)).map((reps) => ({
      weight,
      reps,
    })),
  }))
}

describe('roundToPlate', () => {
  it('rounds to the nearest 5 lbs', () => {
    expect(roundToPlate(92)).toBe(90)
    expect(roundToPlate(93)).toBe(95)
    expect(roundToPlate(95)).toBe(95)
  })
})

describe('incrementFor', () => {
  it('uses +5 for squat and bench', () => {
    expect(incrementFor('squat', 200)).toBe(5)
    expect(incrementFor('bench', 135)).toBe(5)
  })

  it('uses +10 for deadlift until heavy, then +5', () => {
    expect(incrementFor('deadlift', 225)).toBe(10)
    expect(incrementFor('deadlift', 300)).toBe(5)
  })
})

describe('slotSucceeded', () => {
  const slot = getDay('monday').slots[0] // squat 5x5

  it('succeeds when all prescribed reps are done', () => {
    expect(slotSucceeded(slot, Array(5).fill({ reps: 5 }))).toBe(true)
  })

  it('fails on missed reps or missing sets', () => {
    expect(slotSucceeded(slot, [{ reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 4 }])).toBe(false)
    expect(slotSucceeded(slot, Array(4).fill({ reps: 5 }))).toBe(false)
  })
})

describe('slotWeight', () => {
  it('applies the light-day factor and plate rounding', () => {
    const light = getDay('wednesday').slots[0]
    expect(slotWeight(light, 200)).toBe(160)
    expect(slotWeight(light, 135)).toBe(110) // 108 -> rounded to 110
  })
})

describe('applyProgression', () => {
  it('increases weight after a fully completed workout', () => {
    const start = initialProgress()
    const { next, changes } = applyProgression(start, 'monday', entriesFor('monday', {}))
    expect(next.squat.weight).toBe(start.squat.weight + 5)
    expect(next.bench.weight).toBe(start.bench.weight + 5)
    expect(next.row.weight).toBe(start.row.weight + 5)
    expect(changes.every((c) => c.kind === 'increase')).toBe(true)
  })

  it('adds +10 to deadlift on wednesday', () => {
    const start = initialProgress()
    const { next } = applyProgression(start, 'wednesday', entriesFor('wednesday', {}))
    expect(next.deadlift.weight).toBe(start.deadlift.weight + 10)
  })

  it('does not progress squat from the light day', () => {
    const start = initialProgress()
    const { next } = applyProgression(start, 'wednesday', entriesFor('wednesday', {}))
    expect(next.squat).toEqual(start.squat)
  })

  it('repeats the weight after a failure and counts the fail streak', () => {
    const start = initialProgress()
    const failed = entriesFor('monday', { bench: [5, 5, 5, 5, 3] })
    const { next, changes } = applyProgression(start, 'monday', failed)
    expect(next.bench.weight).toBe(start.bench.weight)
    expect(next.bench.failStreak).toBe(1)
    expect(changes.find((c) => c.exerciseId === 'bench')?.kind).toBe('repeat')
  })

  it('deloads 10% after three consecutive failures', () => {
    let progression: Record<string, { weight: number; failStreak: number }> = {
      ...initialProgress(),
      bench: { weight: 200, failStreak: 0 },
    }
    const failed = entriesFor('monday', { bench: [5, 5, 5, 5, 3] })
    for (let i = 0; i < 2; i++) {
      progression = applyProgression(progression, 'monday', failed).next
    }
    expect(progression.bench).toEqual({ weight: 200, failStreak: 2 })
    const { next, changes } = applyProgression(progression, 'monday', failed)
    expect(next.bench.weight).toBe(180)
    expect(next.bench.failStreak).toBe(0)
    expect(changes.find((c) => c.exerciseId === 'bench')?.kind).toBe('deload')
  })

  it('resets the fail streak after a success', () => {
    const progression = { ...initialProgress(), bench: { weight: 200, failStreak: 2 } }
    const { next } = applyProgression(progression, 'monday', entriesFor('monday', {}))
    expect(next.bench).toEqual({ weight: 205, failStreak: 0 })
  })
})
