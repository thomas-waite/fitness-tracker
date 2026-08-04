import { EXERCISES, getDay } from '../data/program'
import { nextDayKey, nextWorkoutDate } from '../logic/schedule'
import type { AppState } from '../types'

export default function HomeScreen({
  state,
  onStart,
}: {
  state: AppState
  onStart: () => void
}) {
  const dayKey = nextDayKey(state.logs)
  const day = getDay(dayKey)
  const date = nextWorkoutDate(state.logs)
  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <div className="screen home">
      <p className="eyebrow">{isToday ? 'Today’s Workout' : 'Next Workout'}</p>
      <h1 className="day-title">{day.title.toUpperCase()}</h1>
      {!isToday && (
        <p className="subtle">
          Next scheduled: {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      )}

      <ul className="checklist">
        {day.slots.map((slot) => (
          <li key={slot.slotId} className="checklist-item">
            <span className="box">□</span>
            <span>{slot.label ?? EXERCISES[slot.exerciseId].name}</span>
            <span className="target subtle">
              {slot.sets} × {slot.reps}
              {EXERCISES[slot.exerciseId].kind === 'timed' ? ' sec' : ''}
            </span>
          </li>
        ))}
      </ul>

      <p className="progress-line">0 / {day.slots.length} complete</p>

      <button className="btn-primary" onClick={onStart}>
        Start Workout
      </button>
    </div>
  )
}
