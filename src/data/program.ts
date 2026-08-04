import type { DayKey, ExerciseDef, ProgramDay } from '../types'

export const EXERCISES: Record<string, ExerciseDef> = {
  squat: { id: 'squat', name: 'Back Squat', kind: 'weight', startWeight: 90, increment: 5 },
  bench: { id: 'bench', name: 'Bench Press', kind: 'weight', startWeight: 65, increment: 5 },
  row: { id: 'row', name: 'Barbell Row', kind: 'weight', startWeight: 65, increment: 5 },
  ohp: { id: 'ohp', name: 'Overhead Press', kind: 'weight', startWeight: 55, increment: 5 },
  deadlift: {
    id: 'deadlift',
    name: 'Deadlift',
    kind: 'weight',
    startWeight: 135,
    increment: 10,
    heavyThreshold: 300,
  },
  rdl: { id: 'rdl', name: 'Romanian Deadlift', kind: 'weight', startWeight: 90, increment: 5 },
  plank: { id: 'plank', name: 'Plank', kind: 'timed' },
  pullup: { id: 'pullup', name: 'Pull-ups', kind: 'bodyweight' },
  dips: { id: 'dips', name: 'Dips', kind: 'bodyweight' },
}

export const PROGRAM: ProgramDay[] = [
  {
    dayKey: 'monday',
    title: 'Monday',
    slots: [
      { slotId: 'squat', exerciseId: 'squat', sets: 5, reps: 5, progresses: true },
      { slotId: 'bench', exerciseId: 'bench', sets: 5, reps: 5, progresses: true },
      { slotId: 'row', exerciseId: 'row', sets: 3, reps: 8, progresses: true },
      { slotId: 'plank', exerciseId: 'plank', sets: 3, reps: 60, progresses: false },
    ],
  },
  {
    dayKey: 'wednesday',
    title: 'Wednesday',
    slots: [
      {
        slotId: 'squat-light',
        exerciseId: 'squat',
        label: 'Back Squat (light)',
        sets: 3,
        reps: 5,
        weightFactor: 0.8,
        progresses: false,
      },
      { slotId: 'ohp', exerciseId: 'ohp', sets: 5, reps: 5, progresses: true },
      { slotId: 'deadlift', exerciseId: 'deadlift', sets: 1, reps: 5, progresses: true },
      { slotId: 'pullup', exerciseId: 'pullup', sets: 3, reps: 8, progresses: false },
    ],
  },
  {
    dayKey: 'friday',
    title: 'Friday',
    slots: [
      { slotId: 'squat', exerciseId: 'squat', sets: 5, reps: 5, progresses: true },
      { slotId: 'bench', exerciseId: 'bench', sets: 5, reps: 5, progresses: true },
      { slotId: 'rdl', exerciseId: 'rdl', sets: 3, reps: 8, progresses: true },
      { slotId: 'dips', exerciseId: 'dips', sets: 3, reps: 8, progresses: false },
    ],
  },
]

export const DAY_ORDER: DayKey[] = ['monday', 'wednesday', 'friday']

export function getDay(dayKey: DayKey): ProgramDay {
  const day = PROGRAM.find((d) => d.dayKey === dayKey)
  if (!day) throw new Error(`Unknown program day: ${dayKey}`)
  return day
}
