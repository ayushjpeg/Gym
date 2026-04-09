import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { MUSCLE_GROUPS } from '../data/programData'

const DAY_OPTIONS = [
  { key: 'sunday', label: 'Sun' },
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
]

const DAY_MODE_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'rest', label: 'Rest' },
]

const emptyExercise = {
  id: '',
  name: '',
  equipment: '',
  primaryMuscle: MUSCLE_GROUPS[0],
  secondaryMuscle: '',
  scheduledDays: [],
}

const formatSetPreview = (exercise) => {
  const sets = exercise?.lastSession || []
  if (!sets.length) return null
  const top = sets[sets.length - 1]
  const weight = typeof top.weight === 'number' ? `${top.weight} kg` : top.weight
  return `${weight} × ${top.reps}`
}

const ExerciseLibrary = ({
  exercises,
  exerciseScheduleMap,
  onSaveExercise,
  onDeleteExercise,
  onBack,
  muscleTargets,
  onTargetsChange,
  daySettings,
  onDaySettingsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [formState, setFormState] = useState(emptyExercise)
  const [editingId, setEditingId] = useState(null)
  const [muscleFilter, setMuscleFilter] = useState('All')

  const exerciseList = useMemo(() => Object.values(exercises || {}), [exercises])

  const muscleCounts = useMemo(() => {
    return exerciseList.reduce((acc, exercise) => {
      const primary = exercise.primaryMuscle || 'Other'
      acc[primary] = (acc[primary] || 0) + 1
      if (exercise.secondaryMuscle) {
        acc[exercise.secondaryMuscle] = (acc[exercise.secondaryMuscle] || 0) + 1
      }
      return acc
    }, {})
  }, [exerciseList])

  const stats = useMemo(() => {
    const total = exerciseList.length
    const coveredMuscles = Object.keys(muscleCounts).length
    const multiMuscle = exerciseList.filter((exercise) => Boolean(exercise.secondaryMuscle)).length
    const coveragePct = MUSCLE_GROUPS.length
      ? Math.round((coveredMuscles / MUSCLE_GROUPS.length) * 100)
      : 0
    return { total, coveredMuscles, multiMuscle, coveragePct }
  }, [exerciseList, muscleCounts])

  const availableMuscles = useMemo(
    () => MUSCLE_GROUPS.filter((group) => muscleCounts[group]),
    [muscleCounts],
  )

  const filteredExercises = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    return [...exerciseList]
      .filter((exercise) => {
        if (muscleFilter === 'All') return true
        return (
          exercise.primaryMuscle === muscleFilter
          || exercise.secondaryMuscle === muscleFilter
        )
      })
      .filter((exercise) => {
        if (!needle) return true
        return (
          exercise.name.toLowerCase().includes(needle)
          || (exercise.equipment || '').toLowerCase().includes(needle)
          || (exercise.primaryMuscle || '').toLowerCase().includes(needle)
          || (exercise.secondaryMuscle || '').toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exerciseList, muscleFilter, searchTerm])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormState(emptyExercise)
    setEditingId(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      return
    }
    const payload = {
      id: editingId || formState.id || undefined,
      name: formState.name.trim(),
      equipment: formState.equipment.trim(),
      primaryMuscle: formState.primaryMuscle,
      secondaryMuscle: formState.secondaryMuscle || '',
      scheduledDays: formState.scheduledDays || [],
    }
    onSaveExercise(payload)
    resetForm()
  }

  const toggleScheduledDay = (dayKey) => {
    setFormState((prev) => {
      const current = new Set(prev.scheduledDays || [])
      if (current.has(dayKey)) current.delete(dayKey)
      else current.add(dayKey)
      return {
        ...prev,
        scheduledDays: DAY_OPTIONS.map((option) => option.key).filter((key) => current.has(key)),
      }
    })
  }

  const handleEditExercise = (exercise) => {
    setEditingId(exercise.id)
    setFormState({
      id: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment || '',
      primaryMuscle: exercise.primaryMuscle || MUSCLE_GROUPS[0],
      secondaryMuscle: exercise.secondaryMuscle || '',
      scheduledDays: exerciseScheduleMap?.[exercise.id] || exercise.scheduledDays || [],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteExercise = (exercise) => {
    const confirmDelete = window.confirm(`Remove ${exercise.name} from your library?`)
    if (!confirmDelete) return
    onDeleteExercise(exercise.id)
    if (editingId === exercise.id) {
      resetForm()
    }
  }

  const handleTargetChange = (muscle, field, value) => {
    const numeric = Number(value)
    onTargetsChange({
      ...muscleTargets,
      [muscle]: {
        low: field === 'low' ? numeric : (muscleTargets[muscle]?.low || 0),
        high: field === 'high' ? numeric : (muscleTargets[muscle]?.high || 0),
      },
    })
  }

  const formatScheduledDays = (exercise) => {
    const scheduled = exerciseScheduleMap?.[exercise.id] || exercise.scheduledDays || []
    if (!scheduled.length) return 'Not scheduled'
    return DAY_OPTIONS.filter((option) => scheduled.includes(option.key)).map((option) => option.label).join(', ')
  }

  return (
    <section className="exercise-library">
      <header className="library-header">
        <div>
          <p className="muted">Build swaps, targets, and metadata once—use it everywhere.</p>
          <h2>Exercise library</h2>
        </div>
        <button type="button" className="ghost" onClick={onBack}>
          Back to planner
        </button>
      </header>

      <section className="library-metrics">
        <article>
          <span>Total exercises</span>
          <strong>{stats.total}</strong>
          <p>Every lift fuels auto-substitutes.</p>
        </article>
        <article>
          <span>Muscle coverage</span>
          <strong>{stats.coveragePct}%</strong>
          <p>{stats.coveredMuscles} of {MUSCLE_GROUPS.length} targets filled</p>
        </article>
        <article>
          <span>Multi-muscle moves</span>
          <strong>{stats.multiMuscle}</strong>
          <p>Secondary muscle data improves swap logic.</p>
        </article>
      </section>

      <section className="library-panel library-panel--wide">
        <div className="library-toolbar">
          <div className="search-field">
            <input
              type="search"
              placeholder="Search by name, equipment, or muscle"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="filter-row">
            <span>Filter</span>
            <div className="filter-pills">
              <button
                type="button"
                className={clsx('pill', { active: muscleFilter === 'All' })}
                onClick={() => setMuscleFilter('All')}
              >
                All muscles
              </button>
              {availableMuscles.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={clsx('pill', { active: muscleFilter === group })}
                  onClick={() => setMuscleFilter(group)}
                >
                  {group}
                  <span>{muscleCounts[group]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="exercise-card-grid">
          {filteredExercises.map((exercise) => {
            const preview = formatSetPreview(exercise)
            return (
              <article key={exercise.id} className="library-card">
                <header>
                  <div>
                    <span className="badge">{exercise.primaryMuscle}</span>
                    {exercise.secondaryMuscle ? (
                      <span className="badge ghost">{exercise.secondaryMuscle}</span>
                    ) : null}
                  </div>
                  <div className="card-actions">
                    <button type="button" className="ghost" onClick={() => handleEditExercise(exercise)}>
                      Edit
                    </button>
                    <button type="button" className="ghost" onClick={() => handleDeleteExercise(exercise)}>
                      Remove
                    </button>
                  </div>
                </header>
                <h3>{exercise.name}</h3>
                {exercise.equipment ? <p className="muted">{exercise.equipment}</p> : <p className="muted">Bodyweight / gym floor</p>}
                <p className="set-preview">Days: {formatScheduledDays(exercise)}</p>
                {preview ? <p className="set-preview">Last: {preview}</p> : <p className="set-preview muted">Log it once to unlock targets.</p>}
              </article>
            )
          })}
          {!filteredExercises.length ? (
            <div className="empty-state">
              <p>No exercises match “{searchTerm || muscleFilter}”.</p>
              <p>Add one with the form below or clear filters.</p>
            </div>
          ) : null}
        </div>
      </section>

      <div className="library-grid">
        <div className="library-panel">
          <h3>{editingId ? 'Edit exercise' : 'Add new exercise'}</h3>
          <form className="library-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="Incline dumbbell press"
                required
              />
            </label>
            <label>
              Equipment / setup
              <input
                name="equipment"
                type="text"
                value={formState.equipment}
                onChange={handleInputChange}
                placeholder="Dumbbells + adjustable bench"
              />
            </label>
            <label>
              Primary muscle
              <select name="primaryMuscle" value={formState.primaryMuscle} onChange={handleInputChange}>
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Secondary muscle (optional)
              <select name="secondaryMuscle" value={formState.secondaryMuscle} onChange={handleInputChange}>
                <option value="">None</option>
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <div className="library-form__group">
              <span>Scheduled days</span>
              <div className="day-chip-grid">
                {DAY_OPTIONS.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    className={clsx('pill', 'day-pill-toggle', { active: (formState.scheduledDays || []).includes(day.key) })}
                    onClick={() => toggleScheduledDay(day.key)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="muted">You can leave an exercise on 0 days if you want it in the library only.</p>
            </div>
            <div className="library-form__actions">
              {editingId ? (
                <button type="button" className="ghost" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
              <button type="submit" className={clsx('primary', { disabled: !formState.name.trim() })}>
                {editingId ? 'Save changes' : 'Add exercise'}
              </button>
            </div>
          </form>
        </div>

        <div className="library-panel">
          <h3>Week setup</h3>
          <p className="muted">Choose which days are strength, cardio, or rest. This controls the planner and library schedule.</p>
          <div className="day-settings-list">
            {DAY_OPTIONS.map((day) => (
              <div key={day.key} className="day-settings-row">
                <strong>{day.label}</strong>
                <div className="mode-pill-row">
                  {DAY_MODE_OPTIONS.map((option) => (
                    <button
                      key={`${day.key}-${option.value}`}
                      type="button"
                      className={clsx('pill', { active: daySettings?.[day.key] === option.value })}
                      onClick={() => onDaySettingsChange({ ...daySettings, [day.key]: option.value })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="library-panel targets">
          <h3>Weekly muscle targets</h3>
          <p className="muted">Tune how Week Progress scores each muscle group.</p>
          <table>
            <thead>
              <tr>
                <th>Muscle group</th>
                <th>Low</th>
                <th>High</th>
              </tr>
            </thead>
            <tbody>
              {MUSCLE_GROUPS.map((group) => (
                <tr key={group}>
                  <td>{group}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={muscleTargets[group]?.low ?? 0}
                      onChange={(event) => handleTargetChange(group, 'low', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={muscleTargets[group]?.high ?? 0}
                      onChange={(event) => handleTargetChange(group, 'high', event.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

ExerciseLibrary.propTypes = {
  exercises: PropTypes.object.isRequired,
  exerciseScheduleMap: PropTypes.object.isRequired,
  onSaveExercise: PropTypes.func.isRequired,
  onDeleteExercise: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  muscleTargets: PropTypes.object.isRequired,
  onTargetsChange: PropTypes.func.isRequired,
  daySettings: PropTypes.object.isRequired,
  onDaySettingsChange: PropTypes.func.isRequired,
}

export default ExerciseLibrary
