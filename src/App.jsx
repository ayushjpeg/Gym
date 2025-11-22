import { useEffect, useMemo, useRef, useState } from 'react'
import DayPicker from './components/DayPicker'
import ExerciseCard from './components/ExerciseCard'
import CardioTracker from './components/CardioTracker'
import WeekSummary from './components/WeekSummary'
import ExerciseLibrary from './components/ExerciseLibrary'
import {
  WEEK_TEMPLATE,
  DEFAULT_EXERCISES,
  DEFAULT_NOTES,
  DEFAULT_MUSCLE_TARGETS,
  MUSCLE_GROUPS,
  JEFF_SET_TARGETS,
} from './data/programData'
import { buildMuscleSummary, getIsoWeekKey, resolveExercise, isEntryInWeek } from './utils/schedule'
import { usePersistentState } from './hooks/usePersistentState'
import './App.css'

const dayKeys = Object.keys(WEEK_TEMPLATE)

const getDefaultDayKey = () => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const entry = dayKeys.find((key) => WEEK_TEMPLATE[key].label.toLowerCase() === today)
  return entry || 'sunday'
}

const createEntryId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const parseTargetRange = (value) => {
  if (!value) return { low: 0, high: 0 }
  if (typeof value === 'object') {
    return {
      low: Number(value.low ?? 0),
      high: Number(value.high ?? 0),
    }
  }
  const match = String(value).match(/(\d+)\D+(\d+)/)
  if (!match) {
    const numeric = Number(value) || 0
    return { low: numeric, high: numeric }
  }
  return {
    low: Number(match[1]),
    high: Number(match[2]),
  }
}

const cloneTargetMap = (input = {}) => (
  Object.fromEntries(
    Object.entries(input).map(([muscle, range]) => [muscle, parseTargetRange(range)]),
  )
)

const buildInitialTargets = () => {
  const hasDefaults = DEFAULT_MUSCLE_TARGETS && Object.keys(DEFAULT_MUSCLE_TARGETS).length > 0
  if (hasDefaults) {
    return cloneTargetMap(DEFAULT_MUSCLE_TARGETS)
  }
  return cloneTargetMap(JEFF_SET_TARGETS)
}

const buildWeekOverview = (weekKey, logsState, cardioState, exerciseLibrary = DEFAULT_EXERCISES) => {
  const dayBuckets = {}
  Object.entries(logsState || {}).forEach(([exerciseId, payload]) => {
    const history = payload?.history || []
    history.forEach((entry) => {
      if (!entry.dayKey || !entry.slotId || !entry.date) return
      if (!isEntryInWeek(entry.date, weekKey)) return
      const dayBucket = dayBuckets[entry.dayKey] || {}
      const existing = dayBucket[entry.slotId]
      if (!existing || new Date(entry.date) > new Date(existing.date)) {
        dayBuckets[entry.dayKey] = {
          ...dayBucket,
          [entry.slotId]: {
            ...entry,
            exerciseId,
          },
        }
      }
    })
  })

  const overview = {
    byDay: {},
    strengthDaysTotal: 0,
    strengthDaysDone: 0,
    cardioRunsLogged: 0,
    cardioRunsTarget: 0,
  }

  Object.entries(WEEK_TEMPLATE).forEach(([dayKey, config]) => {
    if (config.cardio) {
      const runs = (cardioState?.[dayKey] || []).filter((run) => isEntryInWeek(run.date, weekKey))
      const targetRuns = config.cardioPlan?.targetRuns || 0
      overview.cardioRunsLogged += runs.length
      overview.cardioRunsTarget += targetRuns
      overview.byDay[dayKey] = {
        type: 'cardio',
        label: config.label,
        theme: config.theme,
        description: config.description,
        runsLogged: runs.length,
        targetRuns,
        entries: runs.slice(-3).reverse(),
        status:
          runs.length === 0
            ? 'pending'
            : targetRuns && runs.length >= targetRuns
              ? 'complete'
              : 'in-progress',
        lastLoggedOn: runs.length ? runs[runs.length - 1].date : null,
      }
      return
    }

    if (config.exerciseOrder?.length) {
      overview.strengthDaysTotal += 1
      const slots = config.exerciseOrder
      const entries = dayBuckets[dayKey] || {}
      const completedSlots = Object.keys(entries).length
      if (completedSlots >= slots.length) {
        overview.strengthDaysDone += 1
      }
  const completedNames = Object.values(entries).map((entry) => exerciseLibrary[entry.exerciseId]?.name || entry.exerciseId)
      const remainingNames = slots
        .filter((slot) => !entries[slot.slotId])
        .map((slot) => slot.name)
      overview.byDay[dayKey] = {
        type: 'strength',
        label: config.label,
        theme: config.theme,
        description: config.description,
        totalSlots: slots.length,
        completedSlots,
        completionPct: slots.length ? Math.round((completedSlots / slots.length) * 100) : 0,
        completedNames,
        remainingNames,
        status:
          completedSlots === 0
            ? 'pending'
            : completedSlots >= slots.length
              ? 'complete'
              : 'in-progress',
        lastLoggedOn: Object.values(entries).reduce((latest, entry) => (
          entry.date && (!latest || entry.date > latest) ? entry.date : latest
        ), null),
      }
      return
    }

    overview.byDay[dayKey] = {
      type: 'rest',
      label: config.label,
      theme: config.theme,
      description: config.description,
      status: 'pending',
    }
  })

  return overview
}

