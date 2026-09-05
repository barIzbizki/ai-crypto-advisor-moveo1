import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'

function formatPrice(price) {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function CoinPricesSection() {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    apiFetch('/dashboard/prices')
      .then(({ prices }) => {
        if (!cancelled) {
          setState({ status: 'ready', prices })
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
      <h2>Coin Prices</h2>
      {state.status === 'loading' && <p className="dashboard-section-status">Loading prices...</p>}
      {state.status === 'error' && (
        <p className="status-error">Coin prices are currently unavailable: {state.message}</p>
      )}
      {state.status === 'ready' && state.prices.length === 0 && (
        <p className="dashboard-section-status">No prices available right now.</p>
      )}
      {state.status === 'ready' && state.prices.length > 0 && (
        <ul className="price-list">
          {state.prices.map((coin) => (
            <li key={coin.id}>
              <span className="price-symbol">{coin.symbol}</span>
              <span className="price-value">{formatPrice(coin.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default CoinPricesSection
