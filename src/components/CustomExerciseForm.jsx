import { useState } from 'react'
import PropTypes from 'prop-types'

const defaultForm = {
  name: '',
  equipment: '',
  muscle: '',
  weight: '',
  reps: '',
  notes: '',
}

const CustomExerciseForm = ({ dayKey, onAdd }) => {
  const [form, setForm] = useState(defaultForm)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.name) return
    const exercise = {
      id: `custom-${dayKey}-${Date.now()}`,
      name: form.name,
      equipment: form.equipment || 'Bodyweight / gym floor',
      muscleGroups: form.muscle ? [form.muscle] : ['Custom'],
      lastSession: form.weight && form.reps ? [{ set: 1, weight: form.weight, reps: Number(form.reps) }] : [],
      restSeconds: 90,
      cues: form.notes ? [form.notes] : ['Keep form tight.'],
      mistakes: ['Rushing tempo'],
      targetNotes: 'Adjust load based on how you feel today.',
      swapSuggestions: [],
    }
    onAdd(dayKey, exercise)
    setForm(defaultForm)
  }

  return (
    <form className="custom-form" onSubmit={handleSubmit}>
      <h4>Add a custom exercise</h4>
      <div className="form-grid">
        <input
          type="text"
          placeholder="Exercise name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Equipment"
          value={form.equipment}
          onChange={(event) => setForm((prev) => ({ ...prev, equipment: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Primary muscle"
          value={form.muscle}
          onChange={(event) => setForm((prev) => ({ ...prev, muscle: event.target.value }))}
        />
        <input
          type="number"
          placeholder="Weight / load"
          value={form.weight}
          onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
        />
        <input
          type="number"
          placeholder="Reps"
          value={form.reps}
          onChange={(event) => setForm((prev) => ({ ...prev, reps: event.target.value }))}
        />
      </div>
      <textarea
        placeholder="Coaching notes or common mistakes"
        value={form.notes}
        onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
      />
      <button type="submit">Add to this day</button>
    </form>
  )
}

CustomExerciseForm.propTypes = {
  dayKey: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
}

export default CustomExerciseForm
