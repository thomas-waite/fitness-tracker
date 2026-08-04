import { useEffect, useState } from 'react'
import { EXERCISES, getDay } from '../data/program'
import { initialProgress, slotWeight } from '../logic/progression'
import type { ActiveWorkout, AppState, DayKey, SetEntry, WorkoutLog } from '../types'

const STORAGE_KEY = 'strength-tracker-v1'

function defaultState(): AppState {
  return {
    progression: initialProgress(),
    logs: [],
    bodyweightKg: null,
    activeWorkout: null,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...defaultState(),
      ...parsed,
      progression: { ...initialProgress(), ...(parsed.progression ?? {}) },
    }
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
      const working = def.kind === 'weight' ? progression[slot.exerciseId]?.weight ?? 20 : 0
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
