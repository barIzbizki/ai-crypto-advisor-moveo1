import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import MarketNewsSection from '../components/dashboard/MarketNewsSection'
import CoinPricesSection from '../components/dashboard/CoinPricesSection'
import AiInsightSection from '../components/dashboard/AiInsightSection'
import CryptoMemeSection from '../components/dashboard/CryptoMemeSection'

function DashboardPage() {
  const [health, setHealth] = useState({ state: 'loading' })

  useEffect(() => {
    let cancelled = false

    apiFetch('/health')
      .then((data) => {
        if (!cancelled) {
          setHealth({ state: 'healthy', data })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setHealth({ state: 'error', message: error.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="page">
      <h1>Dashboard</h1>
      <div className="card">
        <p>Backend status: {health.state === 'loading' && 'checking...'}</p>
        {health.state === 'healthy' && (
          <p data-testid="backend-status" className="status-ok">
            Backend is healthy ({health.data.status})
          </p>
        )}
        {health.state === 'error' && (
          <p data-testid="backend-status" className="status-error">
            Backend unreachable: {health.message}
          </p>
        )}
      </div>

      <MarketNewsSection />
      <CoinPricesSection />
      <AiInsightSection />
      <CryptoMemeSection />
    </section>
  )
}

export default DashboardPage
