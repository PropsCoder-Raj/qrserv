import { apiFetch } from './api.js'

export function getSubscriptionPlans() {
  // API KEY protected endpoint (Public + x-api-key)
  return apiFetch('/api/subscriptions/public/plans')
}
