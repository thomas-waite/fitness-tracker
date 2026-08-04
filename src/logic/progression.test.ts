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
  it('rounds to the nearest 2.5 kg', () => {
    expect(roundToPlate(41.2)).toBe(40)
    expect(roundToPlate(41.25)).toBe(42.5)
    expect(roundToPlate(45)).toBe(45)
  })
})

describe('incrementFor', () => {
  it('uses +2.5 for squat and bench', () => {
    expect(incrementFor('squat', 100)).toBe(2.5)
    expect(incrementFor('bench', 60)).toBe(2.5)
  })

  it('uses +5 for deadlift until heavy, then +2.5', () => {
    expect(incrementFor('deadlift', 100)).toBe(5)
    expect(incrementFor('deadlift', 140)).toBe(2.5)
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
    expect(slotWeight(light, 100)).toBe(80)
    expect(slotWeight(light, 42.5)).toBe(35) // 34 -> rounded to 35
  })
})

describe('applyProgression', () => {
  it('increases weight after a fully completed workout', () => {
    const start = initialProgress()
    const { next, changes } = applyProgression(start, 'monday', entriesFor('monday', {}))
    expect(next.squat.weight).toBe(start.squat.weight + 2.5)
    expect(next.bench.weight).toBe(start.bench.weight + 2.5)
    expect(next.row.weight).toBe(start.row.weight + 2.5)
    expect(changes.every((c) => c.kind === 'increase')).toBe(true)
  })

  it('adds +5 to deadlift on wednesday', () => {
    const start = initialProgress()
    const { next } = applyProgression(start, 'wednesday', entriesFor('wednesday', {}))
    expect(next.deadlift.weight).toBe(start.deadlift.weight + 5)
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
      bench: { weight: 100, failStreak: 0 },
    }
    const failed = entriesFor('monday', { bench: [5, 5, 5, 5, 3] })
    for (let i = 0; i < 2; i++) {
      progression = applyProgression(progression, 'monday', failed).next
    }
    expect(progression.bench).toEqual({ weight: 100, failStreak: 2 })
    const { next, changes } = applyProgression(progression, 'monday', failed)
    expect(next.bench.weight).toBe(90)
    expect(next.bench.failStreak).toBe(0)
    expect(changes.find((c) => c.exerciseId === 'bench')?.kind).toBe('deload')
  })

  it('resets the fail streak after a success', () => {
    const progression = { ...initialProgress(), bench: { weight: 100, failStreak: 2 } }
    const { next } = applyProgression(progression, 'monday', entriesFor('monday', {}))
    expect(next.bench).toEqual({ weight: 102.5, failStreak: 0 })
  })
})