const buildInitialLogs = (exerciseLibrary = DEFAULT_EXERCISES) => {
  const base = {}
  Object.values(exerciseLibrary).forEach((exercise) => {
    base[exercise.id] = {
      lastSession: exercise.lastSession || [],
      history: exercise.lastSession?.length
        ? [
            {
              id: createEntryId(),
              date: exercise.lastPerformedOn || '2025-11-16',
              sets: exercise.lastSession,
              dayKey: null,
              slotId: null,
            },
          ]
        : [],
    }
  })
  return base
}

const buildSubstitutePool = (exercise, exerciseLibrary = DEFAULT_EXERCISES) => {
  if (!exercise) return []
  const exerciseKey = exercise.exerciseId || exercise.id
  const targetPrimary = exercise.primaryMuscle
  const targetSecondary = exercise.secondaryMuscle
  const matches = Object.values(exerciseLibrary)
    .filter((candidate) => {
      if (!candidate) return false
      if (candidate.id === exerciseKey) return true
      const primaryMatch = targetPrimary
        ? candidate.primaryMuscle === targetPrimary || candidate.secondaryMuscle === targetPrimary
        : false
      const secondaryMatch = targetSecondary
        ? candidate.primaryMuscle === targetSecondary || candidate.secondaryMuscle === targetSecondary
        : false
      return primaryMatch || secondaryMatch
    })
    .map((candidate) => {
      let score = 3
      if (candidate.id === exerciseKey) score = 0
      else if (candidate.primaryMuscle === targetPrimary) score = 1
      else if (candidate.secondaryMuscle === targetPrimary) score = 1.5
      else if (candidate.primaryMuscle === targetSecondary || candidate.secondaryMuscle === targetSecondary) score = 2
      return { candidate, score }
    })
    .sort((a, b) => a.score - b.score)

  const unique = []
  matches.forEach(({ candidate }) => {
    if (!unique.find((item) => item.id === candidate.id)) {
      unique.push(candidate)
    }
  })
  return unique
}

const normalizeExercisePayload = (exercise, librarySnapshot = {}) => {
  const baseId = exercise.id || exercise.exerciseId || createEntryId()
  const prior = librarySnapshot[baseId] || {}
  const primaryMuscle = exercise.primaryMuscle || prior.primaryMuscle || MUSCLE_GROUPS[0]
  const secondaryMuscle = exercise.secondaryMuscle || prior.secondaryMuscle || ''
  const equipment = exercise.equipment ?? prior.equipment ?? ''
  return {
    ...prior,
    ...exercise,
    id: baseId,
    exerciseId: baseId,
    equipment,
    primaryMuscle,
    secondaryMuscle,
    muscleGroups: [primaryMuscle, secondaryMuscle].filter(Boolean),
    lastSession: exercise.lastSession || prior.lastSession || [],
  }
}

