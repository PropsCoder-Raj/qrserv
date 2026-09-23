import { useEffect, useMemo, useState } from 'react'
import Container from '../components/Container.jsx'
import { getSubscriptionPlans } from '../services/subscriptionService.js'

const SUBSCRIPTION_PLANS_STORAGE_KEY = 'qrserv_subscription_plans'

function readCachedPlans() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(SUBSCRIPTION_PLANS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCachedPlans(plans) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      SUBSCRIPTION_PLANS_STORAGE_KEY,
      JSON.stringify(Array.isArray(plans) ? plans : []),
    )
  } catch {
    // Ignore storage failures and continue with in-memory data.
  }
}

function formatCurrencyINR(amount) {
  const n = Number(amount)
  if (Number.isNaN(n)) return amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtLimit(n) {
  const v = Number(n)
  if (!v) return 'Unlimited'
  if (Number.isNaN(v)) return '—'
  return String(v)
}

function fmtCustomerData(value) {
  const v = String(value || 'none').toLowerCase()
  if (v === 'included') return 'included'
  if (v === 'optional') return 'optional'
  return 'none'
}

const ACCENTS = [
  {
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    glow: 'bg-emerald-300',
    border: 'hover:border-emerald-200',
    badge: 'bg-emerald-600 text-white',
  },
  {
    chip: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
    glow: 'bg-indigo-300',
    border: 'hover:border-indigo-200',
    badge: 'bg-indigo-600 text-white',
  },
  {
    chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
    glow: 'bg-amber-300',
    border: 'hover:border-amber-200',
    badge: 'bg-amber-600 text-white',
  },
  {
    chip: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-100',
    glow: 'bg-fuchsia-300',
    border: 'hover:border-fuchsia-200',
    badge: 'bg-fuchsia-600 text-white',
  },
  {
    chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100',
    glow: 'bg-cyan-300',
    border: 'hover:border-cyan-200',
    badge: 'bg-cyan-600 text-white',
  },
]

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState(() => readCachedPlans())
  const [loading, setLoading] = useState(() => readCachedPlans().length === 0)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const cachedPlans = readCachedPlans()

    if (cachedPlans.length > 0) {
      setPlans(cachedPlans)
      setLoading(false)
    }

    getSubscriptionPlans()
      .then((data) => {
        if (!mounted) return
        const nextPlans = Array.isArray(data.data) ? data.data : []
        setPlans(nextPlans)
        writeCachedPlans(nextPlans)
        setError('')
      })
      .catch((e) => {
        if (!mounted) return
        if (cachedPlans.length === 0) {
          setError(e?.message || 'Failed to load subscription plans')
        }
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const sorted = useMemo(() => {
    return [...plans].sort(
      (a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0),
    )
  }, [plans])

  return (
    <section className="bg-slate-50 relative">
      {/* Decorative QR image (half visible / half off-screen) */}
      <img
        src="/img/QR_CODE_GREEN_HALF_1.png"
        alt="QR code"
        className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
      />
      <Container className="py-10 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Subscription Plans
          </h1>
          <p className="mt-2 text-slate-600">
            Choose a plan that fits your restaurant. Contact us if you need a custom plan.
          </p>
        </div>

        <div className="mt-8">
          {loading && (
            <div className="qr-card p-6 text-sm text-slate-600">Loading plans…</div>
          )}

          {!loading && error && (
            <div className="qr-card border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && sorted.length === 0 && (
            <div className="qr-card p-6 text-sm text-slate-600">No plans found.</div>
          )}

          {!loading && !error && sorted.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((p, idx) => {
                const accent = ACCENTS[idx % ACCENTS.length]
                return (
                  <div
                    key={p?._id || p?.id || p?.name}
                    className={`qr-plan-card ${accent.border} qr-animate-fade-up`}
                    style={{ animationDelay: `${Math.min(idx * 80, 360)}ms` }}
                  >
                    <div className={`qr-plan-glow ${accent.glow}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-bold text-slate-900">{p?.name}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {p?.description || '—'}
                          </div>
                        </div>
                        <div className={`rounded-xl px-3 py-2 text-sm font-bold ${accent.chip}`}>
                          {formatCurrencyINR(p?.perMonthPriceAfterOffer || 0)}
                          <span className="ml-1 text-xs font-semibold text-brand/80">/mo</span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-700">
                        <div>
                          <span className="font-semibold">Duration:</span>{' '}
                          {p?.duration ? `${p.duration} days` : '—'}
                        </div>

                        <div>
                          <span className="font-semibold">Outlets:</span>{' '}
                          {fmtLimit(p?.maxRestaurants)}
                        </div>
                        <div>
                          <span className="font-semibold">Menu Items:</span>{' '}
                          {fmtLimit(p?.maxMenuItems)}
                        </div>
                        <div>
                          <span className="font-semibold">Categories:</span>{' '}
                          {fmtLimit(p?.maxCategories)}
                        </div>
                        <div>
                          <span className="font-semibold">Tables:</span> {fmtLimit(p?.maxTables)}
                        </div>
                        <div>
                          <span className="font-semibold">Customer Data:</span>{' '}
                          {`(${fmtCustomerData(p?.customerDataAccess)})`}
                        </div>

                        {p?.discountType && p?.discountType !== 'none' && (
                          <div>
                            <span className="font-semibold">Discount:</span>{' '}
                            {p.discountType === 'flat'
                              ? `${formatCurrencyINR(p.discountValue || 0)} off`
                              : `${p.discountValue || 0}% off`}
                          </div>
                        )}

                        {Array.isArray(p?.offers) && p.offers.length > 0 && (
                          <div>
                            <span className="font-semibold">Offers:</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {p.offers.map((o) => (
                                <span
                                  key={`${o?.months}-${o?.offerPercent}`}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${accent.chip}`}
                                >
                                  {o?.months} mo: {o?.offerPercent}%
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
