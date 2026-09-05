import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch, setAuthToken } from '../api/client'

function validate({ email, password }) {
  const errors = {}

  if (!email.trim()) {
    errors.email = 'Email is required'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return errors
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

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
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      })
      setAuthToken(data.token)
      const destination = location.state?.from || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      if (error.body?.error?.fields) {
        setErrors(error.body.error.fields)
      } else {
        setFormError(error.message || 'Invalid email or password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
          />
          {errors.email && <p className="status-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
          />
          {errors.password && <p className="status-error">{errors.password}</p>}
        </div>

        {formError && <p className="status-error">{formError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </section>
  )
}

export default LoginPage
