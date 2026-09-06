import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import MarketNewsSection from '../components/dashboard/MarketNewsSection'
import CoinPricesSection from '../components/dashboard/CoinPricesSection'
import AiInsightSection from '../components/dashboard/AiInsightSection'
import CryptoMemeSection from '../components/dashboard/CryptoMemeSection'

function DashboardPage() {
  const [userName, setUserName] = useState(null)

  useEffect(() => {
    let cancelled = false

    apiFetch('/auth/me')
      .then(({ user }) => {
        if (!cancelled) {
          setUserName(user.name)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="page dashboard-page">
      <header className="dashboard-header">
        <h1>AI Crypto Advisor</h1>
        {userName && <p className="dashboard-greeting">Hello, {userName}</p>}
      </header>

      <div className="dashboard-grid">
        <MarketNewsSection />
        <CoinPricesSection />
        <AiInsightSection />
        <CryptoMemeSection />
      </div>
    </section>
  )
}

export default DashboardPage
