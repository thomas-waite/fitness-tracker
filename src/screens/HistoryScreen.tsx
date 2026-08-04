import { useState } from 'react'
import { estimate1RM } from '../logic/stats'
import { getDay } from '../data/program'
import type { WorkoutLog } from '../types'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  return m > 0 ? `${m} min` : `${sec} sec`
}

export default function HistoryScreen({ logs }: { logs: WorkoutLog[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const sorted = [...logs].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))

  return (
    <div className="screen history">
      <h1 className="day-title">History</h1>
      {sorted.length === 0 && <p className="subtle">No workouts yet. Go lift something.</p>}
      <ul className="plain-list history-list">
        {sorted.map((log) => {
          const open = openId === log.id
          return (
            <li key={log.id} className="history-item">
              <button className="history-row" onClick={() => setOpenId(open ? null : log.id)}>
                <span>
                  <strong>{getDay(log.dayKey).title}</strong>{' '}
                  <span className="subtle">
                    {new Date(log.finishedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                <span className="subtle">{formatDuration(log.durationSec)}</span>
              </button>
              {open && (
                <div className="history-detail">
                  {log.entries.map((entry) => {
                    const best = entry.sets.reduce(
                      (m, s) => Math.max(m, estimate1RM(s.weight, s.reps)),
                      0,
                    )
                    return (
                      <div key={entry.slotId} className="history-exercise">
                        <div className="history-exercise-name">{entry.name}</div>
                        {entry.sets.length === 0 ? (
                          <span className="subtle">skipped</span>
                        ) : (
                          <span className="subtle">
                            {entry.kind === 'weight'
                              ? entry.sets.map((s) => `${s.weight}×${s.reps}`).join('  ')
                              : entry.sets
                                  .map((s) => `${s.reps}${entry.kind === 'timed' ? 's' : ''}`)
                                  .join('  ')}
                            {entry.kind === 'weight' && best > 0 && (
                              <> · e1RM {best.toFixed(1)} kg</>
                            )}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
