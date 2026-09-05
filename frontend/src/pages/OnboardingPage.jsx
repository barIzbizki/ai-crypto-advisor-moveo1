import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'

const ASSET_OPTIONS = [
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'altcoins', label: 'Altcoins' },
  { value: 'stablecoins', label: 'Stablecoins' },
  { value: 'defi', label: 'DeFi tokens' },
  { value: 'nfts', label: 'NFTs' },
]

const INVESTOR_TYPE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'long-term-holder', label: 'Long-term holder' },
  { value: 'active-trader', label: 'Active trader' },
  { value: 'institutional', label: 'Institutional' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: 'news', label: 'News' },
  { value: 'analysis', label: 'Market analysis' },
  { value: 'education', label: 'Educational content' },
  { value: 'alerts', label: 'Price alerts' },
]

function validate({ assetsOfInterest, investorType, contentTypes }) {
  const errors = {}

  if (assetsOfInterest.length === 0) {
    errors.assetsOfInterest = 'Select at least one asset of interest'
  }

  if (!investorType) {
    errors.investorType = 'Select an investor type'
  }

  if (contentTypes.length === 0) {
    errors.contentTypes = 'Select at least one content type'
  }

  return errors
}

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function OnboardingPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')
  const [form, setForm] = useState({ assetsOfInterest: [], investorType: '', contentTypes: [] })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    apiFetch('/preferences')
      .then(() => {
        if (!cancelled) {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch((error) => {
        if (cancelled) return
        setStatus('ready')
        if (error.status !== 404) {
          setFormError('Could not check your saved preferences. You can still fill out the quiz below.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('/preferences', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (error.body?.error?.fields) {
        setErrors(error.body.error.fields)
      } else {
        setFormError(error.message || 'Could not save your preferences. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'checking') {
    return (
      <section className="page page-centered">
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section className="page">
      <h1>Tell us about yourself</h1>
      <div className="card">
        <form onSubmit={handleSubmit} noValidate className="form">
          <fieldset className="field-group">
            <legend>Which crypto assets are you interested in?</legend>
            {ASSET_OPTIONS.map((option) => (
              <label key={option.value} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={form.assetsOfInterest.includes(option.value)}
                  onChange={() => setForm((prev) => ({
                    ...prev,
                    assetsOfInterest: toggleValue(prev.assetsOfInterest, option.value),
                  }))}
                />
                {option.label}
              </label>
            ))}
            {errors.assetsOfInterest && <p className="status-error">{errors.assetsOfInterest}</p>}
          </fieldset>

          <fieldset className="field-group">
            <legend>Which best describes you as an investor?</legend>
            {INVESTOR_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="checkbox-option">
                <input
                  type="radio"
                  name="investorType"
                  checked={form.investorType === option.value}
                  onChange={() => setForm((prev) => ({ ...prev, investorType: option.value }))}
                />
                {option.label}
              </label>
            ))}
            {errors.investorType && <p className="status-error">{errors.investorType}</p>}
          </fieldset>

          <fieldset className="field-group">
            <legend>What content are you interested in?</legend>
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={form.contentTypes.includes(option.value)}
                  onChange={() => setForm((prev) => ({
                    ...prev,
                    contentTypes: toggleValue(prev.contentTypes, option.value),
                  }))}
                />
                {option.label}
              </label>
            ))}
            {errors.contentTypes && <p className="status-error">{errors.contentTypes}</p>}
          </fieldset>

          {formError && <p className="status-error">{formError}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default OnboardingPage
