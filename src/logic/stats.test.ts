import { describe, expect, it } from 'vitest'
import { currentStreak, estimate1RM, logVolume, longestStreak, weeklyVolume } from './stats'
import type { WorkoutLog } from '../types'

function log(finishedAt: string, sets: { weight: number; reps: number }[] = []): WorkoutLog {
  return {
    id: finishedAt,
    dayKey: 'monday',
    finishedAt,
    durationSec: 1800,
    entries: [
      {
        slotId: 'bench',
        exerciseId: 'bench',
        name: 'Bench Press',
        kind: 'weight',
        targetSets: 5,
        targetReps: 5,
        sets,
      },
    ],
  }
}

describe('estimate1RM (Epley)', () => {
  it('returns the weight itself for a single', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('scales with reps', () => {
    expect(estimate1RM(100, 5)).toBeCloseTo(116.67, 1)
  })

  it('returns 0 for empty sets', () => {
    expect(estimate1RM(100, 0)).toBe(0)
    expect(estimate1RM(0, 5)).toBe(0)
  })
})

describe('volume', () => {
  it('sums weight x reps', () => {
    const l = log('2026-08-03T10:00:00', [
      { weight: 100, reps: 5 },
      { weight: 100, reps: 5 },
    ])
    expect(logVolume(l)).toBe(1000)
  })

  it('only counts the last 7 days for weekly volume', () => {
    const logs = [
      log('2026-08-03T10:00:00', [{ weight: 100, reps: 5 }]),
      log('2026-07-20T10:00:00', [{ weight: 100, reps: 5 }]),
    ]
    expect(weeklyVolume(logs, new Date('2026-08-04T10:00:00'))).toBe(500)
  })
})

describe('streaks', () => {
  it('counts consecutive sessions with gaps of at most 4 days', () => {
    const logs = [
      log('2026-07-27T10:00:00'),
      log('2026-07-29T10:00:00'),
      log('2026-07-31T10:00:00'),
      log('2026-08-03T10:00:00'),
    ]
    expect(currentStreak(logs, new Date('2026-08-04T10:00:00'))).toBe(4)
  })

  it('breaks the streak on a long gap', () => {
    const logs = [log('2026-07-20T10:00:00'), log('2026-08-03T10:00:00')]
    expect(currentStreak(logs, new Date('2026-08-04T10:00:00'))).toBe(1)
    expect(longestStreak(logs)).toBe(1)
  })

  it('is zero when the last workout is stale', () => {
    const logs = [log('2026-07-20T10:00:00')]
    expect(currentStreak(logs, new Date('2026-08-04T10:00:00'))).toBe(0)
  })
})
