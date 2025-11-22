import { forwardRef, useEffect, useMemo, useState } from 'react'
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
  canSubstitute,
  dayKey,
  nextSlotId,
  onClearHistory,
  onDeleteHistoryEntry,
}, ref) => {
  const [pendingSets, setPendingSets] = useState([])
  const isPlaceholder = Boolean(exercise.isPlaceholder)

  const lastSession = useMemo(() => {
    if (log?.lastSession?.length) return log.lastSession
    return exercise.lastSession || []
  }, [exercise.lastSession, log])

  const fullHistory = log?.history || []
  const recentHistory = fullHistory.slice(-3).reverse()
  const targetSession = lastSession.map((set) => projectSetTarget(set))

  const hydrateFromLast = () => (
    lastSession.length
      ? lastSession.map((set) => ({ set: set.set, weight: set.weight, reps: set.reps }))
      : [{ set: 1, weight: '', reps: '' }]
  )

  useEffect(() => {
    if (isOpen && !isPlaceholder) {
      setPendingSets((prev) => (prev.length ? prev : hydrateFromLast()))
    }
  }, [isOpen, lastSession, isPlaceholder])

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

  const handleSaveSession = () => {
    if (!pendingSets.length) return
    onSaveLog(
      exercise.id || exercise.exerciseId,
      pendingSets,
      {
        dayKey,
        slotId: exercise.slotId,
        nextSlotId,
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
              <h3>{displayName || exercise.name}</h3>
              <p>
                {subtitle
                  || (isPlaceholder
                    ? 'Add this slot from the Exercise Library to enable logging.'
                    : `${exercise.equipment || 'Gym floor'} · ${(exercise.muscleGroups || []).join(', ')}`)}
              </p>
            </div>
            <div className="exercise-card__last">
              {lastSession.length ? (
                <ul>
                  {lastSession.map((set) => (
                    <li key={`${exercise.name}-last-${set.set}`}>
                      Set {set.set}: {set.weight}
                      {typeof set.weight === 'number' ? ' kg' : ''} × {set.reps}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No log yet — hit Start to add one.</p>
              )}
            </div>
          </div>
        </div>
        <div className="exercise-card__compact-actions">
          {canSubstitute && onSubstitute ? (
            <button type="button" className="ghost" onClick={onSubstitute}>
              Substitute
            </button>
          ) : null}
          <button type="button" onClick={onToggle} disabled={isPlaceholder}>
            {isPlaceholder ? 'Add in library' : isOpen ? 'Close' : 'Start'}
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
                <h4>Log today’s sets</h4>
                <div>
                  <button type="button" className="ghost" onClick={handleAddSet}>
                    + Add set
                  </button>
                </div>
              </div>
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
                  className={clsx('primary', { disabled: !pendingSets.length })}
                  onClick={handleSaveSession}
                  disabled={!pendingSets.length}
                >
                  Save session
                </button>
                <button type="button" onClick={() => setPendingSets(hydrateFromLast())}>
                  Reset to last log
                </button>
              </div>
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
  canSubstitute: PropTypes.bool,
  dayKey: PropTypes.string,
  nextSlotId: PropTypes.string,
  onClearHistory: PropTypes.func,
  onDeleteHistoryEntry: PropTypes.func,
}

ExerciseCard.defaultProps = {
  displayName: undefined,
  subtitle: undefined,
  orderLabel: '',
  note: '',
  log: undefined,
  isOpen: false,
  onSubstitute: undefined,
  canSubstitute: false,
  dayKey: undefined,
  nextSlotId: undefined,
  onClearHistory: undefined,
  onDeleteHistoryEntry: undefined,
}

ExerciseCard.displayName = 'ExerciseCard'

export default ExerciseCard
