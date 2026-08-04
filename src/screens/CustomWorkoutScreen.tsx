import { useState } from 'react'
import { EXERCISES } from '../data/program'
import Stepper from '../components/Stepper'
import type { AppState, ExerciseKind, LoggedEntry, LoggedSet } from '../types'

interface DraftEntry {
  exerciseId: string
  name: string
  kind: ExerciseKind
  sets: LoggedSet[]
}

function defaultSet(kind: ExerciseKind, weight: number): LoggedSet {
  if (kind === 'timed') return { weight: 0, reps: 60 }
  if (kind === 'bodyweight') return { weight: 0, reps: 8 }
  return { weight, reps: 5 }
}

export default function CustomWorkoutScreen({
  state,
  onSave,
  onCancel,
}: {
  state: AppState
  onSave: (entries: LoggedEntry[], durationMin: number) => void
  onCancel: () => void
}) {
  const [entries, setEntries] = useState<DraftEntry[]>([])
  const [durationMin, setDurationMin] = useState(45)

  const addExercise = (exerciseId: string) => {
    const def = EXERCISES[exerciseId]
    const weight = state.progression[exerciseId]?.weight ?? 45
    setEntries((es) => [
      ...es,
      { exerciseId, name: def.name, kind: def.kind, sets: [defaultSet(def.kind, weight)] },
    ])
  }

  const addOtherExercise = () => {
    const name = window.prompt('Exercise name')?.trim()
    if (!name) return
    const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setEntries((es) => [
      ...es,
      { exerciseId: id, name, kind: 'weight', sets: [defaultSet('weight', 45)] },
    ])
  }

  const updateEntry = (i: number, patch: Partial<DraftEntry>) => {
    setEntries((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  }

  const available = Object.values(EXERCISES).filter(
    (def) => !entries.some((e) => e.exerciseId === def.id),
  )

  const canSave = entries.length > 0 && entries.every((e) => e.sets.length > 0)

  const save = () => {
    const logged: LoggedEntry[] = entries.map((e) => ({
      slotId: e.exerciseId,
      exerciseId: e.exerciseId,
      name: e.name,
      kind: e.kind,
      targetSets: e.sets.length,
      targetReps: e.sets[0]?.reps ?? 0,
      sets: e.sets,
    }))
    onSave(logged, durationMin)
  }

  return (
    <div className="screen custom-workout">
      <header className="workout-header">
        <button className="link-btn" onClick={onCancel}>
          ✕
        </button>
        <h1 className="exercise-title custom-title">Custom Workout</h1>
      </header>

      {entries.map((entry, i) => (
        <div key={entry.exerciseId} className="set-card active custom-exercise">
          <div className="custom-exercise-head">
            <span className="set-label">{entry.name}</span>
            <button
              className="link-btn"
              onClick={() => setEntries((es) => es.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
          {entry.sets.map((set, s) => (
            <div key={s} className="set-field custom-set-row">
              <span className="field-label">Set {s + 1}</span>
              {entry.kind === 'weight' && (
                <Stepper
                  value={set.weight}
                  step={5}
                  min={0}
                  max={600}
                  unit="lbs"
                  onChange={(v) =>
                    updateEntry(i, {
                      sets: entry.sets.map((x, k) => (k === s ? { ...x, weight: v } : x)),
                    })
                  }
                />
              )}
              <Stepper
                value={set.reps}
                step={entry.kind === 'timed' ? 5 : 1}
                min={0}
                max={entry.kind === 'timed' ? 600 : 50}
                unit={entry.kind === 'timed' ? 'sec' : 'reps'}
                onChange={(v) =>
                  updateEntry(i, {
                    sets: entry.sets.map((x, k) => (k === s ? { ...x, reps: v } : x)),
                  })
                }
              />
              <button
                className="link-btn"
                onClick={() =>
                  updateEntry(i, { sets: entry.sets.filter((_, k) => k !== s) })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="check-btn"
            onClick={() =>
              updateEntry(i, {
                sets: [
                  ...entry.sets,
                  entry.sets[entry.sets.length - 1] ?? defaultSet(entry.kind, 45),
                ],
              })
            }
          >
            + Add set
          </button>
        </div>
      ))}

      <h2 className="section-title">Add exercise</h2>
      <div className="chip-row">
        {available.map((def) => (
          <button key={def.id} className="chip" onClick={() => addExercise(def.id)}>
            + {def.name}
          </button>
        ))}
        <button className="chip" onClick={addOtherExercise}>
          + Other…
        </button>
      </div>

      <div className="set-field duration-row">
        <span className="field-label">Duration (min)</span>
        <Stepper value={durationMin} step={5} min={5} max={240} unit="" onChange={setDurationMin} />
      </div>

      <button className="btn-primary" disabled={!canSave} onClick={save}>
        Save Workout
      </button>
    </div>
  )
}
