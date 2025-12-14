import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DayPicker from './components/DayPicker'
import ExerciseCard from './components/ExerciseCard'
import CardioTracker from './components/CardioTracker'
import WeekSummary from './components/WeekSummary'
import ExerciseLibrary from './components/ExerciseLibrary'
import DateNavigator from './components/DateNavigator'
import {
  WEEK_TEMPLATE,
  DEFAULT_EXERCISES,
  DEFAULT_NOTES,
  DEFAULT_MUSCLE_TARGETS,
  MUSCLE_GROUPS,
  JEFF_SET_TARGETS,
} from './data/programData'
import {
  buildMuscleSummary,
  getIsoWeekKey,
  resolveExercise,
  isEntryInWeek,
  getDayKeyFromDate,
  getDateForDayKey,
  shiftDateByDays,
} from './utils/schedule'
import { usePersistentState } from './hooks/usePersistentState'
import {
  createExercise,
  deleteExercise,
  deleteExerciseHistory,
  fetchGymBootstrap,
  logExerciseHistory,
  substituteAssignment,
  updateAssignment,
  updateExercise,
} from './api/gymApi'
import './App.css'

const dayKeys = Object.keys(WEEK_TEMPLATE)
const cardioDayKeys = dayKeys.filter((key) => WEEK_TEMPLATE[key].cardio)

const buildInitialCardioLogs = () => cardioDayKeys.reduce((acc, key) => ({
  ...acc,
  [key]: [],
}), {})

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

const sortEntriesByDate = (a, b) => {
  const dateA = new Date(a.date || a.recorded_at || a.metrics?.date || 0)
  const dateB = new Date(b.date || b.recorded_at || b.metrics?.date || 0)
  return dateA - dateB
}

const coerceToDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }
  if (typeof value === 'string') {
    const datePart = value.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) {
      return new Date(parsed)
    }
    return new Date()
  }
  return new Date(value || Date.now())
}

const formatDateOnly = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDateOnly = (value) => formatDateOnly(coerceToDate(value ?? new Date()))

const buildHistoryState = (historyEntries = []) => {
  const logs = {}
  const cardioLogs = buildInitialCardioLogs()

  historyEntries.forEach((entry) => {
    const recordedDate = toDateOnly(entry.recorded_at || entry.metrics?.date || new Date())
    const isCardio = Boolean(
      entry.metrics?.cardio
        || entry.metrics?.type === 'cardio'
        || entry.exercise_id?.startsWith('cardio_'),
    )

    if (isCardio) {
      const dayKey = entry.day_key || entry.metrics?.day_key
      if (!dayKey) return
      const bucket = cardioLogs[dayKey] ? [...cardioLogs[dayKey]] : []
      bucket.push({
        id: entry.id,
        sessionId: entry.id,
        dayKey,
        date: recordedDate,
        distance: Number(entry.metrics?.distance ?? 0),
        duration: Number(entry.metrics?.duration ?? 0),
        calories: Number(entry.metrics?.calories ?? 0),
        pace: entry.metrics?.pace || null,
        notes: entry.notes || entry.metrics?.notes || '',
      })
      bucket.sort(sortEntriesByDate)
      cardioLogs[dayKey] = bucket
      return
    }

    const exerciseId = entry.exercise_id || entry.metrics?.exerciseId
    if (!exerciseId) return

    const resolvedSets = (entry.sets && entry.sets.length ? entry.sets : entry.metrics?.sets) || []
    const normalizedEntry = {
      id: entry.id,
      sessionId: entry.id,
      exerciseId,
      date: recordedDate,
      sets: resolvedSets,
      dayKey: entry.day_key || entry.metrics?.dayKey || null,
      slotId: entry.slot_id || entry.metrics?.slotId || null,
    }

    const bucket = logs[exerciseId]?.history ? [...logs[exerciseId].history] : []
    const filtered = bucket.filter((item) => item.id !== normalizedEntry.id)
    filtered.push(normalizedEntry)
    filtered.sort(sortEntriesByDate)

    logs[exerciseId] = {
      lastSession: filtered.length ? filtered[filtered.length - 1].sets : normalizedEntry.sets,
      history: filtered,
    }
  })

  return { logs, cardioLogs }
}

