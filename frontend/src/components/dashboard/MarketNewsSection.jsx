import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'

function MarketNewsSection() {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    apiFetch('/dashboard/news')
      .then(({ headlines }) => {
        if (!cancelled) {
          setState({ status: 'ready', headlines })
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
      <h2>Market News</h2>
      {state.status === 'loading' && <p className="dashboard-section-status">Loading headlines...</p>}
      {state.status === 'error' && (
        <p className="status-error">Unable to load market news: {state.message}</p>
      )}
      {state.status === 'ready' && state.headlines.length === 0 && (
        <p className="dashboard-section-status">No headlines available right now.</p>
      )}
      {state.status === 'ready' && state.headlines.length > 0 && (
        <ul className="headline-list">
          {state.headlines.map((headline, index) => (
            <li key={`${headline.url}-${index}`}>
              <a href={headline.url} target="_blank" rel="noreferrer">
                {headline.title}
              </a>
              <span className="headline-source"> — {headline.source}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MarketNewsSection
