import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setAuthToken } from '../api/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function validate({ name, email, password, confirmPassword }) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'Name is required'
  }

  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      })
      setAuthToken(data.token)
      navigate('/onboarding')
    } catch (error) {
      if (error.body?.error?.fields) {
        setErrors(error.body.error.fields)
      } else {
        setFormError(error.message || 'Signup failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h1>Signup</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            value={form.name}
            onChange={handleChange('name')}
          />
          {errors.name && <p className="status-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
          />
          {errors.email && <p className="status-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
          />
          {errors.password && <p className="status-error">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="signup-confirm-password">Confirm password</label>
          <input
            id="signup-confirm-password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
          />
          {errors.confirmPassword && <p className="status-error">{errors.confirmPassword}</p>}
        </div>

        {formError && <p className="status-error">{formError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
    </section>
  )
}

export default SignupPage