const buildWeekOverview = (weekKey, logs = {}, cardioLogs = {}, exerciseLibrary = {}) => {
  if (!weekKey) {
    return {
      weekKey: '',
      strengthDaysTotal: 0,
      strengthDaysDone: 0,
      cardioRunsLogged: 0,
      cardioRunsTarget: 0,
      byDay: {},
    }
  }

  const overview = {
    weekKey,
    strengthDaysTotal: 0,
    strengthDaysDone: 0,
    cardioRunsLogged: 0,
    cardioRunsTarget: 0,
    byDay: {},
  }

  const dayBuckets = {}

  Object.entries(logs || {}).forEach(([exerciseId, payload]) => {
    (payload?.history || []).forEach((entry) => {
      if (!entry?.date || !isEntryInWeek(entry.date, weekKey)) return
      const dayKey = entry.dayKey || getDayKeyFromDate(entry.date)
      if (!dayKey || !WEEK_TEMPLATE[dayKey]) return
      const slotKey = entry.slotId || entry.slot_id || entry.id || `${exerciseId}-${entry.date}`
      dayBuckets[dayKey] = dayBuckets[dayKey] || {}
      dayBuckets[dayKey][slotKey] = {
        ...entry,
        exerciseId,
      }
    })
  })

  Object.entries(WEEK_TEMPLATE).forEach(([dayKey, config]) => {
    if (config.cardio) {
      const targetRuns = Number(config.cardioPlan?.targetRuns || 0)
      const entries = (cardioLogs?.[dayKey] || []).filter((entry) => isEntryInWeek(entry.date, weekKey))
      overview.cardioRunsTarget += targetRuns
      overview.cardioRunsLogged += entries.length
      overview.byDay[dayKey] = {
        type: 'cardio',
        label: config.label,
        theme: config.theme,
        description: config.description,
        runsLogged: entries.length,
        targetRuns,
        entries,
        status:
          entries.length === 0
            ? 'pending'
            : targetRuns && entries.length >= targetRuns
              ? 'complete'
              : 'in-progress',
        lastLoggedOn: entries.length ? entries[entries.length - 1].date : null,
      }
      return
    }

    const slots = config.exerciseOrder || []
    if (slots.length) {
      overview.strengthDaysTotal += 1
      const entries = dayBuckets[dayKey] || {}
      const completedSlots = Object.keys(entries).length
      if (completedSlots >= slots.length) {
        overview.strengthDaysDone += 1
      }
      const completedNames = Object.values(entries).map((entry) => {
        const exercise = exerciseLibrary[entry.exerciseId]
        return exercise?.name || entry.exerciseId
      })
      const remainingNames = slots.reduce((acc, slot) => {
        const slotKey = slot.slotId || slot.id
        if (slotKey && entries[slotKey]) {
          return acc
        }
        const candidateId = slot.defaultExercise || slot.options?.[0]
        const resolved = candidateId ? resolveExercise(candidateId, exerciseLibrary) : null
        acc.push(resolved?.name || slot.name || slot.label || slotKey || 'Upcoming lift')
        return acc
      }, [])

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

const mapExerciseFromApi = (exercise = {}) => {
  const metadata = exercise.extra_metadata || {}
  return {
    id: exercise.id,
    exerciseId: exercise.id,
    name: exercise.name,
    label: exercise.name,
    equipment: exercise.equipment || metadata.equipment || '',
    primaryMuscle: exercise.primary_muscle || metadata.primaryMuscle || '',
    secondaryMuscle: exercise.secondary_muscle || metadata.secondaryMuscle || '',
    muscleGroups: exercise.muscle_groups?.length
      ? exercise.muscle_groups
      : [exercise.primary_muscle, exercise.secondary_muscle].filter(Boolean),
    restSeconds: exercise.rest_seconds ?? metadata.restSeconds ?? 0,
    targetNotes: exercise.target_notes || metadata.targetNotes || '',
    cues: exercise.cues?.length ? exercise.cues : metadata.cues || [],
    mistakes: exercise.mistakes?.length ? exercise.mistakes : metadata.mistakes || [],
    swapSuggestions: exercise.swap_suggestions?.length
      ? exercise.swap_suggestions
      : metadata.swapSuggestions || [],
    lastSession: exercise.last_session?.length
      ? exercise.last_session
      : metadata.lastSession || [],
    lastPerformedOn: exercise.last_performed_on
      || metadata.last_performed_on
      || metadata.lastPerformedOn
      || null,
    extraMetadata: metadata,
    isPlaceholder: false,
  }
}

const mapExerciseToApi = (exercise = {}) => ({
  id: exercise.id,
  name: exercise.name,
  equipment: exercise.equipment || null,
  primary_muscle: exercise.primaryMuscle || null,
  secondary_muscle: exercise.secondaryMuscle || null,
  muscle_groups: exercise.muscleGroups || [],
  rest_seconds: exercise.restSeconds || null,
  target_notes: exercise.targetNotes || '',
  cues: exercise.cues || [],
  mistakes: exercise.mistakes || [],
  swap_suggestions: exercise.swapSuggestions || [],
  extra_metadata: {
    ...(exercise.extraMetadata || {}),
    lastSession: exercise.lastSession || [],
  },
})

const mapAssignmentFromApi = (assignment = {}) => ({
  id: assignment.id,
  dayKey: assignment.day_key,
  slotId: assignment.slot_id,
  slotName: assignment.slot_name,
  slotSubtitle: assignment.slot_subtitle,
  orderIndex: assignment.order_index,
  defaultExerciseId: assignment.default_exercise_id,
  selectedExerciseId: assignment.selected_exercise_id || assignment.default_exercise_id,
  options: assignment.options || [],
  metadata: assignment.metadata || {},
})

const buildAssignmentState = (assignments = []) => {
  const lookup = {}
  const selections = {}
  assignments.forEach((assignment) => {
    const mapped = mapAssignmentFromApi(assignment)
    if (!lookup[mapped.dayKey]) {
      lookup[mapped.dayKey] = {}
    }
    lookup[mapped.dayKey][mapped.slotId] = mapped

    selections[mapped.dayKey] = selections[mapped.dayKey] || {}
    selections[mapped.dayKey][mapped.slotId] = mapped.selectedExerciseId || mapped.defaultExerciseId
  })
  return { lookup, selections }
}

const buildManualSubstituteOptions = (exercise, assignmentMeta, exerciseLibrary = {}) => {
  if (!exercise || !exerciseLibrary) return []
  const currentId = exercise.id || exercise.exerciseId
  const prioritizedIds = [
    ...(assignmentMeta?.options || []),
    ...Object.keys(exerciseLibrary),
  ]
  const seen = new Set([currentId])
  const options = []
  prioritizedIds.forEach((id) => {
    if (!id || seen.has(id)) return
    const candidate = exerciseLibrary[id]
    if (!candidate) return
    options.push(candidate)
    seen.add(id)
  })
  return options.slice(0, 40)
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
  const [selectedDate, setSelectedDate] = useState(() => toDateOnly(new Date()))
  const selectedDateObj = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`)
    return Number.isNaN(date.getTime()) ? new Date() : date
  }, [selectedDate])
  const todayDateString = useMemo(() => toDateOnly(new Date()), [])
  const todayDateObj = useMemo(() => new Date(`${todayDateString}T00:00:00`), [todayDateString])
  const weekKey = getIsoWeekKey(selectedDateObj)
  const selectedDayKey = getDayKeyFromDate(selectedDateObj) || getDefaultDayKey()
  const isTodaySelected = selectedDate === todayDateString
  const isFutureSelected = selectedDateObj > todayDateObj
  const isPastSelected = selectedDateObj < todayDateObj
  const formattedSelectedDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const handleShiftDate = (delta) => {
    setSelectedDate((prev) => toDateOnly(shiftDateByDays(prev, delta)))
  }
  const handleResetDate = () => setSelectedDate(todayDateString)
  const handleDateInputChange = (value) => {
    if (!value) return
    setSelectedDate(value)
  }
  const [viewMode, setViewMode] = useState('plan')
  const [exerciseLibrary, setExerciseLibrary] = useState({})
  const [muscleTargets, setMuscleTargets] = usePersistentState('gym-targets', buildInitialTargets)

  const [swapSelections, setSwapSelections] = useState({})
  const [expandedCards, setExpandedCards] = useState({})
  const [notes, setNotes] = useState(DEFAULT_NOTES)
  const [logs, setLogs] = useState({})
  const [cardioLogs, setCardioLogs] = useState(buildInitialCardioLogs)
  const [assignmentsLookup, setAssignmentsLookup] = useState({})
  const [bootstrapLoading, setBootstrapLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const closeSummary = useCallback(() => setShowSummary(false), [])
  const noteTimers = useRef({})
  const exerciseRefs = useRef({})
  const weekOverview = useMemo(
    () => buildWeekOverview(weekKey, logs, cardioLogs, exerciseLibrary),
    [cardioLogs, exerciseLibrary, logs, weekKey],
  )
  
  useEffect(() => () => {
    Object.values(noteTimers.current).forEach((timer) => {
      if (timer) {
        clearTimeout(timer)
      }
    })
  }, [])

  useEffect(() => {
    if (!showSummary) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSummary()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeSummary, showSummary])


  const hydrateBootstrap = useCallback((payload) => {
    const nextExercises = Object.fromEntries((payload.exercises || []).map((exercise) => {
      const mapped = mapExerciseFromApi(exercise)
      return [mapped.id, mapped]
    }))
    setExerciseLibrary(nextExercises)

    const initialNotes = Object.fromEntries(Object.values(nextExercises).map((exercise) => [
      exercise.id,
      exercise.extraMetadata?.notes || '',
    ]))
    setNotes(initialNotes)

    const { lookup, selections } = buildAssignmentState(payload.assignments || [])
    setAssignmentsLookup(lookup)
    setSwapSelections(selections)

    const historyState = buildHistoryState(payload.history || [])
    setLogs(historyState.logs)
    setCardioLogs(historyState.cardioLogs)

    if (payload.muscle_targets) {
      setMuscleTargets(payload.muscle_targets)
    }
  }, [setMuscleTargets])

  const loadBootstrap = useCallback(async () => {
    setBootstrapLoading(true)
    setLoadError(null)
    try {
      const data = await fetchGymBootstrap()
      hydrateBootstrap(data || {})
    } catch (error) {
      console.error('Failed to load workout data', error)
      setLoadError('Unable to load workout data. Please retry.')
    } finally {
      setBootstrapLoading(false)
    }
  }, [hydrateBootstrap])

  useEffect(() => {
    loadBootstrap()
  }, [loadBootstrap])

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

  const selectedConfig = WEEK_TEMPLATE[selectedDayKey] || WEEK_TEMPLATE[getDefaultDayKey()]
  const resolvedPlan = (selectedConfig.exerciseOrder || [])
    .map((slot) => {
      const picked = swapSelections?.[selectedDayKey]?.[slot.slotId]
      const candidateIds = [picked, slot.defaultExercise, ...(slot.options || [])].filter(Boolean)
      if (!candidateIds.length) return null
      const libraryMatchId = candidateIds.find((id) => exerciseLibrary[id])
      const fallbackId = candidateIds.find((id) => DEFAULT_EXERCISES[id])
      const activeId = libraryMatchId || fallbackId || candidateIds[0]
      const resolvedExercise = libraryMatchId ? resolveExercise(libraryMatchId, exerciseLibrary) : null
      const referenceExercise = resolveExercise(activeId, exerciseLibrary) || resolveExercise(activeId, DEFAULT_EXERCISES)
      if (!referenceExercise) return null
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
          isPlaceholder: payload.isPlaceholder,
        },
      }
    })
    .filter(Boolean)
  const weeklyTotals = useMemo(
    () => buildMuscleSummary(logs, exerciseLibrary, weekKey),
    [exerciseLibrary, logs, weekKey],
  )

  if (bootstrapLoading && !Object.keys(exerciseLibrary).length) {
    return (
      <div className="app-shell loading-state">
        <div className="loading-card">
          <p>Syncing workout data…</p>
        </div>
      </div>
    )
  }

  const handleNoteChange = (exerciseId, value) => {
    setNotes((prev) => ({
      ...prev,
      [exerciseId]: value,
    }))

    if (noteTimers.current[exerciseId]) {
      clearTimeout(noteTimers.current[exerciseId])
    }
    noteTimers.current[exerciseId] = setTimeout(async () => {
      try {
        await updateExercise(exerciseId, { extra_metadata: { notes: value } })
      } catch (error) {
        console.error('Failed to save note', error)
        setActionError('Failed to save note. Please retry.')
      }
    }, 600)
  }

  const handleSaveLog = async (exerciseId, sets, meta = {}) => {
    const formatted = sets.map((set, index) => ({
      set: index + 1,
      weight: isNaN(Number(set.weight)) ? set.weight : Number(set.weight),
      reps: Number(set.reps),
    }))
    const entryDate = meta.targetDate || toDateOnly(new Date())
    const recordedAt = new Date(`${entryDate}T12:00:00`).toISOString()
    const entryDayKey = meta.dayKey || null
    const slotId = meta.slotId || null
    const nextSlotId = meta.nextSlotId
    const existingEntry = logs[exerciseId]?.history?.find((item) => item.date === entryDate)
    const entryWeekKey = getIsoWeekKey(new Date(`${entryDate}T00:00:00`))

    setIsSyncing(true)
    setActionError(null)
    try {
      if (existingEntry?.id) {
        await deleteExerciseHistory(existingEntry.id)
      }

      const savedEntry = await logExerciseHistory({
        exercise_id: exerciseId,
        recorded_at: recordedAt,
        day_key: entryDayKey,
        slot_id: slotId,
        sets: formatted,
        notes: notes[exerciseId] || '',
        metrics: {
          type: 'strength',
          exerciseId,
          dayKey: entryDayKey,
          slotId,
          weekKey: entryWeekKey,
          date: entryDate,
        },
      })

      const normalizedEntry = {
        id: savedEntry.id,
        sessionId: savedEntry.id,
        date: toDateOnly(savedEntry.recorded_at || recordedAt),
        sets: savedEntry.sets || formatted,
        dayKey: savedEntry.day_key || entryDayKey,
        slotId: savedEntry.slot_id || slotId,
      }

      setLogs((prev) => {
        const existing = prev[exerciseId]?.history || []
        const nextHistory = existing.filter((item) => item.id !== normalizedEntry.id)
        nextHistory.push(normalizedEntry)
        nextHistory.sort(sortEntriesByDate)
        return {
          ...prev,
          [exerciseId]: {
            lastSession: normalizedEntry.sets,
            history: nextHistory,
          },
        }
      })

      setExerciseLibrary((prev) => {
        const existingExercise = prev[exerciseId] || {}
        const previousDate = existingExercise.lastPerformedOn
        const shouldUpdateDate = !previousDate || normalizedEntry.date >= previousDate
        return {
          ...prev,
          [exerciseId]: {
            ...existingExercise,
            lastSession: formatted,
            lastPerformedOn: shouldUpdateDate ? normalizedEntry.date : previousDate,
          },
        }
      })

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
    } catch (error) {
      console.error('Failed to save workout session', error)
      setActionError('Failed to save workout session. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleClearHistory = async (exerciseId) => {
    const history = logs[exerciseId]?.history || []
    if (!history.length) return
    setIsSyncing(true)
    setActionError(null)
    try {
      await Promise.allSettled(history.map((entry) => deleteExerciseHistory(entry.id)))
      setLogs((prev) => ({
        ...prev,
        [exerciseId]: {
          lastSession: [],
          history: [],
        },
      }))
    } catch (error) {
      console.error('Failed to clear workout history', error)
      setActionError('Failed to clear history. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteHistoryEntry = async (exerciseId, entryId, fallbackIndex) => {
    const history = logs[exerciseId]?.history || []
    if (!history.length) return
    let target = history.find((item) => item.id === entryId)
    if (!target && typeof fallbackIndex === 'number') {
      target = history[fallbackIndex]
    }
    if (!target) return

    setIsSyncing(true)
    setActionError(null)
    try {
      await deleteExerciseHistory(target.id)
      setLogs((prev) => {
        const existing = prev[exerciseId]?.history || []
        const nextHistory = existing.filter((item) => item.id !== target.id)
        nextHistory.sort(sortEntriesByDate)
        return {
          ...prev,
          [exerciseId]: {
            lastSession: nextHistory.length ? nextHistory[nextHistory.length - 1].sets : [],
            history: nextHistory,
          },
        }
      })
    } catch (error) {
      console.error('Failed to delete entry', error)
      setActionError('Failed to delete entry. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }
  const registerExerciseRef = (slotId) => (node) => {
    if (node) {
      exerciseRefs.current[slotId] = node
    } else {
      delete exerciseRefs.current[slotId]
    }
  }


  const handleAddRun = async (dayKey, run, targetDate) => {
    const entryDate = targetDate || toDateOnly(new Date())
    const recordedAt = new Date(`${entryDate}T12:00:00`).toISOString()
    const plan = WEEK_TEMPLATE[dayKey] || {}
    const cardioExerciseId = `cardio_${dayKey}`
    const existingEntry = (cardioLogs[dayKey] || []).find((entry) => entry.date === entryDate)

    setIsSyncing(true)
    setActionError(null)
    try {
      if (existingEntry?.id) {
        await deleteExerciseHistory(existingEntry.id)
      }
      const savedEntry = await logExerciseHistory({
        exercise_id: cardioExerciseId,
        recorded_at: recordedAt,
        day_key: dayKey,
        slot_id: null,
        sets: [],
        notes: run.notes || plan.cardioPlan?.suggestions || '',
        metrics: {
          type: 'cardio',
          cardio: true,
          dayKey,
          date: entryDate,
          distance: Number(run.distance) || 0,
          duration: Number(run.duration) || 0,
          calories: Number(run.calories) || 0,
          pace: run.pace,
        },
      })

      const entry = {
        id: savedEntry.id,
        sessionId: savedEntry.id,
        dayKey,
        date: toDateOnly(savedEntry.recorded_at || recordedAt),
        distance: Number(run.distance) || 0,
        duration: Number(run.duration) || 0,
        calories: Number(run.calories) || 0,
        pace: run.pace || null,
        notes: run.notes || plan.cardioPlan?.suggestions || '',
      }

      setCardioLogs((prev) => {
        const next = { ...prev }
        const bucket = (next[dayKey] || []).filter((item) => item.id !== entry.id && item.date !== entry.date)
        bucket.push(entry)
        bucket.sort(sortEntriesByDate)
        next[dayKey] = bucket
        return next
      })
    } catch (error) {
      console.error('Failed to log cardio run', error)
      setActionError('Failed to log run. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSubstitute = async (dayKey, slotId) => {
    const assignment = assignmentsLookup?.[dayKey]?.[slotId]
    if (!assignment) return

    setIsSyncing(true)
    setActionError(null)
    try {
      const updated = await substituteAssignment(assignment.id)
      const mapped = mapAssignmentFromApi(updated)
      setAssignmentsLookup((prev) => ({
        ...prev,
        [dayKey]: {
          ...(prev[dayKey] || {}),
          [slotId]: mapped,
        },
      }))
      setSwapSelections((prev) => ({
        ...prev,
        [dayKey]: {
          ...(prev[dayKey] || {}),
          [slotId]: mapped.selectedExerciseId,
        },
      }))
    } catch (error) {
      console.error('Failed to substitute exercise', error)
      setActionError(error?.message || 'Failed to substitute exercise. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleManualSubstitute = async (dayKey, slotId, nextExerciseId) => {
    const assignment = assignmentsLookup?.[dayKey]?.[slotId]
    if (!assignment || !nextExerciseId || assignment.selectedExerciseId === nextExerciseId) {
      return
    }

    setIsSyncing(true)
    setActionError(null)
    try {
      const updated = await updateAssignment(assignment.id, { selected_exercise_id: nextExerciseId })
      const mapped = mapAssignmentFromApi(updated)
      setAssignmentsLookup((prev) => ({
        ...prev,
        [dayKey]: {
          ...(prev[dayKey] || {}),
          [slotId]: mapped,
        },
      }))
      setSwapSelections((prev) => ({
        ...prev,
        [dayKey]: {
          ...(prev[dayKey] || {}),
          [slotId]: mapped.selectedExerciseId,
        },
      }))
    } catch (error) {
      console.error('Failed to manually substitute exercise', error)
      setActionError('Failed to switch exercise. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSaveExercise = async (exercise) => {
    const normalized = normalizeExercisePayload(exercise, exerciseLibrary)
    const payload = mapExerciseToApi(normalized)
    const isUpdate = Boolean(exerciseLibrary[normalized.id])

    setIsSyncing(true)
    setActionError(null)
    try {
      const response = isUpdate
        ? await updateExercise(normalized.id, payload)
        : await createExercise(payload)
      const mapped = mapExerciseFromApi(response)
      setExerciseLibrary((prev) => ({
        ...prev,
        [mapped.id]: mapped,
      }))
      setNotes((prev) => ({
        ...prev,
        [mapped.id]: mapped.extraMetadata?.notes || '',
      }))
    } catch (error) {
      console.error('Failed to save exercise', error)
      setActionError('Failed to save exercise. Please retry.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteExercise = async (exerciseId) => {
    if (!exerciseId) return
    setIsSyncing(true)
    setActionError(null)
    try {
      await deleteExercise(exerciseId)
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
    } catch (error) {
      console.error('Failed to delete exercise', error)
      setActionError('Failed to delete exercise. Please retry.')
    } finally {
      setIsSyncing(false)
    }
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
  const showStatusBanner = bootstrapLoading || isSyncing || loadError || actionError
  const hasErrorBanner = Boolean(loadError || actionError)
  const totalExercises = Object.keys(exerciseLibrary).length

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
            Summary
          </button>
          <button
            type="button"
            className="hero-button"
            onClick={() => setViewMode('library')}
          >
            Library
          </button>
        </div>
      </header>

      <DateNavigator
        value={selectedDate}
        onChange={handleDateInputChange}
        onShift={handleShiftDate}
        onReset={handleResetDate}
        displayLabel={`${formattedSelectedDateLabel}${isTodaySelected ? ' · Today' : ''}`}
      />

      {showStatusBanner ? (
        <div className={`status-banner${hasErrorBanner ? ' error' : ''}`}>
          <div className="status-banner__message">
            {loadError || actionError
              ? (loadError || actionError)
              : bootstrapLoading
                ? 'Syncing workout data…'
                : isSyncing
                  ? 'Saving changes…'
                  : null}
          </div>
          {loadError ? (
            <button type="button" onClick={() => loadBootstrap()}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <DayPicker
        template={WEEK_TEMPLATE}
        selectedDay={selectedDayKey}
        onSelect={(dayKey) => setSelectedDate((prev) => toDateOnly(getDateForDayKey(prev, dayKey)))}
      />

      {isCardioDay ? (
        <CardioTracker
          dayKey={selectedDayKey}
          plan={selectedConfig}
          entries={cardioLogs[selectedDayKey] || []}
          onAddRun={handleAddRun}
          selectedDate={selectedDate}
          isFutureDate={isFutureSelected}
          isToday={isTodaySelected}
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
            const isOpen = Boolean(expandedCards[selectedDayKey]?.[exercise.slotId])
            const orderLabel = (index + 1).toString().padStart(2, '0')
            const nextSlotId = resolvedPlan[index + 1]?.slotId
            const assignmentMeta = assignmentsLookup?.[selectedDayKey]?.[exercise.slotId]
            const optionCount = assignmentMeta?.options?.length || 0
            const canSubstitute = totalExercises > 1 || optionCount > 0
            const manualOptions = buildManualSubstituteOptions(exercise, assignmentMeta, exerciseLibrary)
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
                onToggle={() => handleToggleCard(selectedDayKey, exercise.slotId)}
                onSubstitute={canSubstitute ? () => handleSubstitute(selectedDayKey, exercise.slotId) : undefined}
                manualOptions={manualOptions}
                onManualSubstitute={manualOptions.length ? (nextId) => handleManualSubstitute(selectedDayKey, exercise.slotId, nextId) : undefined}
                canSubstitute={canSubstitute}
                dayKey={selectedDayKey}
                nextSlotId={nextSlotId}
                onClearHistory={handleClearHistory}
                onDeleteHistoryEntry={handleDeleteHistoryEntry}
                selectedDate={selectedDate}
                isToday={isTodaySelected}
                isFutureDate={isFutureSelected}
                isPastDate={isPastSelected}
              />
            )
          })}
        </section>
      )}

      {showSummary ? (
        <div className="summary-overlay" role="dialog" aria-modal="true" onClick={closeSummary}>
          <div className="summary-panel" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>Week at a glance</h2>
              <button type="button" className="ghost" onClick={closeSummary}>
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
