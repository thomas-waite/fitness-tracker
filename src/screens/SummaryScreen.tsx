import type { ProgressionChange } from '../logic/progression'
import { nextDayKey, nextWorkoutDate } from '../logic/schedule'
import { getDay } from '../data/program'
import type { WorkoutLog } from '../types'

export interface WorkoutSummary {
  log: WorkoutLog
  changes: ProgressionChange[]
  improvements: { name: string; from: number; to: number }[]
  prs: string[]
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} min ${s} sec` : `${s} sec`
}

export default function SummaryScreen({
  summary,
  logs,
  onDone,
}: {
  summary: WorkoutSummary
  logs: WorkoutLog[]
  onDone: () => void
}) {
  const { log, changes, improvements, prs } = summary
  const nextKey = nextDayKey(logs)
  const nextDate = nextWorkoutDate(logs)

  return (
    <div className="screen summary">
      <h1 className="day-title">Workout Complete 🎉</h1>

      <div className="stat-tiles">
        <div className="tile">
          <span className="tile-label">Duration</span>
          <span className="tile-value">{formatDuration(log.durationSec)}</span>
        </div>
        <div className="tile">
          <span className="tile-label">Next workout</span>
          <span className="tile-value">
            {getDay(nextKey).title},{' '}
            {nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {improvements.length > 0 && (
        <section className="summary-section">
          <h2>Estimated 1RM improvements</h2>
          <ul className="plain-list">
            {improvements.map((imp) => (
              <li key={imp.name}>
                {imp.name}: {imp.from.toFixed(1)} → <strong>{imp.to.toFixed(1)} kg</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {prs.length > 0 && (
        <section className="summary-section">
          <h2>New PRs 🏆</h2>
          <ul className="plain-list">
            {prs.map((pr) => (
              <li key={pr}>{pr}</li>
            ))}
          </ul>
        </section>
      )}

      {changes.length > 0 && (
        <section className="summary-section">
          <h2>Next time</h2>
          <ul className="plain-list">
            {changes.map((c) => (
              <li key={c.exerciseId}>
                {c.name}:{' '}
                {c.kind === 'increase' && (
                  <strong className="up">
                    {c.from} → {c.to} kg
                  </strong>
                )}
                {c.kind === 'repeat' && <span>repeat {c.to} kg</span>}
                {c.kind === 'deload' && (
                  <span className="down">
                    deload {c.from} → {c.to} kg
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="btn-primary" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
