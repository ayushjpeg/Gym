# Jeff Nippard 4-Day Tracker

Responsive gym companion for the Sunday/Tuesday/Thursday/Friday upper-lower split (plus Monday/Wednesday cardio and Saturday recovery). It auto-opens the right day, shows last week’s loads, suggests Jeff-style progressive targets, logs cardio metrics, and leaves room for a future AI coach integration.

## Features

- **Day-aware dashboard** – Switches automatically based on today. Lift days show exercise cards; Monday/Wednesday become a running log; Saturday surfaces recovery cues.
- **Exercise intelligence** – Each card displays previous sets, recommended progressions, cues, common mistakes, rest timers, and backup options when machines are busy.
- **Persistent notes & logs** – LocalStorage remembers technique notes plus your most recent logged sessions. Cardio logs total distance, calories, and pace.
- **Weekly shuffle** – ISO-week seed randomizes accessory order/variations so training stays fresh. Hit “Reshuffle week” to force a new combo. Add custom exercises per day whenever you find a new station you like.
- **AI coach placeholder** – Explains how to hook up OpenAI/Ollama/etc. later. The data model (notes/logs/plan) is already structured for it.

## Tech stack

- React 18 + Vite
- Vanilla CSS (dark theme, mobile-first)
- LocalStorage persistence via the `usePersistentState` hook

## Quick start

```powershell
npm install
npm run dev
```

Then open the printed URL (default `http://localhost:5173`). Production build:

```powershell
npm run build
```

## Key files

- `src/data/programData.js` – Exercise library, Jeff’s weekly template, default notes.
- `src/utils/schedule.js` – ISO week helper + deterministic weekly shuffle.
- `src/components/*` – Day picker, exercise cards, cardio tracker, AI placeholder, etc.

## Future ideas

- Wire the AI panel to an actual LLM and feed it the `logs` object for daily prescriptions.
- Attach short demo videos or GIFs for each exercise.
- Sync to a backend (Supabase/SQLite) if you want multi-device history or coach sharing.
