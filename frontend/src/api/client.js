const DEFAULT_BASE_URL = 'http://localhost:3000'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL

const AUTH_TOKEN_STORAGE_KEY = 'authToken'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken()
  const headers = { ...options.headers }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }

  return response.json()
}
