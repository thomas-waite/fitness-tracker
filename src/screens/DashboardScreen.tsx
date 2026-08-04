import { currentStreak, latest1RM, weeklyVolume } from '../logic/stats'
import type { AppState } from '../types'

const MAIN_LIFTS = [
  { id: 'bench', name: 'Bench' },
  { id: 'squat', name: 'Squat' },
  { id: 'deadlift', name: 'Deadlift' },
]

export default function DashboardScreen({
  state,
  onBodyweight,
}: {
  state: AppState
  onBodyweight: (kg: number | null) => void
}) {
  const { logs } = state
  const lastLog = [...logs].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0]

  const editBodyweight = () => {
    const raw = window.prompt('Bodyweight (kg)', state.bodyweightKg?.toString() ?? '')
    if (raw === null) return
    const kg = parseFloat(raw)
    onBodyweight(Number.isFinite(kg) && kg > 0 ? kg : null)
  }

  return (
    <div className="screen dashboard">
      <h1 className="day-title">Stats</h1>

      <h2 className="section-title">Estimated 1RM</h2>
      <div className="stat-tiles">
        {MAIN_LIFTS.map((lift) => {
          const v = latest1RM(logs, lift.id)
          return (
            <div className="tile" key={lift.id}>
              <span className="tile-label">{lift.name}</span>
              <span className="tile-value">{v > 0 ? `${v.toFixed(1)} kg` : '—'}</span>
            </div>
          )
        })}
      </div>

      <div className="stat-tiles">
        <button className="tile tappable" onClick={editBodyweight}>
          <span className="tile-label">Bodyweight</span>
          <span className="tile-value">
            {state.bodyweightKg ? `${state.bodyweightKg} kg` : 'Tap to set'}
          </span>
        </button>
        <div className="tile">
          <span className="tile-label">Last workout</span>
          <span className="tile-value">
            {lastLog
              ? new Date(lastLog.finishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </span>
        </div>
        <div className="tile">
          <span className="tile-label">Total workouts</span>
          <span className="tile-value">{logs.length}</span>
        </div>
        <div className="tile">
          <span className="tile-label">Current streak</span>
          <span className="tile-value">{currentStreak(logs)}</span>
        </div>
        <div className="tile wide">
          <span className="tile-label">Weekly volume</span>
          <span className="tile-value">{Math.round(weeklyVolume(logs)).toLocaleString()} kg</span>
        </div>
      </div>
    </div>
  )
}
