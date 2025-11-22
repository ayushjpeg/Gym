import { useEffect, useState } from 'react'

export const usePersistentState = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage key ${key}`, error)
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to persist localStorage key ${key}`, error)
    }
  }, [key, value])

  return [value, setValue]
}
