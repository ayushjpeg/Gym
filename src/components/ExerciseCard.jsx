import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

const projectSetTarget = (set) => {
  if (typeof set.weight === 'number') {
    const progression = set.weight >= 40 ? 5 : 2.5
    return { ...set, weight: set.weight + progression }
  }
  if (typeof set.weight === 'string' && set.weight.toLowerCase() === 'bw') {
    return { ...set, reps: set.reps + 2 }
  }
  return { ...set }
}

const ExerciseCard = forwardRef(({
  exercise,
  displayName,
  subtitle,
  orderLabel,
  note,
  onNoteChange,
  log,
  onSaveLog,
  isOpen,
  onToggle,
  onSubstitute,
  manualOptions,
  onManualSubstitute,
  canSubstitute,
  dayKey,
  nextSlotId,
  onClearHistory,
  onDeleteHistoryEntry,
  selectedDate,
  isToday,
  isFutureDate,
  isPastDate,
}, ref) => {
  const [pendingSets, setPendingSets] = useState([])
  const [manualSelection, setManualSelection] = useState('')
  const isPlaceholder = Boolean(exercise.isPlaceholder)

  const formattedDate = useMemo(() => {
    if (!selectedDate) return ''
    const date = new Date(`${selectedDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) return selectedDate
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }, [selectedDate])

  const entryForDate = useMemo(
    () => (log?.history || []).find((entry) => entry.date === selectedDate),
    [log, selectedDate],
  )

  const lastSession = useMemo(() => {
    if (log?.lastSession?.length) return log.lastSession
    return exercise.lastSession || []
  }, [exercise.lastSession, log])

  const fullHistory = log?.history || []
  const recentHistory = fullHistory.slice(-3).reverse()
  const latestEntry = fullHistory.length ? fullHistory[fullHistory.length - 1] : null
  const targetSession = lastSession.map((set) => projectSetTarget(set))
  const dateHasEntry = Boolean(entryForDate?.sets?.length)

  const hydrateFromSelection = useCallback(() => {
    if (entryForDate?.sets?.length) {
      return entryForDate.sets.map((set, index) => ({ set: set.set || index + 1, weight: set.weight, reps: set.reps }))
    }
    if (lastSession.length) {
      return lastSession.map((set) => ({ set: set.set, weight: set.weight, reps: set.reps }))
    }
    return [{ set: 1, weight: '', reps: '' }]
  }, [entryForDate, lastSession])

  useEffect(() => {
    if (!isOpen || isPlaceholder) {
      return undefined
    }
    const frame = requestAnimationFrame(() => {
      setPendingSets(hydrateFromSelection())
    })
    return () => cancelAnimationFrame(frame)
  }, [hydrateFromSelection, isOpen, isPlaceholder])

  useEffect(() => {
    setManualSelection('')
  }, [exercise.id])

  const handleUpdatePending = (index, field, value) => {
    setPendingSets((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleAddSet = () => {
    setPendingSets((prev) => ([
      ...prev,
      {
        set: prev.length + 1,
        weight: prev[prev.length - 1]?.weight || '',
        reps: prev[prev.length - 1]?.reps || '',
      },
    ]))
  }

  const handleRemoveSet = (index) => {
    setPendingSets((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, idx) => idx !== index).map((set, idx) => ({ ...set, set: idx + 1 }))
      return next
    })
  }

  const handleManualSelect = (event) => {
    const { value } = event.target
    if (!value) {
      setManualSelection('')
      return
    }
    if (value === '__auto__') {
      if (onSubstitute) {
        onSubstitute()
      }
      setManualSelection('')
      return
    }
    if (onManualSubstitute) {
      onManualSubstitute(value)
    }
    setManualSelection('')
  }

  const handleSaveSession = () => {
    if (!pendingSets.length || isFutureDate) return
    onSaveLog(
      exercise.id || exercise.exerciseId,
      pendingSets,
      {
        dayKey,
        slotId: exercise.slotId,
        nextSlotId,
        targetDate: selectedDate,
      },
    )
    setPendingSets([])
  }

  const handleClearHistory = () => {
    if (!recentHistory.length || !onClearHistory) return
    const confirmClear = window.confirm('Clear all entries for this exercise?')
    if (confirmClear) {
      onClearHistory(exercise.id || exercise.exerciseId)
    }
  }

  const handleRemoveHistoryEntry = (entry, index) => {
    if (!onDeleteHistoryEntry) return
    const fallbackIndex = (log?.history?.length || 0) - 1 - index
    onDeleteHistoryEntry(exercise.id || exercise.exerciseId, entry.id, fallbackIndex)
  }

  const summaryTarget = targetSession[targetSession.length - 1] || {}

  const handleOverviewKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isPlaceholder) {
        onToggle()
      }
    }
  }

  const handleOverviewClick = () => {
    if (isPlaceholder) return
    onToggle()
  }

  const saveDisabled = !pendingSets.length || isFutureDate
  const saveLabel = dateHasEntry ? 'Update' : isToday ? 'Save' : 'Log'
  const logSubtitle = isFutureDate
    ? 'Future date — tracking unlocks once this day arrives.'
    : dateHasEntry
      ? 'Updating the sets recorded for this date.'
      : isPastDate
        ? 'Backfill any missed sets for this day.'
        : 'Ready to capture today’s effort.'

  return (
  <article ref={ref} className={clsx('exercise-card', { expanded: isOpen, placeholder: isPlaceholder })}>
      <div className="exercise-card__compact">
        <div
          className="exercise-card__overview"
          onClick={handleOverviewClick}
          onKeyDown={handleOverviewKey}
          role="button"
          tabIndex={0}
        >
          <div className="exercise-card__order">{orderLabel}</div>
          <div>
            <div className="exercise-card__title-row">
              <h3>{exercise.name || displayName}</h3>
              <p>
                {isPlaceholder
                  ? 'Add this slot from the Exercise Library to enable logging.'
                  : [
                    displayName && displayName !== exercise.name ? `Slot: ${displayName}` : null,
                    subtitle,
                    `${exercise.equipment || 'Gym floor'} · ${(exercise.muscleGroups || []).join(', ')}`,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
              </p>
            </div>
            <div className="exercise-card__last">
              <span className="date-chip">{formattedDate || selectedDate}</span>
              {dateHasEntry ? (
                <ul>
                  {entryForDate.sets.map((set) => (
                    <li key={`${exercise.name}-selected-${set.set}`}>
                      Set {set.set}: {set.weight}
                      {typeof set.weight === 'number' ? ' kg' : ''} × {set.reps}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="muted">No record for this date.</p>
                  {latestEntry?.date ? (
                    <p className="muted small">Last logged on {latestEntry.date}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="exercise-card__compact-actions">
          {canSubstitute ? (
            <div className="substitute-dropdown" style={{ position: 'relative' }}>
              <button type="button" className="ghost" onClick={onSubstitute}>
                Substitute ▾
              </button>
              {(manualOptions?.length || onSubstitute) ? (
                <select
                  className="manual-substitute-select"
                  value={manualSelection}
                  onChange={handleManualSelect}
                  aria-label="Substitute options"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                >
                  <option value="">Substitute…</option>
                  {onSubstitute ? <option value="__auto__">Auto rotate</option> : null}
                  {(manualOptions || []).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                      {option.muscleGroups?.length ? ` · ${option.muscleGroups.join(', ')}` : ''}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            disabled={isPlaceholder || (!isOpen && isFutureDate)}
          >
            {isPlaceholder
              ? 'Add in library'
              : isOpen
                ? 'Close'
                : isToday
                  ? 'Start'
                  : isFutureDate
                    ? 'Start'
                    : 'Update'}
          </button>
        </div>
      </div>

      {isOpen && isPlaceholder ? (
        <div className="exercise-card__details placeholder-copy">
          <p>Add or swap this exercise inside the “Manage exercises” view to unlock logging, notes, and history.</p>
        </div>
      ) : null}

      {isOpen && !isPlaceholder ? (
        <div className="exercise-card__details">
          <section className="exercise-card__section log-stack">
            <div className="log-panel">
              <div className="log-panel__header">
                <h4>Log sets for {formattedDate || selectedDate}</h4>
                <div>
                  <button type="button" className="ghost" onClick={handleAddSet}>
                    + Set
                  </button>
                </div>
              </div>
              <p className="muted small">{logSubtitle}</p>
              <div className="log-table">
                {pendingSets.map((set, index) => (
                  <div className="log-row" key={`pending-${set.set}-${index}`}>
                    <span>Set {index + 1}</span>
                    <input
                      type="text"
                      value={set.weight}
                      onChange={(event) => handleUpdatePending(index, 'weight', event.target.value)}
                    />
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(event) => handleUpdatePending(index, 'reps', event.target.value)}
                    />
                    {pendingSets.length > 1 ? (
                      <button type="button" className="ghost" onClick={() => handleRemoveSet(index)}>
                        ✕
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="log-actions">
                <button
                  type="button"
                  className={clsx('primary', { disabled: saveDisabled })}
                  onClick={handleSaveSession}
                  disabled={saveDisabled}
                >
                  {saveLabel}
                </button>
                <button type="button" onClick={() => setPendingSets(hydrateFromSelection())}>
                  Reset
                </button>
              </div>
              {isFutureDate ? (
                <p className="muted small">Cannot log sets for future dates. Come back on {formattedDate || selectedDate}.</p>
              ) : null}
            </div>
            <div className="notes-panel">
              <h4>Quick notes</h4>
              <textarea
                value={note || ''}
                onChange={(event) => onNoteChange(exercise.id || exercise.exerciseId, event.target.value)}
                placeholder="Grip width, tempo, cues..."
              />
            </div>
          </section>

          <section className="exercise-card__section history">
            <div>
              <h4>Next target</h4>
              {summaryTarget.set ? (
                <p>
                  Aim for {summaryTarget.weight}
                  {typeof summaryTarget.weight === 'number' ? ' kg' : ''} × {summaryTarget.reps}
                </p>
              ) : (
                <p className="muted">Targets unlock once you log a session.</p>
              )}
            </div>
            {recentHistory.length ? (
              <div>
                <div className="history-header">
                  <h4>Recent history</h4>
                  {onClearHistory ? (
                    <button type="button" className="ghost" onClick={handleClearHistory}>
                      Clear all
                    </button>
                  ) : null}
                </div>
                <ul>
                  {recentHistory.map((entry, index) => (
                    <li key={entry.id || entry.date}>
                      <span>{entry.date}</span>
                      <span>
                        {entry.sets
                          .map((set) => `${set.weight}${typeof set.weight === 'number' ? 'kg' : ''}×${set.reps}`)
                          .join(', ')}
                      </span>
                      {onDeleteHistoryEntry ? (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleRemoveHistoryEntry(entry, index)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </article>
  )
})

ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.string,
    exerciseId: PropTypes.string,
    name: PropTypes.string.isRequired,
    muscleGroups: PropTypes.arrayOf(PropTypes.string),
    equipment: PropTypes.string,
    restSeconds: PropTypes.number,
    cues: PropTypes.arrayOf(PropTypes.string),
    mistakes: PropTypes.arrayOf(PropTypes.string),
    isPlaceholder: PropTypes.bool,
    swapSuggestions: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        detail: PropTypes.string,
      }),
    ),
    targetNotes: PropTypes.string,
    lastSession: PropTypes.arrayOf(
      PropTypes.shape({
        set: PropTypes.number,
        weight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        reps: PropTypes.number,
      }),
    ),
  }).isRequired,
  displayName: PropTypes.string,
  subtitle: PropTypes.string,
  orderLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  note: PropTypes.string,
  onNoteChange: PropTypes.func.isRequired,
  log: PropTypes.shape({
    lastSession: PropTypes.arrayOf(
      PropTypes.shape({
        set: PropTypes.number,
        weight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        reps: PropTypes.number,
      }),
    ),
    history: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        date: PropTypes.string,
        sets: PropTypes.arrayOf(
          PropTypes.shape({
            set: PropTypes.number,
            weight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            reps: PropTypes.number,
          }),
        ),
      }),
    ),
  }),
  onSaveLog: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onSubstitute: PropTypes.func,
  manualOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      muscleGroups: PropTypes.arrayOf(PropTypes.string),
      equipment: PropTypes.string,
    }),
  ),
  onManualSubstitute: PropTypes.func,
  canSubstitute: PropTypes.bool,
  dayKey: PropTypes.string,
  nextSlotId: PropTypes.string,
  onClearHistory: PropTypes.func,
  onDeleteHistoryEntry: PropTypes.func,
  selectedDate: PropTypes.string.isRequired,
  isToday: PropTypes.bool,
  isFutureDate: PropTypes.bool,
  isPastDate: PropTypes.bool,
}

ExerciseCard.defaultProps = {
  displayName: undefined,
  subtitle: undefined,
  orderLabel: '',
  note: '',
  log: undefined,
  isOpen: false,
  onSubstitute: undefined,
  manualOptions: [],
  onManualSubstitute: undefined,
  canSubstitute: false,
  dayKey: undefined,
  nextSlotId: undefined,
  onClearHistory: undefined,
  onDeleteHistoryEntry: undefined,
  isToday: false,
  isFutureDate: false,
  isPastDate: false,
}

ExerciseCard.displayName = 'ExerciseCard'

export default ExerciseCard
