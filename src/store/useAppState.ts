import { useEffect, useState } from 'react'
import { EXERCISES, getDay } from '../data/program'
import { initialProgress, slotWeight } from '../logic/progression'
import type { ActiveWorkout, AppState, DayKey, SetEntry, WorkoutLog } from '../types'

// v1 stored weights in kg; v2 stores them in lbs.
const STORAGE_KEY = 'strength-tracker-v2'
const LEGACY_KG_KEY = 'strength-tracker-v1'
const KG_TO_LBS = 2.20462

function defaultState(): AppState {
  return {
    progression: initialProgress(),
    logs: [],
    bodyweight: null,
    activeWorkout: null,
  }
}

function round5(n: number): number {
  return Math.round(n / 5) * 5
}

function round2p5(n: number): number {
  return Math.round(n / 2.5) * 2.5
}

/** Convert a v1 (kg) state blob to lbs. */
export function migrateKgState(raw: string): AppState {
  const old = JSON.parse(raw) as Partial<AppState> & { bodyweightKg?: number | null }
  const progression: AppState['progression'] = {}
  for (const [id, p] of Object.entries(old.progression ?? {})) {
    progression[id] = { ...p, weight: round5(p.weight * KG_TO_LBS) }
  }
  const logs = (old.logs ?? []).map((log) => ({
    ...log,
    entries: log.entries.map((entry) => ({
      ...entry,
      sets:
        entry.kind === 'weight'
          ? entry.sets.map((s) => ({ ...s, weight: round2p5(s.weight * KG_TO_LBS) }))
          : entry.sets,
    })),
  }))
  return {
    ...defaultState(),
    progression: { ...initialProgress(), ...progression },
    logs,
    bodyweight: old.bodyweightKg ? Math.round(old.bodyweightKg * KG_TO_LBS) : null,
    // Any in-progress workout keeps kg numbers; safer to drop it.
    activeWorkout: null,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>
      return {
        ...defaultState(),
        ...parsed,
        progression: { ...initialProgress(), ...(parsed.progression ?? {}) },
      }
    }
    const legacy = localStorage.getItem(LEGACY_KG_KEY)
    if (legacy) {
      const migrated = migrateKgState(legacy)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(LEGACY_KG_KEY)
      return migrated
    }
    return defaultState()
  } catch {
    return defaultState()
  }
}

export function buildActiveWorkout(
  dayKey: DayKey,
  progression: AppState['progression'],
): ActiveWorkout {
  const day = getDay(dayKey)
  return {
    dayKey,
    startedAt: Date.now(),
    currentSlot: 0,
    entries: day.slots.map((slot) => {
      const def = EXERCISES[slot.exerciseId]
      const working = def.kind === 'weight' ? progression[slot.exerciseId]?.weight ?? 45 : 0
      const weight = def.kind === 'weight' ? slotWeight(slot, working) : 0
      const sets: SetEntry[] = Array.from({ length: slot.sets }, () => ({
        weight,
        reps: slot.reps,
        done: false,
      }))
      return { slotId: slot.slotId, sets }
    }),
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return {
    state,
    setState,
    update(patch: Partial<AppState>) {
      setState((s) => ({ ...s, ...patch }))
    },
    addLog(log: WorkoutLog, progression: AppState['progression']) {
      setState((s) => ({
        ...s,
        logs: [...s.logs, log],
        progression,
        activeWorkout: null,
      }))
    },
  }
}
