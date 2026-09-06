import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'

function CryptoMemeSection() {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    apiFetch('/dashboard/meme')
      .then((meme) => {
        if (!cancelled) {
          setState({ status: 'ready', meme })
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
      <h2>Fun Crypto Meme</h2>
      {state.status === 'loading' && <p className="dashboard-section-status">Loading meme...</p>}
      {state.status === 'error' && (
        <p className="status-error">Unable to load a meme right now: {state.message}</p>
      )}
      {state.status === 'ready' && (
        <figure className="crypto-meme">
          <img src={state.meme.imageUrl} alt={state.meme.caption} />
          <figcaption>{state.meme.caption}</figcaption>
        </figure>
      )}
    </section>
  )
}

export default CryptoMemeSection
