import PropTypes from 'prop-types'
import clsx from 'clsx'

const DayPicker = ({ template, selectedDay, onSelect }) => (
  <div className="day-picker">
    {Object.entries(template).map(([key, config]) => (
      <button
        key={key}
        type="button"
        className={clsx('day-pill', {
          active: key === selectedDay,
          cardio: config.cardio,
          rest: !config.cardio && !config.exerciseOrder,
        })}
        onClick={() => onSelect(key)}
      >
        <span className="day-pill__label">{config.label}</span>
        <span className="day-pill__theme">{config.theme}</span>
      </button>
    ))}
  </div>
)

DayPicker.propTypes = {
  template: PropTypes.object.isRequired,
  selectedDay: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
}

export default DayPicker
