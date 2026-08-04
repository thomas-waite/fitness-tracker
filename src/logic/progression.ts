import { EXERCISES, getDay } from '../data/program'
import type {
  DayKey,
  ExerciseProgress,
  LoggedEntry,
  WorkoutSlot,
} from '../types'

/** Round to the nearest 5 lbs (smallest pair of standard plates). */
export function roundToPlate(weight: number): number {
  return Math.round(weight / 5) * 5
}

/** Weight to prescribe for a slot given the exercise's current working weight. */
export function slotWeight(slot: WorkoutSlot, workingWeight: number): number {
  return roundToPlate(workingWeight * (slot.weightFactor ?? 1))
}

export function incrementFor(exerciseId: string, currentWeight: number): number {
  const def = EXERCISES[exerciseId]
  if (!def || def.kind !== 'weight') return 0
  const base = def.increment ?? 5
  if (def.heavyThreshold !== undefined && currentWeight >= def.heavyThreshold) return 5
  return base
}

export function initialProgress(): Record<string, ExerciseProgress> {
  const out: Record<string, ExerciseProgress> = {}
  for (const def of Object.values(EXERCISES)) {
    if (def.kind === 'weight') {
      out[def.id] = { weight: def.startWeight ?? 45, failStreak: 0 }
    }
  }
  return out
}

/** Did the lifter complete every prescribed set and rep for this slot? */
export function slotSucceeded(slot: WorkoutSlot, sets: { reps: number }[]): boolean {
  if (sets.length < slot.sets) return false
  return sets.slice(0, slot.sets).every((s) => s.reps >= slot.reps)
}

export interface ProgressionChange {
  exerciseId: string
  name: string
  from: number
  to: number
  kind: 'increase' | 'repeat' | 'deload'
}

/**
 * Apply the program's progression rules after a finished workout.
 *
 * - Every prescribed rep completed -> add the exercise's increment.
 * - Otherwise -> repeat the same weight and count the failure.
 * - Three consecutive failures at a weight -> deload 10%.
 */
export function applyProgression(
  progression: Record<string, ExerciseProgress>,
  dayKey: DayKey,
  entries: LoggedEntry[],
): { next: Record<string, ExerciseProgress>; changes: ProgressionChange[] } {
  const day = getDay(dayKey)
  const next: Record<string, ExerciseProgress> = { ...progression }
  const changes: ProgressionChange[] = []

  for (const slot of day.slots) {
    if (!slot.progresses) continue
    const def = EXERCISES[slot.exerciseId]
    if (!def || def.kind !== 'weight') continue
    const entry = entries.find((e) => e.slotId === slot.slotId)
    if (!entry) continue

    const current = next[slot.exerciseId] ?? { weight: def.startWeight ?? 45, failStreak: 0 }

    if (slotSucceeded(slot, entry.sets)) {
      const to = roundToPlate(current.weight + incrementFor(slot.exerciseId, current.weight))
      next[slot.exerciseId] = { weight: to, failStreak: 0 }
      changes.push({ exerciseId: def.id, name: def.name, from: current.weight, to, kind: 'increase' })
    } else {
      const failStreak = current.failStreak + 1
      if (failStreak >= 3) {
        const to = roundToPlate(current.weight * 0.9)
        next[slot.exerciseId] = { weight: to, failStreak: 0 }
        changes.push({ exerciseId: def.id, name: def.name, from: current.weight, to, kind: 'deload' })
      } else {
        next[slot.exerciseId] = { weight: current.weight, failStreak }
        changes.push({
          exerciseId: def.id,
          name: def.name,
          from: current.weight,
          to: current.weight,
          kind: 'repeat',
        })
      }
    }
  }

  return { next, changes }
}
