import MarketNewsSection from '../components/dashboard/MarketNewsSection'
import CoinPricesSection from '../components/dashboard/CoinPricesSection'
import AiInsightSection from '../components/dashboard/AiInsightSection'
import CryptoMemeSection from '../components/dashboard/CryptoMemeSection'

function DashboardPage() {
  return (
    <section className="page dashboard-page">
      <h1>Dashboard</h1>

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
