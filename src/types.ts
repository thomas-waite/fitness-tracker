export type DayKey = 'monday' | 'wednesday' | 'friday'

export type ExerciseKind = 'weight' | 'bodyweight' | 'timed'

export interface ExerciseDef {
  id: string
  name: string
  kind: ExerciseKind
  /** Starting working weight in kg (weight exercises only). */
  startWeight?: number
  /** Weight added after a successful workout, in kg. */
  increment?: number
  /** Above this weight the increment drops to 2.5 kg ("until heavy"). */
  heavyThreshold?: number
}

/** One exercise as prescribed on a given day. */
export interface WorkoutSlot {
  /** Unique within the day, e.g. "squat-light". */
  slotId: string
  exerciseId: string
  /** Display name override, e.g. "Back Squat (light)". */
  label?: string
  sets: number
  /** Target reps per set; for timed exercises this is seconds. */
  reps: number
  /** Multiplier applied to the exercise's working weight (light variants). */
  weightFactor?: number
  /** When false, completing this slot never changes the working weight. */
  progresses: boolean
}

export interface ProgramDay {
  dayKey: DayKey
  title: string
  slots: WorkoutSlot[]
}

export interface ExerciseProgress {
  weight: number
  /** Consecutive workouts failed at the current weight. */
  failStreak: number
}

export interface SetEntry {
  weight: number
  reps: number
  done: boolean
}

export interface ActiveWorkout {
  dayKey: DayKey
  startedAt: number
  currentSlot: number
  entries: { slotId: string; sets: SetEntry[] }[]
}

export interface LoggedSet {
  weight: number
  reps: number
}

export interface LoggedEntry {
  slotId: string
  exerciseId: string
  name: string
  kind: ExerciseKind
  targetSets: number
  targetReps: number
  sets: LoggedSet[]
}

export interface WorkoutLog {
  id: string
  /** Program day this workout followed, or 'custom' for ad-hoc workouts. */
  dayKey: DayKey | 'custom'
  /** ISO date-time when the workout finished. */
  finishedAt: string
  durationSec: number
  entries: LoggedEntry[]
}

export interface AppState {
  progression: Record<string, ExerciseProgress>
  logs: WorkoutLog[]
  bodyweightKg: number | null
  activeWorkout: ActiveWorkout | null
}
