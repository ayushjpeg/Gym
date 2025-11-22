import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const AICoachPanel = ({ selectedDay, logs, onResetDay }) => {
  const [tipSeed, setTipSeed] = useState(Date.now())

  const actionableTips = useMemo(() => {
    const tips = []
    const bench = logs.bench_press_barbell
    if (bench?.lastSession?.length) {
      const topSet = bench.lastSession[bench.lastSession.length - 1]
      if (typeof topSet.weight === 'number' && topSet.weight >= 55) {
        tips.push('Bench top set is climbing nicely—consider pausing on the chest for extra stability work this week.')
      } else {
        tips.push('Bench is still building—stick to 3-second eccentrics and micro-load by 1.25 kg plates next upper session.')
      }
    }
    const squat = logs.barbell_squat
    if (squat?.lastSession?.length) {
      const depthNote = pickRandom([
        'Film one angle to ensure hip crease passes knee—Jeff’s squat cue for consistent depth.',
        'Use the warm-up to practice bracing + breathing before the working sets.',
      ])
      tips.push(depthNote)
    }
    if (!tips.length) {
      tips.push('Log a few lifts to unlock smarter guidance. The AI slot will summarize fatigue, RIR, and tweak volumes.')
    }
    return tips
  }, [logs, tipSeed])

  return (
    <section className="ai-panel">
      <header>
        <h3>AI Coach Placeholder</h3>
        <p>
          Future upgrade: plug in your preferred AI (OpenAI, local LLM, etc.) to auto-adjust sets, RPE, and accessories for
          {selectedDay}.
        </p>
      </header>
      <div className="ai-panel__tips">
        {actionableTips.map((tip) => (
          <p key={tip}>{tip}</p>
        ))}
      </div>
      <div className="ai-panel__actions">
        <button type="button" onClick={() => { setTipSeed(Date.now()) }}>
          Generate smart tweak
        </button>
        {onResetDay ? (
          <button type="button" className="ghost" onClick={onResetDay}>
            Reset today to defaults
          </button>
        ) : null}
      </div>
      <footer>
        <p>
          API hook idea: send last-session data + recovery score → receive updated set targets. You already have the data model
          ready, so wiring an AI agent later will be straightforward.
        </p>
      </footer>
    </section>
  )
}

AICoachPanel.propTypes = {
  selectedDay: PropTypes.string.isRequired,
  logs: PropTypes.object.isRequired,
  onResetDay: PropTypes.func,
}

AICoachPanel.defaultProps = {
  onResetDay: undefined,
}

export default AICoachPanel
