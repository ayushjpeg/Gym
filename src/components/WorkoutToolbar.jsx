import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const WorkoutToolbar = ({
  dayKey,
  activeCount,
  availableSlots,
  onAddSlot,
  onResetDay,
}) => {
  const [selectedSlot, setSelectedSlot] = useState(availableSlots[0]?.slotId || '')

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedSlot('')
      return
    }
    setSelectedSlot((prev) => (availableSlots.some((slot) => slot.slotId === prev)
      ? prev
      : availableSlots[0].slotId))
  }, [availableSlots])

  const handleAdd = () => {
    if (!selectedSlot) return
    onAddSlot(dayKey, selectedSlot)
  }

  return (
    <div className="workout-toolbar">
      <div>
        <span className="label">Selected today</span>
        <strong>{activeCount}</strong>
      </div>
      <div className="workout-toolbar__actions">
        <select
          value={selectedSlot}
          onChange={(event) => setSelectedSlot(event.target.value)}
          disabled={!availableSlots.length}
        >
          {!availableSlots.length ? (
            <option value="">No workouts left to add</option>
          ) : (
            availableSlots.map((slot) => (
              <option key={slot.slotId} value={slot.slotId}>
                {slot.name}
              </option>
            ))
          )}
        </select>
        <button type="button" onClick={handleAdd} disabled={!selectedSlot}>
          Add workout
        </button>
        <button type="button" className="ghost" onClick={() => onResetDay(dayKey)}>
          Reset day
        </button>
      </div>
    </div>
  )
}

WorkoutToolbar.propTypes = {
  dayKey: PropTypes.string.isRequired,
  activeCount: PropTypes.number.isRequired,
  availableSlots: PropTypes.arrayOf(
    PropTypes.shape({
      slotId: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ).isRequired,
  onAddSlot: PropTypes.func.isRequired,
  onResetDay: PropTypes.func.isRequired,
}

export default WorkoutToolbar
