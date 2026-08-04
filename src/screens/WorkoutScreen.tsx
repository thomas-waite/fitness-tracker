import { EXERCISES, getDay } from '../data/program'
import type { ActiveWorkout, WorkoutLog, WorkoutSlot } from '../types'

function Stepper({
  value,
  step,
  min,
  unit,
  onChange,
}: {
  value: number
  step: number
  min: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="stepper">
      <button className="step-btn" onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <span className="step-value">
        {value}
        <span className="step-unit">{unit}</span>
      </span>
      <button className="step-btn" onClick={() => onChange(value + step)}>
        +
      </button>
    </div>
  )
}

function previousSummary(logs: WorkoutLog[], slotId: string): string | null {
  const sorted = [...logs].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  for (const log of sorted) {
    const entry = log.entries.find((e) => e.slotId === slotId)
    if (entry && entry.sets.length > 0) {
      if (entry.kind === 'weight') {
        const w = entry.sets[0].weight
        const reps = entry.sets.map((s) => s.reps).join(', ')
        return `${w} kg × ${reps}`
      }
      return entry.sets.map((s) => s.reps).join(', ') + (entry.kind === 'timed' ? ' sec' : ' reps')
    }
  }
  return null
}

export default function WorkoutScreen({
  active,
  logs,
  onChange,
  onFinish,
  onAbandon,
}: {
  active: ActiveWorkout
  logs: WorkoutLog[]
  onChange: (a: ActiveWorkout) => void
  onFinish: () => void
  onAbandon: () => void
}) {
  const day = getDay(active.dayKey)
  const slot: WorkoutSlot = day.slots[active.currentSlot]
  const def = EXERCISES[slot.exerciseId]
  const entry = active.entries[active.currentSlot]
  const slotDone = (i: number) => active.entries[i].sets.every((s) => s.done)
  const activeSetIdx = entry.sets.findIndex((s) => !s.done)
  const prev = previousSummary(logs, slot.slotId)

  const updateSet = (setIdx: number, patch: Partial<(typeof entry.sets)[number]>) => {
    const entries = active.entries.map((e, i) =>
      i === active.currentSlot
        ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
        : e,
    )
    let next: ActiveWorkout = { ...active, entries }

    const allDone = entries[active.currentSlot].sets.every((s) => s.done)
    if (allDone) {
      const nextIdx = day.slots.findIndex((_, i) => !entries[i].sets.every((s) => s.done))
      if (nextIdx === -1) {
        onChange(next)
        onFinish()
        return
      }
      next = { ...next, currentSlot: nextIdx }
    }
    onChange(next)
  }

  const skipExercise = () => {
    const nextIdx = day.slots.findIndex((_, i) => i !== active.currentSlot && !slotDone(i))
    if (nextIdx === -1) onFinish()
    else onChange({ ...active, currentSlot: nextIdx })
  }

  return (
    <div className="screen workout">
      <header className="workout-header">
        <button className="link-btn" onClick={onAbandon}>
          ✕
        </button>
        <div className="exercise-dots">
          {day.slots.map((s, i) => (
            <button
              key={s.slotId}
              className={
                'dot' +
                (slotDone(i) ? ' done' : '') +
                (i === active.currentSlot ? ' current' : '')
              }
              onClick={() => onChange({ ...active, currentSlot: i })}
            >
              {slotDone(i) ? '✅' : '⬜'}
              <span className="dot-label">{(s.label ?? EXERCISES[s.exerciseId].name).split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </header>

      <h1 className="exercise-title">{slot.label ?? def.name}</h1>
      <div className="target-row">
        <div className="target-cell">
          <span className="big-num">{slot.sets}</span>
          <span className="subtle">sets</span>
        </div>
        <div className="target-cell">
          <span className="big-num">{slot.reps}</span>
          <span className="subtle">{def.kind === 'timed' ? 'seconds' : 'reps'}</span>
        </div>
        {def.kind === 'weight' && (
          <div className="target-cell">
            <span className="big-num">{entry.sets[0]?.weight}</span>
            <span className="subtle">kg suggested</span>
          </div>
        )}
      </div>
      {prev && <p className="subtle previous">Previous: {prev}</p>}

      <div className="set-list">
        {entry.sets.map((set, i) => (
          <div
            key={i}
            className={
              'set-card' + (set.done ? ' completed' : '') + (i === activeSetIdx ? ' active' : '')
            }
          >
            <span className="set-label">Set {i + 1}</span>
            {def.kind === 'weight' && (
              <div className="set-field">
                <span className="field-label">Weight</span>
                <Stepper
                  value={set.weight}
                  step={2.5}
                  min={0}
                  unit="kg"
                  onChange={(v) => updateSet(i, { weight: v })}
                />
              </div>
            )}
            <div className="set-field">
              <span className="field-label">{def.kind === 'timed' ? 'Seconds' : 'Reps'}</span>
              <Stepper
                value={set.reps}
                step={def.kind === 'timed' ? 5 : 1}
                min={0}
                unit=""
                onChange={(v) => updateSet(i, { reps: v })}
              />
            </div>
            <button
              className={'check-btn' + (set.done ? ' checked' : '')}
              onClick={() => updateSet(i, { done: !set.done })}
            >
              {set.done ? '✓ Completed' : 'Complete set'}
            </button>
          </div>
        ))}
      </div>

      <button className="link-btn skip" onClick={skipExercise}>
        Skip remaining sets →
      </button>
    </div>
  )
}
