import { EXERCISES } from '../data/program'
import {
  best1RM,
  bestSessionVolume,
  heaviestSet,
  largestWeightIncrease,
  longestStreak,
} from '../logic/stats'
import type { WorkoutLog } from '../types'

const LIFTS = ['squat', 'bench', 'deadlift', 'ohp', 'row', 'rdl']

export default function RecordsScreen({ logs }: { logs: WorkoutLog[] }) {
  const increase = largestWeightIncrease(logs)
  const volume = bestSessionVolume(logs)

  return (
    <div className="screen records">
      <h1 className="day-title">Personal Records</h1>

      <h2 className="section-title">Heaviest lift / best est. 1RM</h2>
      <ul className="plain-list pr-list">
        {LIFTS.map((id) => {
          const heavy = heaviestSet(logs, id)
          const orm = best1RM(logs, id)
          if (heavy <= 0) return null
          return (
            <li key={id} className="pr-row">
              <span>{EXERCISES[id].name}</span>
              <span>
                <strong>{heavy} lbs</strong>
                <span className="subtle"> · e1RM {orm.toFixed(1)} lbs</span>
              </span>
            </li>
          )
        })}
        {logs.length === 0 && <li className="subtle">Complete a workout to start setting PRs.</li>}
      </ul>

      <div className="stat-tiles">
        <div className="tile">
          <span className="tile-label">Best volume</span>
          <span className="tile-value">
            {volume > 0 ? `${Math.round(volume).toLocaleString()} lbs` : '—'}
          </span>
        </div>
        <div className="tile">
          <span className="tile-label">Longest streak</span>
          <span className="tile-value">{longestStreak(logs)}</span>
        </div>
        <div className="tile wide">
          <span className="tile-label">Largest weight increase</span>
          <span className="tile-value">
            {increase ? `${increase.name} +${increase.amount} lbs` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
