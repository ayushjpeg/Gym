import { WEEK_TEMPLATE, DEFAULT_EXERCISES } from '../data/programData'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_INDEX = DAY_KEYS.reduce((acc, key, index) => ({ ...acc, [key]: index }), {})

const asDate = (value = new Date()) => {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const datePart = trimmed.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    const parsed = Date.parse(trimmed)
    if (!Number.isNaN(parsed)) {
      return new Date(parsed)
    }
    return new Date()
  }
  return new Date(value || Date.now())
}

export const getIsoWeekKey = (date = new Date()) => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${weekNo}`
}

export const isEntryInWeek = (dateString, weekKey) => {
  if (!dateString) return false
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return false
  return getIsoWeekKey(date) === weekKey
}

export const resolveExercise = (exerciseId, exerciseLibrary = DEFAULT_EXERCISES) => {
  const data = exerciseLibrary[exerciseId]
  if (!data) return null
  return {
    exerciseId,
    ...data,
  }
}

export const getDayKeyFromDate = (value = new Date()) => {
  const date = asDate(value)
  const index = date.getDay()
  return DAY_KEYS[index] || 'sunday'
}

export const getDateForDayKey = (anchor = new Date(), targetDayKey = 'sunday') => {
  const targetIndex = DAY_INDEX[targetDayKey]
  if (typeof targetIndex === 'undefined') {
    return asDate(anchor)
  }
  const base = asDate(anchor)
  const currentIndex = base.getDay()
  const diff = targetIndex - currentIndex
  const next = new Date(base)
  next.setDate(base.getDate() + diff)
  return next
}

export const shiftDateByDays = (value = new Date(), offset = 0) => {
  const base = asDate(value)
  const next = new Date(base)
  next.setDate(base.getDate() + offset)
  return next
}

const dayOrderIndex = (dayKey) => {
  const config = WEEK_TEMPLATE[dayKey]
  if (!config?.exerciseOrder) return {}
  return config.exerciseOrder.reduce((acc, slot, index) => {
    acc[slot.slotId] = index
    return acc
  }, {})
}

export const sortPlaylistForDay = (dayKey, playlist = []) => {
  const orderMap = dayOrderIndex(dayKey)
  const fallback = Number.MAX_SAFE_INTEGER
  return [...playlist].sort(
    (a, b) => (orderMap[a.slotId] ?? fallback) - (orderMap[b.slotId] ?? fallback),
  )
}

export const buildDefaultPlaylist = () => {
  const defaults = {}
  Object.entries(WEEK_TEMPLATE).forEach(([dayKey, config]) => {
    if (!config.exerciseOrder) return
    defaults[dayKey] = config.exerciseOrder.map((slot) => ({
      slotId: slot.slotId,
      exerciseId: slot.defaultExercise || slot.options?.[0],
    }))
  })
  return defaults
}

export const buildMuscleSummary = (logs = {}, exerciseLibrary = DEFAULT_EXERCISES, weekKey = getIsoWeekKey()) => {
  const totals = {}
  Object.entries(logs).forEach(([exerciseId, payload]) => {
    const exercise = exerciseLibrary[exerciseId]
    if (!exercise) return
    const primary = exercise.primaryMuscle || exercise.muscleGroups?.[0]
    const secondary = exercise.secondaryMuscle
    ;(payload?.history || []).forEach((entry) => {
      if (!isEntryInWeek(entry.date, weekKey)) return
      const setVolume = entry.sets?.length || 0
      if (!setVolume) return
      if (primary) {
        totals[primary] = (totals[primary] || 0) + setVolume
      }
      if (secondary) {
        totals[secondary] = (totals[secondary] || 0) + Math.max(1, Math.round(setVolume / 2))
      }
    })
  })
  return totals
}
