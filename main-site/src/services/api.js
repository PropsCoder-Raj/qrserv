const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const SUBSCRIPTION_PLANS_API_KEY = import.meta.env.VITE_SUBSCRIPTION_PLANS_API_KEY || ''

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`

  const headers = new Headers(options.headers || {})

  // JSON defaults
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach API key if configured
  if (SUBSCRIPTION_PLANS_API_KEY) {
    headers.set('x-api-key', SUBSCRIPTION_PLANS_API_KEY)
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      message = data?.message || data?.error || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}