function App() {
  const [selectedDay, setSelectedDay] = useState(getDefaultDayKey)
  const weekKey = getIsoWeekKey()
  const [viewMode, setViewMode] = useState('plan')
  const [exerciseLibrary, setExerciseLibrary] = usePersistentState('gym-exercises', DEFAULT_EXERCISES)
  const [muscleTargets, setMuscleTargets] = usePersistentState('gym-targets', buildInitialTargets)

  const [swapSelections, setSwapSelections] = usePersistentState('gym-swaps', {})
  const [expandedCards, setExpandedCards] = useState({})
  const [notes, setNotes] = usePersistentState('gym-notes', DEFAULT_NOTES)
  const [logs, setLogs] = usePersistentState('gym-logs', () => buildInitialLogs(DEFAULT_EXERCISES))
  const [cardioLogs, setCardioLogs] = usePersistentState('gym-cardio', {
    monday: [],
    wednesday: [],
  })
  const [showSummary, setShowSummary] = useState(false)
  const exerciseRefs = useRef({})
  const weekOverview = useMemo(
    () => buildWeekOverview(weekKey, logs, cardioLogs, exerciseLibrary),
    [cardioLogs, exerciseLibrary, logs, weekKey],
  )

  useEffect(() => {
    setLogs((prev) => {
      let changed = false
      const next = { ...prev }
      Object.entries(exerciseLibrary).forEach(([exerciseId, exercise]) => {
        if (!next[exerciseId]) {
          changed = true
          next[exerciseId] = {
            lastSession: exercise.lastSession || [],
            history: [],
          }
        }
      })
      Object.keys(next).forEach((exerciseId) => {
        if (!exerciseLibrary[exerciseId]) {
          changed = true
          delete next[exerciseId]
        }
      })
      return changed ? next : prev
    })
  }, [exerciseLibrary, setLogs])

  useEffect(() => {
    setMuscleTargets((prev) => {
      if (!prev) return buildInitialTargets()
      const needsUpgrade = Object.values(prev).some((range) => (
        !range
        || typeof range === 'string'
        || typeof range.low === 'undefined'
        || typeof range.high === 'undefined'
      ))
      return needsUpgrade ? cloneTargetMap(prev) : prev
    })
  }, [setMuscleTargets])

  const selectedConfig = WEEK_TEMPLATE[selectedDay]
  const resolvedPlan = (selectedConfig.exerciseOrder || [])
    .map((slot) => {
      const picked = swapSelections?.[selectedDay]?.[slot.slotId]
      const candidateIds = [picked, slot.defaultExercise, ...(slot.options || [])].filter(Boolean)
      if (!candidateIds.length) return null
      const libraryMatchId = candidateIds.find((id) => exerciseLibrary[id])
      const fallbackId = candidateIds.find((id) => DEFAULT_EXERCISES[id])
      const activeId = libraryMatchId || fallbackId || candidateIds[0]
      const resolvedExercise = libraryMatchId ? resolveExercise(libraryMatchId, exerciseLibrary) : null
      const referenceExercise = resolveExercise(activeId, exerciseLibrary) || resolveExercise(activeId, DEFAULT_EXERCISES)
      if (!referenceExercise) return null
      const substitutionPool = buildSubstitutePool(referenceExercise, exerciseLibrary)
      const payload = resolvedExercise
        ? resolvedExercise
        : {
            ...referenceExercise,
            id: `missing-${slot.slotId}`,
            exerciseId: referenceExercise.exerciseId || referenceExercise.id || slot.slotId,
            lastSession: [],
            equipment: 'Add or swap this slot in the Exercise Library',
            isPlaceholder: true,
          }
      return {
        ...payload,
        slotId: slot.slotId,
        slotMeta: {
          ...slot,
          substitutionPool,
          isPlaceholder: payload.isPlaceholder,
        },
      }
    })
    .filter(Boolean)
  const weeklyTotals = useMemo(
    () => buildMuscleSummary(logs, exerciseLibrary, weekKey),
    [exerciseLibrary, logs, weekKey],
  )

  const handleNoteChange = (exerciseId, value) => {
    setNotes((prev) => ({
      ...prev,
      [exerciseId]: value,
    }))
  }

  const handleSaveLog = (exerciseId, sets, meta = {}) => {
    setLogs((prev) => {
      const formatted = sets.map((set, index) => ({
        set: index + 1,
        weight: isNaN(Number(set.weight)) ? set.weight : Number(set.weight),
        reps: Number(set.reps),
      }))
      const entry = {
        id: createEntryId(),
        date: new Date().toISOString().slice(0, 10),
        sets: formatted,
        dayKey: meta.dayKey || null,
        slotId: meta.slotId || null,
      }
      const existingHistory = prev[exerciseId]?.history || []
      const existingIndex = existingHistory.findIndex((item) => item.date === entry.date)
      let nextHistory
      if (existingIndex >= 0) {
        nextHistory = existingHistory.map((item, idx) => (idx === existingIndex ? entry : item))
      } else {
        nextHistory = [...existingHistory, entry]
      }
      return {
        ...prev,
        [exerciseId]: {
          lastSession: formatted,
          history: nextHistory,
        },
      }
    })

    const { dayKey: entryDayKey, slotId, nextSlotId } = meta
    if (entryDayKey && slotId) {
      setExpandedCards((prev) => ({
        ...prev,
        [entryDayKey]: {
          ...(prev[entryDayKey] || {}),
          [slotId]: false,
        },
      }))
    }

    if (nextSlotId) {
      const target = exerciseRefs.current[nextSlotId]
      if (target) {
        const scroll = () => target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(scroll)
        } else {
          scroll()
        }
      }
    }
  }

  const handleClearHistory = (exerciseId) => {
    setLogs((prev) => ({
      ...prev,
      [exerciseId]: {
        lastSession: [],
        history: [],
      },
    }))
  }

  const handleDeleteHistoryEntry = (exerciseId, entryId, fallbackIndex) => {
    setLogs((prev) => {
      const history = prev[exerciseId]?.history || []
      if (!history.length) return prev
      let nextHistory = history
      if (entryId) {
        nextHistory = history.filter((item) => item.id !== entryId)
      }
      if (nextHistory.length === history.length && typeof fallbackIndex === 'number') {
        nextHistory = history.filter((_, idx) => idx !== fallbackIndex)
      }
      if (nextHistory.length === history.length) return prev
      return {
        ...prev,
        [exerciseId]: {
          lastSession: nextHistory.length ? nextHistory[nextHistory.length - 1].sets : [],
          history: nextHistory,
        },
      }
    })
  }
  const registerExerciseRef = (slotId) => (node) => {
    if (node) {
      exerciseRefs.current[slotId] = node
    } else {
      delete exerciseRefs.current[slotId]
    }
  }


  const handleAddRun = (dayKey, run) => {
    setCardioLogs((prev) => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), run],
    }))
  }

  const handleSubstitute = (dayKey, slotId) => {
    const activeExercise = resolvedPlan.find((entry) => entry.slotId === slotId)
    if (!activeExercise) return
    const pool = activeExercise.slotMeta?.substitutionPool || buildSubstitutePool(activeExercise, exerciseLibrary)
    if (pool.length <= 1) return
    const poolIds = pool.map((item) => item.id)
    const currentSelection = swapSelections?.[dayKey]?.[slotId] || activeExercise.exerciseId || activeExercise.id
    const currentIndex = Math.max(0, poolIds.indexOf(currentSelection))
    const nextExerciseId = poolIds[(currentIndex + 1) % poolIds.length]
    setSwapSelections((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || {}),
        [slotId]: nextExerciseId,
      },
    }))
  }

  const handleSaveExercise = (exercise) => {
    setExerciseLibrary((prev) => {
      const normalized = normalizeExercisePayload(exercise, prev)
      return {
        ...prev,
        [normalized.id]: normalized,
      }
    })
  }

  const handleDeleteExercise = (exerciseId) => {
    if (!exerciseId) return
    setExerciseLibrary((prev) => {
      if (!prev?.[exerciseId]) return prev
      const next = { ...prev }
      delete next[exerciseId]
      return next
    })
    setSwapSelections((prev) => {
      const next = Object.entries(prev || {}).reduce((acc, [dayKey, slots]) => {
        const filtered = Object.entries(slots || {}).reduce((slotAcc, [slotId, choice]) => (
          choice === exerciseId ? slotAcc : { ...slotAcc, [slotId]: choice }
        ), {})
        if (Object.keys(filtered).length) {
          acc[dayKey] = filtered
        }
        return acc
      }, {})
      return next
    })
    setNotes((prev) => {
      if (!prev?.[exerciseId]) return prev
      const { [exerciseId]: _removed, ...rest } = prev
      return rest
    })
    setLogs((prev) => {
      if (!prev?.[exerciseId]) return prev
      const next = { ...prev }
      delete next[exerciseId]
      return next
    })
  }

  const handleTargetsChange = (nextTargets) => {
    setMuscleTargets(cloneTargetMap(nextTargets))
  }

  const handleToggleCard = (dayKey, slotId) => {
    setExpandedCards((prev) => {
      const dayState = prev[dayKey] || {}
      return {
        ...prev,
        [dayKey]: {
          ...dayState,
          [slotId]: !dayState[slotId],
        },
      }
    })
  }

  const isCardioDay = Boolean(selectedConfig.cardio)
  const isRestDay = !selectedConfig.cardio && !selectedConfig.exerciseOrder

  if (viewMode === 'library') {
    return (
      <div className="app-shell">
        <ExerciseLibrary
          exercises={exerciseLibrary}
          onSaveExercise={handleSaveExercise}
          onDeleteExercise={handleDeleteExercise}
          onBack={() => setViewMode('plan')}
          muscleTargets={muscleTargets}
          onTargetsChange={handleTargetsChange}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="day-hero">
        <div>
          <p className="week-label">Week {weekKey}</p>
          <h1>{selectedConfig.label} · {selectedConfig.theme}</h1>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="hero-button ghost"
            onClick={() => setShowSummary(true)}
          >
            Week progress
          </button>
          <button
            type="button"
            className="hero-button"
            onClick={() => setViewMode('library')}
          >
            Manage exercises
          </button>
        </div>
      </header>

      <DayPicker template={WEEK_TEMPLATE} selectedDay={selectedDay} onSelect={setSelectedDay} />

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
        </div>
      ) : (
        <section className="exercise-list">
          {resolvedPlan.map((exercise, index) => {
            const storageKey = exercise.id || exercise.exerciseId
            const isOpen = Boolean(expandedCards[selectedDay]?.[exercise.slotId])
            const orderLabel = (index + 1).toString().padStart(2, '0')
            const nextSlotId = resolvedPlan[index + 1]?.slotId
            return (
              <ExerciseCard
                ref={registerExerciseRef(exercise.slotId)}
                key={`${exercise.slotId}-${exercise.id}`}
                exercise={exercise}
                displayName={exercise.slotMeta?.name}
                subtitle={exercise.slotMeta?.subtitle}
                orderLabel={orderLabel}
                note={notes[storageKey]}
                onNoteChange={handleNoteChange}
                log={logs[storageKey]}
                onSaveLog={handleSaveLog}
                isOpen={isOpen}
                onToggle={() => handleToggleCard(selectedDay, exercise.slotId)}
                onSubstitute={exercise.slotMeta?.substitutionPool?.length > 1
                  ? () => handleSubstitute(selectedDay, exercise.slotId)
                  : undefined}
                canSubstitute={exercise.slotMeta?.substitutionPool?.length > 1}
                dayKey={selectedDay}
                nextSlotId={nextSlotId}
                onClearHistory={handleClearHistory}
                onDeleteHistoryEntry={handleDeleteHistoryEntry}
              />
            )
          })}
        </section>
      )}

      {showSummary ? (
        <div className="summary-overlay" role="dialog" aria-modal="true">
          <div className="summary-panel">
            <header>
              <h2>Week at a glance</h2>
              <button type="button" className="ghost" onClick={() => setShowSummary(false)}>
                Close
              </button>
            </header>
            <WeekSummary
              template={WEEK_TEMPLATE}
              totals={weeklyTotals}
              targets={muscleTargets}
              overview={weekOverview}
              weekKey={weekKey}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
