import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const RestTimer = ({ seconds }) => {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let interval
    if (running) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setRunning(false)
            return seconds
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [running, seconds])

  useEffect(() => {
    setTimeLeft(seconds)
  }, [seconds])

  return (
    <div className="rest-timer">
      <span>{formatTime(timeLeft)}</span>
      <div className="rest-timer__actions">
        <button type="button" onClick={() => { setTimeLeft(seconds); setRunning(true) }}>
          Start
        </button>
        <button type="button" onClick={() => setRunning(false)}>Pause</button>
        <button type="button" onClick={() => { setRunning(false); setTimeLeft(seconds) }}>
          Reset
        </button>
      </div>
    </div>
  )
}

RestTimer.propTypes = {
  seconds: PropTypes.number,
}

RestTimer.defaultProps = {
  seconds: 90,
}

export default RestTimer
