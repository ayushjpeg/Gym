const DEFAULT_BASE_URL = 'https://common-backend.ayux.in/api'
const stripTrailingSlash = (value) => value.replace(/\/$/, '')

const API_BASE_URL = stripTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL)
const API_KEY = import.meta.env.VITE_API_KEY || ''

const buildHeaders = (body, extraHeaders = {}) => {
  const headers = new Headers(extraHeaders)
  if (API_KEY) {
    headers.set('X-API-Key', API_KEY)
  }
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  return headers
}

const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    body,
    headers: buildHeaders(body, headers),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  const payload = await response.text()
  return payload ? JSON.parse(payload) : null
}

export const fetchGymBootstrap = () => request('/gym/bootstrap')

export const createExercise = (exercise) => request('/gym/exercises', {
  method: 'POST',
  body: JSON.stringify(exercise),
})

export const updateExercise = (exerciseId, exercise) => request(`/gym/exercises/${exerciseId}`, {
  method: 'PATCH',
  body: JSON.stringify(exercise),
})

export const deleteExercise = (exerciseId) => request(`/gym/exercises/${exerciseId}`, {
  method: 'DELETE',
})

export const logExerciseHistory = (entry) => request('/gym/history', {
  method: 'POST',
  body: JSON.stringify(entry),
})

export const deleteExerciseHistory = (historyId) => request(`/gym/history/${historyId}`, {
  method: 'DELETE',
})

export const fetchExerciseHistory = (exerciseId) => request(`/gym/history/${exerciseId}`)

export const updateAssignment = (assignmentId, payload) => request(`/gym/assignments/${assignmentId}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const substituteAssignment = (assignmentId) => request(`/gym/assignments/${assignmentId}/substitute`, {
  method: 'POST',
})
