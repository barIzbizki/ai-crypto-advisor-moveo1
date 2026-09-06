import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'
import VoteControl from './VoteControl'

function AiInsightSection() {
  const [state, setState] = useState({ status: 'loading' })
  const todayIsoDate = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let cancelled = false

    apiFetch('/dashboard/insight')
      .then(({ insight }) => {
        if (!cancelled) {
          setState({ status: 'ready', insight })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ status: 'error', message: error.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="card dashboard-section">
      <div className="dashboard-section-header">
        <h2>AI Insight of the Day</h2>
        <VoteControl target={`insight:${todayIsoDate}`} />
      </div>
      {state.status === 'loading' && <p className="dashboard-section-status">Generating today's insight...</p>}
      {state.status === 'error' && (
        <p className="status-error">Unable to load today's insight: {state.message}</p>
      )}
      {state.status === 'ready' && <p className="ai-insight-text">{state.insight.text}</p>}
    </section>
  )
}

export default AiInsightSection
