import PropTypes from 'prop-types'
import clsx from 'clsx'

const parseTargetRange = (rangeText) => {
  const match = rangeText.match(/(\d+)\D+(\d+)/)
  if (!match) return { low: 0, high: 0 }
  return { low: Number(match[1]), high: Number(match[2]) }
}

const formatDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
}

const statusCopy = {
  complete: 'Complete',
  'in-progress': 'In progress',
  pending: 'Pending',
}

const WeekSummary = ({ template, totals, targets, overview, weekKey }) => {
  const byDay = overview?.byDay || {}
  return (
    <section className="week-summary">
      <div className="week-summary__top">
        <div>
          <p className="week-summary__week-label">Week {weekKey}</p>
          <h3>Weekly muscle set targets (Jeff Nippard)</h3>
        </div>
        <div className="week-summary__stat-block">
          <div>
            <span>Strength days logged</span>
            <strong>
              {overview?.strengthDaysDone || 0}
              {' / '}
              {overview?.strengthDaysTotal || 0}
            </strong>
          </div>
          <div>
            <span>Runs logged</span>
            <strong>
              {overview?.cardioRunsTarget
                ? `${overview.cardioRunsLogged || 0} / ${overview.cardioRunsTarget}`
                : overview?.cardioRunsLogged || 0}
            </strong>
          </div>
        </div>
      </div>

      <div className="week-summary__totals">
        <ul>
          {Object.entries(targets).map(([muscle, range]) => {
            const actual = totals[muscle] || 0
            const parsedRange = typeof range === 'string' ? parseTargetRange(range) : range || { low: 0, high: 0 }
            const { low, high } = parsedRange
            const pct = high ? Math.min(100, Math.round((actual / high) * 100)) : 0
            const status = actual >= low && actual <= high ? 'on-target' : actual < low ? 'low' : 'high'
            const targetCopy = high ? `${low}–${high}` : `${low}+`
            return (
              <li key={muscle} className={clsx('muscle-row', status)}>
                <span className="label">{muscle}</span>
                <div className="bar">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <span className="value">
                  {actual} sets · target {targetCopy}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="week-summary__schedule">
        <h3>Week at a glance</h3>
        <div className="week-card-grid">
          {Object.entries(template).map(([dayKey, config]) => {
            const day = byDay[dayKey] || {
              type: config.cardio ? 'cardio' : config.exerciseOrder?.length ? 'strength' : 'rest',
              label: config.label,
              theme: config.theme,
              description: config.description,
              status: 'pending',
              totalSlots: config.exerciseOrder?.length || 0,
              completedSlots: 0,
              completionPct: 0,
              completedNames: [],
              remainingNames: config.exerciseOrder?.map((slot) => slot.name) || [],
              runsLogged: 0,
              targetRuns: config.cardioPlan?.targetRuns || 0,
              entries: [],
            }
            const statusLabel = statusCopy[day.status]
            const lastLoggedDisplay = formatDate(day.lastLoggedOn)

            return (
              <article key={dayKey} className={clsx('week-card', day.type, day.status && `status-${day.status}`)}>
                <header>
                  <div>
                    <span>{day.label}</span>
                    <strong>{day.theme}</strong>
                  </div>
                  {statusLabel ? <span className="status-chip">{statusLabel}</span> : null}
                </header>
                <p className="week-card__description">{day.description}</p>
                {lastLoggedDisplay ? <p className="week-card__meta">Last logged {lastLoggedDisplay}</p> : null}

                {day.type === 'strength' ? (
                  <>
                    <div className="progress-bar">
                      <span style={{ width: `${day.completionPct || 0}%` }} />
                    </div>
                    <p className="progress-copy">
                      {day.completedSlots || 0}
                      {' / '}
                      {day.totalSlots || 0} lifts logged
                    </p>
                    <div className="week-card__list">
                      <span>{day.completedNames?.length ? 'Logged' : 'Up next'}</span>
                      <ul>
                        {(day.completedNames?.length ? day.completedNames : day.remainingNames || [])
                          .slice(0, 3)
                          .map((name) => (
                            <li key={`${dayKey}-${name}`}>{name}</li>
                          ))}
                      </ul>
                    </div>
                  </>
                ) : null}

                {day.type === 'cardio' ? (
                  <>
                    <p className="progress-copy">
                      {day.runsLogged}
                      {day.targetRuns ? ` / ${day.targetRuns}` : ''}
                      {' '}runs logged
                    </p>
                    {day.entries?.length ? (
                      <ul className="week-card__runs">
                        {day.entries.map((entry) => (
                          <li key={`${entry.date}-${entry.distance}-${entry.duration}`}>
                            <span>{entry.date}</span>
                            <span>{Number(entry.distance || 0).toFixed(1)} km · {entry.duration} min</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">Log your next run to unlock cardio stats.</p>
                    )}
                  </>
                ) : null}

                {day.type === 'rest' ? (
                  <p className="rest-note">Recovery focus—walks, mobility, and sleep hygiene.</p>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

WeekSummary.propTypes = {
  template: PropTypes.object.isRequired,
  totals: PropTypes.object.isRequired,
  targets: PropTypes.object.isRequired,
  overview: PropTypes.shape({
    byDay: PropTypes.object,
    strengthDaysDone: PropTypes.number,
    strengthDaysTotal: PropTypes.number,
    cardioRunsLogged: PropTypes.number,
    cardioRunsTarget: PropTypes.number,
  }).isRequired,
  weekKey: PropTypes.string.isRequired,
}

export default WeekSummary
