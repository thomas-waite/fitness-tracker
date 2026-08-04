import { describe, expect, it } from 'vitest'
import { migrateKgState } from './useAppState'

describe('migrateKgState', () => {
  it('converts kg weights to lbs', () => {
    const v1 = JSON.stringify({
      progression: { bench: { weight: 60, failStreak: 1 } },
      logs: [
        {
          id: 'w-1',
          dayKey: 'monday',
          finishedAt: '2026-08-03T10:00:00.000Z',
          durationSec: 1800,
          entries: [
            {
              slotId: 'bench',
              exerciseId: 'bench',
              name: 'Bench Press',
              kind: 'weight',
              targetSets: 5,
              targetReps: 5,
              sets: [{ weight: 60, reps: 5 }],
            },
            {
              slotId: 'plank',
              exerciseId: 'plank',
              name: 'Plank',
              kind: 'timed',
              targetSets: 3,
              targetReps: 60,
              sets: [{ weight: 0, reps: 60 }],
            },
          ],
        },
      ],
      bodyweightKg: 80,
      activeWorkout: null,
    })

    const state = migrateKgState(v1)
    // 60 kg = 132.3 lbs -> nearest 5 for working weight, nearest 2.5 for logs
    expect(state.progression.bench).toEqual({ weight: 130, failStreak: 1 })
    expect(state.logs[0].entries[0].sets[0].weight).toBe(132.5)
    // timed sets untouched
    expect(state.logs[0].entries[1].sets[0].reps).toBe(60)
    // 80 kg = 176.4 lbs
    expect(state.bodyweight).toBe(176)
    // untouched exercises get lbs defaults
    expect(state.progression.squat.weight).toBe(90)
  })
})
