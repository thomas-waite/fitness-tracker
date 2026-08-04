import { DAY_ORDER } from '../data/program'
import type { DayKey, WorkoutLog } from '../types'

const WEEKDAY: Record<DayKey, number> = { monday: 1, wednesday: 3, friday: 5 }

/**
 * Which program day is due next.
 *
 * With no history, pick the program day whose weekday is today or the next
 * one coming up. Afterwards, always the next day in the Mon/Wed/Fri cycle
 * after the last completed workout.
 */
export function nextDayKey(logs: WorkoutLog[], now: Date = new Date()): DayKey {
  if (logs.length === 0) {
    const today = now.getDay()
    for (let offset = 0; offset < 7; offset++) {
      const weekday = (today + offset) % 7
      const match = DAY_ORDER.find((d) => WEEKDAY[d] === weekday)
      if (match) return match
    }
    return 'monday'
  }
  const last = [...logs].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0]
  const idx = DAY_ORDER.indexOf(last.dayKey)
  return DAY_ORDER[(idx + 1) % DAY_ORDER.length]
}

/** The next calendar date on which `dayKey`'s weekday falls (today counts). */
export function nextDateFor(dayKey: DayKey, now: Date = new Date()): Date {
  const target = WEEKDAY[dayKey]
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const offset = (target - date.getDay() + 7) % 7
  date.setDate(date.getDate() + offset)
  return date
}

/** Date of the next workout, skipping today if a workout was already logged today. */
export function nextWorkoutDate(logs: WorkoutLog[], now: Date = new Date()): Date {
  const key = nextDayKey(logs, now)
  const candidate = nextDateFor(key, now)
  const doneToday = logs.some(
    (l) => new Date(l.finishedAt).toDateString() === now.toDateString(),
  )
  if (doneToday && candidate.toDateString() === now.toDateString()) {
    const next = new Date(candidate)
    next.setDate(next.getDate() + 1)
    return nextDateFor(key, next)
  }
  return candidate
}
