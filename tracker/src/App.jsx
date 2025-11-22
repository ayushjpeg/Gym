import { useEffect, useMemo, useState } from 'react'
import DayPicker from './components/DayPicker'
import ExerciseCard from './components/ExerciseCard'
import CardioTracker from './components/CardioTracker'
import WeekSummary from './components/WeekSummary'
import AICoachPanel from './components/AICoachPanel'
import CustomExerciseForm from './components/CustomExerciseForm'
import {
  WEEK_TEMPLATE,
  EXERCISES,
  JEFF_SET_TARGETS,
  DEFAULT_NOTES,
} from './data/programData'
import { buildMuscleSummary, generateWeeklyPlan, getIsoWeekKey } from './utils/schedule'
import { usePersistentState } from './hooks/usePersistentState'
import './App.css'

const dayKeys = Object.keys(WEEK_TEMPLATE)

const getDefaultDayKey = () => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const entry = dayKeys.find((key) => WEEK_TEMPLATE[key].label.toLowerCase() === today)
  return entry || 'sunday'
}

const buildInitialLogs = () => {
  const base = {}
  Object.values(EXERCISES).forEach((exercise) => {
    base[exercise.id] = {
      lastSession: exercise.lastSession || [],
      history: exercise.lastSession?.length
        ? [
            {
              date: exercise.lastPerformedOn || '2025-11-16',
              sets: exercise.lastSession,
            },
          ]
        : [],
    }
  })
  return base
}

function App() {
  const [selectedDay, setSelectedDay] = useState(getDefaultDayKey)
  const [manualSeed, setManualSeed] = useState('')
  const weekKey = getIsoWeekKey()

  const [customExercises, setCustomExercises] = usePersistentState('gym-custom', {})
  const [plan, setPlan] = usePersistentState('gym-plan', () =>
    generateWeeklyPlan({ weekKey, customExercises }),
  )
  const [notes, setNotes] = usePersistentState('gym-notes', DEFAULT_NOTES)
  const [logs, setLogs] = usePersistentState('gym-logs', buildInitialLogs)
  const [cardioLogs, setCardioLogs] = usePersistentState('gym-cardio', {
    monday: [],
    wednesday: [],
  })

  useEffect(() => {
    if (!plan || plan.weekKey !== weekKey) {
      setPlan(generateWeeklyPlan({ weekKey, customExercises, seedSuffix: manualSeed }))
    }
  }, [weekKey, customExercises, manualSeed, plan, setPlan])

  const weeklyMuscleTotals = useMemo(() => buildMuscleSummary(), [])
  const selectedPlan = plan?.days?.[selectedDay] || []
  const selectedConfig = WEEK_TEMPLATE[selectedDay]

  const handleNoteChange = (exerciseId, value) => {
    setNotes((prev) => ({
      ...prev,
      [exerciseId]: value,
    }))
  }

  const handleSaveLog = (exerciseId, sets) => {
    setLogs((prev) => {
      const formatted = sets.map((set, index) => ({
        set: index + 1,
        weight: isNaN(Number(set.weight)) ? set.weight : Number(set.weight),
        reps: Number(set.reps),
      }))
      const entry = {
        date: new Date().toISOString().slice(0, 10),
        sets: formatted,
      }
      return {
        ...prev,
        [exerciseId]: {
          lastSession: formatted,
          history: [...(prev[exerciseId]?.history || []), entry],
        },
      }
    })
  }

  const handleAddRun = (dayKey, run) => {
    setCardioLogs((prev) => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), run],
    }))
  }

  const handleAddCustomExercise = (dayKey, exercise) => {
    setCustomExercises((prev) => {
      const updated = {
        ...prev,
        [dayKey]: [...(prev[dayKey] || []), exercise],
      }
      setPlan(generateWeeklyPlan({ weekKey, customExercises: updated, seedSuffix: manualSeed }))
      return updated
    })
  }

  const handleShufflePlan = () => {
    const seed = Date.now().toString()
    setManualSeed(seed)
    setPlan(generateWeeklyPlan({ weekKey, customExercises, seedSuffix: seed }))
  }

  const isCardioDay = Boolean(selectedConfig.cardio)
  const isRestDay = !selectedConfig.cardio && !selectedConfig.exerciseOrder

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p>Week {weekKey}</p>
          <h1>{selectedConfig.label} · {selectedConfig.theme}</h1>
          <p>{selectedConfig.description}</p>
        </div>
        <div className="hero__meta">
          {selectedConfig.muscles ? (
            <div>
              <span>Muscles / sets today</span>
              <div className="muscle-tags">
                {Object.entries(selectedConfig.muscles).map(([muscle, sets]) => (
                  <span key={muscle}>{muscle}: {sets}</span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <span>Focus</span>
              <p>{selectedConfig.focus || 'Recovery & mobility'}</p>
            </div>
          )}
          <button type="button" onClick={handleShufflePlan}>
            Reshuffle week
          </button>
        </div>
      </header>

      <DayPicker template={WEEK_TEMPLATE} selectedDay={selectedDay} onSelect={setSelectedDay} />

      <main className="layout">
        <section className="main-column">
          {isCardioDay ? (
            <CardioTracker
              dayKey={selectedDay}
              plan={selectedConfig}
              entries={cardioLogs[selectedDay] || []}
              onAddRun={handleAddRun}
            />
          ) : isRestDay ? (
            <div className="rest-card">
              <h2>Rest & Recovery</h2>
              <p>{selectedConfig.description}</p>
              <ul>
                <li>Log sleep quality and stress in your notes.</li>
                <li>Perform light mobility or a long walk (30+ min).</li>
                <li>Prep meals / hydration for the next session.</li>
              </ul>
            </div>
          ) : (
            <>
              <div className="exercise-grid">
                {selectedPlan.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id || exercise.exerciseId}
                    exercise={exercise}
                    note={notes[exercise.id || exercise.exerciseId]}
                    onNoteChange={handleNoteChange}
                    log={logs[exercise.id || exercise.exerciseId]}
                    onSaveLog={handleSaveLog}
                  />
                ))}
              </div>
              <CustomExerciseForm dayKey={selectedDay} onAdd={handleAddCustomExercise} />
            </>
          )}
        </section>

        <aside className="side-column">
          <WeekSummary
            template={WEEK_TEMPLATE}
            totals={weeklyMuscleTotals}
            targets={JEFF_SET_TARGETS}
            cardioLogs={cardioLogs}
          />
          <AICoachPanel selectedDay={selectedConfig.label} logs={logs} onShufflePlan={handleShufflePlan} />
        </aside>
      </main>
    </div>
  )
}

export default App
