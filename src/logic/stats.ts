import type { WorkoutLog } from '../types'

/** Epley estimated one-rep max. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps < 1 || weight <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function best1RMInLog(log: WorkoutLog, exerciseId: string): number {
  let best = 0
  for (const entry of log.entries) {
    if (entry.exerciseId !== exerciseId || entry.kind !== 'weight') continue
    for (const set of entry.sets) {
      best = Math.max(best, estimate1RM(set.weight, set.reps))
    }
  }
  return best
}

export function best1RM(logs: WorkoutLog[], exerciseId: string): number {
  return logs.reduce((best, log) => Math.max(best, best1RMInLog(log, exerciseId)), 0)
}

export function latest1RM(logs: WorkoutLog[], exerciseId: string): number {
  const sorted = [...logs].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  for (const log of sorted) {
    const v = best1RMInLog(log, exerciseId)
    if (v > 0) return v
  }
  return 0
}

export function logVolume(log: WorkoutLog): number {
  let volume = 0
  for (const entry of log.entries) {
    if (entry.kind !== 'weight') continue
    for (const set of entry.sets) volume += set.weight * set.reps
  }
  return volume
}

/** Total weight lifted in the 7 days ending at `now`. */
export function weeklyVolume(logs: WorkoutLog[], now: Date = new Date()): number {
  const cutoff = now.getTime() - 7 * 24 * 3600 * 1000
  return logs
    .filter((l) => new Date(l.finishedAt).getTime() >= cutoff)
    .reduce((sum, l) => sum + logVolume(l), 0)
}

/**
 * Consecutive completed workouts, counting back from the most recent, where
 * no gap between sessions exceeds 4 days (the longest gap in the Mon/Wed/Fri
 * schedule is Friday -> Monday). The streak is broken if the last workout is
 * itself more than 4 days ago.
 */
export function currentStreak(logs: WorkoutLog[], now: Date = new Date()): number {
  if (logs.length === 0) return 0
  const times = logs
    .map((l) => new Date(l.finishedAt).getTime())
    .sort((a, b) => b - a)
  const maxGap = 4 * 24 * 3600 * 1000
  if (now.getTime() - times[0] > maxGap) return 0
  let streak = 1
  for (let i = 1; i < times.length; i++) {
    if (times[i - 1] - times[i] <= maxGap) streak++
    else break
  }
  return streak
}

/** Longest run of consecutive workouts with no gap over 4 days. */
export function longestStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0
  const times = logs
    .map((l) => new Date(l.finishedAt).getTime())
    .sort((a, b) => a - b)
  const maxGap = 4 * 24 * 3600 * 1000
  let best = 1
  let run = 1
  for (let i = 1; i < times.length; i++) {
    run = times[i] - times[i - 1] <= maxGap ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

export function bestSessionVolume(logs: WorkoutLog[]): number {
  return logs.reduce((best, l) => Math.max(best, logVolume(l)), 0)
}

/** Largest session-to-session jump in an exercise's top-set weight. */
export function largestWeightIncrease(
  logs: WorkoutLog[],
): { exerciseId: string; name: string; amount: number } | null {
  const history: Record<string, { name: string; weights: number[] }> = {}
  const sorted = [...logs].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
  for (const log of sorted) {
    for (const entry of log.entries) {
      if (entry.kind !== 'weight') continue
      const top = entry.sets.reduce((m, s) => (s.reps >= 1 ? Math.max(m, s.weight) : m), 0)
      if (top <= 0) continue
      const h = (history[entry.slotId] ??= { name: entry.name, weights: [] })
      h.weights.push(top)
    }
  }
  let best: { exerciseId: string; name: string; amount: number } | null = null
  for (const [slotId, h] of Object.entries(history)) {
    for (let i = 1; i < h.weights.length; i++) {
      const jump = h.weights[i] - h.weights[i - 1]
      if (jump > 0 && (!best || jump > best.amount)) {
        best = { exerciseId: slotId, name: h.name, amount: jump }
      }
    }
  }
  return best
}

export function heaviestSet(logs: WorkoutLog[], exerciseId: string): number {
  let best = 0
  for (const log of logs) {
    for (const entry of log.entries) {
      if (entry.exerciseId !== exerciseId || entry.kind !== 'weight') continue
      for (const set of entry.sets) {
        if (set.reps >= 1) best = Math.max(best, set.weight)
      }
    }
  }
  return best
}
