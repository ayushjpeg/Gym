import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const emptyRun = {
  distance: '',
  duration: '',
  calories: '',
  notes: '',
}

const CardioTracker = ({ dayKey, plan, entries, onAddRun, selectedDate, isFutureDate, isToday }) => {
  const [run, setRun] = useState(emptyRun)

  const summary = useMemo(() => {
    if (!entries.length) {
      return { runs: 0, distance: 0, calories: 0, avgPace: 0 }
    }
    const totals = entries.reduce(
      (acc, current) => {
        acc.distance += Number(current.distance) || 0
        acc.calories += Number(current.calories) || 0
        acc.duration += Number(current.duration) || 0
        return acc
      },
      { runs: entries.length, distance: 0, calories: 0, duration: 0 },
    )
    return {
      ...totals,
      avgPace: totals.distance ? totals.duration / totals.distance : 0,
    }
  }, [entries])

  const entriesForDate = useMemo(() => entries.filter((entry) => entry.date === selectedDate), [entries, selectedDate])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!run.distance || !run.duration || isFutureDate) return
    onAddRun(dayKey, {
      ...run,
      date: selectedDate,
      pace: (Number(run.duration) / Number(run.distance)).toFixed(2),
    }, selectedDate)
    setRun(emptyRun)
  }

  return (
    <section className="cardio-panel">
      <header>
        <h2>{plan.label} · {plan.theme}</h2>
        <p>{plan.cardioPlan?.suggestions}</p>
      </header>
      <div className="cardio-summary">
        <div>
          <span>Total runs</span>
          <strong>{summary.runs}</strong>
        </div>
        <div>
          <span>Distance (km)</span>
          <strong>{summary.distance.toFixed(1)}</strong>
        </div>
        <div>
          <span>Calories</span>
          <strong>{summary.calories.toFixed(0)}</strong>
        </div>
        <div>
          <span>Avg pace (min/km)</span>
          <strong>{summary.avgPace ? summary.avgPace.toFixed(2) : '—'}</strong>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="cardio-form">
        <input
          type="number"
          step="0.1"
          placeholder="Distance (km)"
          value={run.distance}
          onChange={(event) => setRun((prev) => ({ ...prev, distance: event.target.value }))}
        />
        <input
          type="number"
          step="0.1"
          placeholder="Duration (min)"
          value={run.duration}
          onChange={(event) => setRun((prev) => ({ ...prev, duration: event.target.value }))}
        />
        <input
          type="number"
          placeholder="Calories"
          value={run.calories}
          onChange={(event) => setRun((prev) => ({ ...prev, calories: event.target.value }))}
        />
        <textarea
          placeholder="Surface, effort, weather, pacing notes"
          value={run.notes}
          onChange={(event) => setRun((prev) => ({ ...prev, notes: event.target.value }))}
        />
        <button type="submit" disabled={isFutureDate}>
          {isToday ? 'Log' : 'Update'}
        </button>
      </form>
      {isFutureDate ? (
        <p className="muted">Logging unlocks on {selectedDate}. Plan your run ahead!</p>
      ) : null}

      <div className="cardio-date-log">
        <h3>{selectedDate}</h3>
        {entriesForDate.length ? (
          <ul>
            {entriesForDate.map((entry) => (
                <li key={`${entry.id}-${entry.date}`}>
                  <div>
                    <strong>{entry.date}</strong>
                    <span>{Number(entry.distance).toFixed(1)} km in {entry.duration} min</span>
                  </div>
                  <div>
                    <span>{entry.calories || 0} kcal</span>
                    <span>{entry.pace} min/km</span>
                  </div>
                  {entry.notes ? <p>{entry.notes}</p> : null}
                </li>
              ))}
          </ul>
        ) : (
          <p className="cardio-empty">No run logged for this date yet.</p>
        )}
      </div>

      {entries.length ? (
        <div className="cardio-log">
          <h3>Recent runs</h3>
          <ul>
            {entries.map((entry) => (
              <li key={`${entry.date}-${entry.pace}`}>
                <div>
                  <strong>{entry.date}</strong>
                  <span>{Number(entry.distance).toFixed(1)} km in {entry.duration} min</span>
                </div>
                <div>
                  <span>{entry.calories || 0} kcal</span>
                  <span>{entry.pace} min/km</span>
                </div>
                {entry.notes ? <p>{entry.notes}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="cardio-empty">No runs logged yet. Lace up and record the first one!</p>
      )}
    </section>
  )
}

CardioTracker.propTypes = {
  dayKey: PropTypes.string.isRequired,
  plan: PropTypes.shape({
    label: PropTypes.string,
    theme: PropTypes.string,
    cardioPlan: PropTypes.shape({
      suggestions: PropTypes.string,
    }),
  }).isRequired,
  entries: PropTypes.arrayOf(PropTypes.object),
  onAddRun: PropTypes.func.isRequired,
  selectedDate: PropTypes.string.isRequired,
  isFutureDate: PropTypes.bool,
  isToday: PropTypes.bool,
}

CardioTracker.defaultProps = {
  entries: [],
  isFutureDate: false,
  isToday: false,
}

export default CardioTracker
