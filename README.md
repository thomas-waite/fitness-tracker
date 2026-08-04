# Strength Tracker

A minimalist mobile-first strength training app that acts like a personal coach.
You never decide what workout to do — opening the app shows today's workout with
every exercise, target weight, sets, and reps. Logging a workout feels like
checking items off a to-do list.

## Features

- **Built-in Mon/Wed/Fri program** (5×5-style: squat, bench, row, OHP, deadlift,
  RDL, plus plank, pull-ups, and dips). The app automatically knows which
  workout is due next.
- **Guided workout flow** — one exercise at a time, each set as a large card
  with weight/rep steppers (no typing). Ticking a set activates the next one;
  finishing an exercise auto-advances to the next.
- **Automatic progression** — complete every prescribed rep and the next
  workout's weight goes up (+2.5 kg for most lifts, +5 kg for deadlift until
  heavy). Miss reps and the weight repeats; fail three workouts in a row at the
  same weight and it deloads 10%.
- **Workout summary** — duration, estimated 1RM improvements, new PRs, and the
  next workout date.
- **Dashboard** — estimated 1RMs (Epley), bodyweight, last workout, total
  workouts, current streak, weekly volume.
- **History** — reopen any past workout to see weights, reps, and estimated
  1RMs.
- **Personal records** — heaviest lifts, best estimated 1RMs, best session
  volume, longest streak, largest weight increase.

All data is stored locally in the browser (localStorage) — no account, no
network.

## Development

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests (progression, scheduling, stats)
npm run build    # type-check and build for production
```

Built with React, TypeScript, and Vite. The core logic lives in `src/logic/`
(progression rules, scheduling, 1RM/volume/streak stats) and is covered by
Vitest unit tests; the default program is defined in `src/data/program.ts`.
