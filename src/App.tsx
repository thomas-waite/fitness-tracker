import { useState } from 'react'
import { applyProgression, type ProgressionChange } from './logic/progression'
import { best1RM, best1RMInLog, heaviestSet, logVolume, bestSessionVolume } from './logic/stats'
import { buildActiveWorkout, useAppState } from './store/useAppState'
import { EXERCISES, getDay } from './data/program'
import { nextDayKey } from './logic/schedule'
import type { LoggedEntry, WorkoutLog } from './types'
import HomeScreen from './screens/HomeScreen'
import WorkoutScreen from './screens/WorkoutScreen'
import CustomWorkoutScreen from './screens/CustomWorkoutScreen'
import SummaryScreen, { type WorkoutSummary } from './screens/SummaryScreen'
import DashboardScreen from './screens/DashboardScreen'
import HistoryScreen from './screens/HistoryScreen'
import RecordsScreen from './screens/RecordsScreen'

type Tab = 'home' | 'dashboard' | 'history' | 'records'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: 'Today', icon: '🏋️' },
  { key: 'dashboard', label: 'Stats', icon: '📊' },
  { key: 'history', label: 'History', icon: '📅' },
  { key: 'records', label: 'PRs', icon: '🏆' },
]

export default function App() {
  const store = useAppState()
  const { state } = store
  const [tab, setTab] = useState<Tab>('home')
  const [summary, setSummary] = useState<WorkoutSummary | null>(null)
  const [customOpen, setCustomOpen] = useState(false)

  const startWorkout = () => {
    const dayKey = nextDayKey(state.logs)
    store.update({ activeWorkout: buildActiveWorkout(dayKey, state.progression) })
  }

  const finishWorkout = () => {
    const active = state.activeWorkout
    if (!active) return
    const day = getDay(active.dayKey)
    const entries: LoggedEntry[] = day.slots.map((slot, i) => {
      const def = EXERCISES[slot.exerciseId]
      return {
        slotId: slot.slotId,
        exerciseId: slot.exerciseId,
        name: slot.label ?? def.name,
        kind: def.kind,
        targetSets: slot.sets,
        targetReps: slot.reps,
        sets: active.entries[i].sets
          .filter((s) => s.done)
          .map((s) => ({ weight: s.weight, reps: s.reps })),
      }
    })
    const durationSec = Math.max(1, Math.round((Date.now() - active.startedAt) / 1000))
    const log: WorkoutLog = {
      id: `w-${Date.now()}`,
      dayKey: active.dayKey,
      finishedAt: new Date().toISOString(),
      durationSec,
      entries,
    }

    const { next, changes } = applyProgression(state.progression, active.dayKey, entries)
    const summaryData = buildSummary(log, changes, state.logs)
    store.addLog(log, next)
    setSummary(summaryData)
  }

  const abandonWorkout = () => {
    store.update({ activeWorkout: null })
  }

  const saveCustomWorkout = (entries: LoggedEntry[], durationMin: number) => {
    const log: WorkoutLog = {
      id: `w-${Date.now()}`,
      dayKey: 'custom',
      finishedAt: new Date().toISOString(),
      durationSec: durationMin * 60,
      entries,
    }
    const summaryData = buildSummary(log, [], state.logs)
    store.addLog(log, state.progression)
    setCustomOpen(false)
    setSummary(summaryData)
  }

  if (summary) {
    return (
      <SummaryScreen
        summary={summary}
        logs={state.logs}
        onDone={() => {
          setSummary(null)
          setTab('home')
        }}
      />
    )
  }

  if (customOpen) {
    return (
      <CustomWorkoutScreen
        state={state}
        onSave={saveCustomWorkout}
        onCancel={() => setCustomOpen(false)}
      />
    )
  }

  if (state.activeWorkout) {
    return (
      <WorkoutScreen
        active={state.activeWorkout}
        logs={state.logs}
        onChange={(active) => store.update({ activeWorkout: active })}
        onFinish={finishWorkout}
        onAbandon={abandonWorkout}
      />
    )
  }

  return (
    <div className="app">
      <main className="content">
        {tab === 'home' && (
          <HomeScreen state={state} onStart={startWorkout} onCustom={() => setCustomOpen(true)} />
        )}
        {tab === 'dashboard' && (
          <DashboardScreen
            state={state}
            onBodyweight={(lbs) => store.update({ bodyweight: lbs })}
          />
        )}
        {tab === 'history' && <HistoryScreen logs={state.logs} />}
        {tab === 'records' && <RecordsScreen logs={state.logs} />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function buildSummary(
  log: WorkoutLog,
  changes: ProgressionChange[],
  previousLogs: WorkoutLog[],
): WorkoutSummary {
  const improvements: WorkoutSummary['improvements'] = []
  const prs: string[] = []
  const seen = new Set<string>()

  for (const entry of log.entries) {
    if (entry.kind !== 'weight' || seen.has(entry.exerciseId)) continue
    seen.add(entry.exerciseId)
    const now = best1RMInLog(log, entry.exerciseId)
    if (now <= 0) continue
    const before = best1RM(previousLogs, entry.exerciseId)
    const name = EXERCISES[entry.exerciseId]?.name ?? entry.name
    if (before > 0 && now > before) {
      improvements.push({ name, from: before, to: now })
      prs.push(`${name}: new best estimated 1RM — ${now.toFixed(1)} lbs`)
    }
    const heaviestNow = entry.sets.reduce((m, s) => (s.reps >= 1 ? Math.max(m, s.weight) : m), 0)
    if (heaviestNow > 0 && heaviestNow > heaviestSet(previousLogs, entry.exerciseId)) {
      prs.push(`${name}: heaviest lift ever — ${heaviestNow} lbs`)
    }
  }

  const volume = logVolume(log)
  if (previousLogs.length > 0 && volume > bestSessionVolume(previousLogs)) {
    prs.push(`Biggest session volume ever — ${Math.round(volume)} lbs`)
  }

  return { log, changes, improvements, prs }
}
