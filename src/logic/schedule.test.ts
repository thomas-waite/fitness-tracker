import { describe, expect, it } from 'vitest'
import { nextDayKey, nextWorkoutDate } from './schedule'
import type { WorkoutLog } from '../types'

function log(dayKey: WorkoutLog['dayKey'], finishedAt: string): WorkoutLog {
  return { id: finishedAt, dayKey, finishedAt, durationSec: 60, entries: [] }
}

describe('nextDayKey', () => {
  it('picks the upcoming program day when there is no history', () => {
    expect(nextDayKey([], new Date('2026-08-03T08:00:00'))).toBe('monday') // a Monday
    expect(nextDayKey([], new Date('2026-08-04T08:00:00'))).toBe('wednesday') // a Tuesday
    expect(nextDayKey([], new Date('2026-08-08T08:00:00'))).toBe('monday') // a Saturday
  })

  it('cycles mon -> wed -> fri -> mon after the last workout', () => {
    expect(nextDayKey([log('monday', '2026-08-03T10:00:00')])).toBe('wednesday')
    expect(nextDayKey([log('wednesday', '2026-08-05T10:00:00')])).toBe('friday')
    expect(nextDayKey([log('friday', '2026-08-07T10:00:00')])).toBe('monday')
  })

  it('uses the most recent workout', () => {
    const logs = [log('monday', '2026-08-03T10:00:00'), log('wednesday', '2026-08-05T10:00:00')]
    expect(nextDayKey(logs)).toBe('friday')
  })
})

describe('nextWorkoutDate', () => {
  it('returns today when the due day is today and nothing is logged today', () => {
    const now = new Date('2026-08-05T08:00:00') // Wednesday
    const logs = [log('monday', '2026-08-03T10:00:00')]
    expect(nextWorkoutDate(logs, now).toDateString()).toBe(now.toDateString())
  })

  it('skips to next week when the due day was already trained today', () => {
    const now = new Date('2026-08-05T18:00:00') // Wednesday evening
    const logs = [log('monday', '2026-08-05T10:00:00')] // trained today
    const next = nextWorkoutDate(logs, now)
    expect(next.getDay()).toBe(3)
    expect(next.getTime()).toBeGreaterThan(now.getTime())
  })
})
