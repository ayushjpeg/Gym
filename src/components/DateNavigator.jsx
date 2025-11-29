import PropTypes from 'prop-types'

const DateNavigator = ({ value, onChange, onShift, onReset, displayLabel }) => {
  const handleShift = (delta) => {
    if (typeof onShift === 'function') {
      onShift(delta)
    }
  }

  return (
    <div className="date-navigator">
      <div className="date-navigator__controls">
        <button type="button" className="ghost" onClick={() => handleShift(-1)} aria-label="Previous day">
          ◀
        </button>
        <input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button" className="ghost" onClick={() => handleShift(1)} aria-label="Next day">
          ▶
        </button>
        <button type="button" className="ghost" onClick={onReset}>
          Today
        </button>
      </div>
      <p className="date-navigator__label">{displayLabel}</p>
    </div>
  )
}

DateNavigator.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onShift: PropTypes.func,
  onReset: PropTypes.func,
  displayLabel: PropTypes.string,
}

DateNavigator.defaultProps = {
  onShift: undefined,
  onReset: undefined,
  displayLabel: '',
}

export default DateNavigator
