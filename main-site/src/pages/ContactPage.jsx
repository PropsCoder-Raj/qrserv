import { useState } from 'react'
import PageShell from '../components/PageShell.jsx'
import { useContact } from '../context/ContactContext.jsx'
import { apiFetch } from '../services/api.js'

export default function ContactPage() {
  const { email, mobileNumber } = useContact()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: 'error', message: 'Please fill all fields.' })
      return
    }

    try {
      setLoading(true)
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      })
      setStatus({ type: 'success', message: 'Message sent successfully.' })
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Failed to send message.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell title="Contact Us" subtitle="We’ll get back to you as soon as possible.">
      {/* Decorative QR image (half visible / half off-screen) */}
      <img
        src="/img/QR_CODE_GREEN_HALF_1.png"
        alt="QR code"
        className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Support</div>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div>
              Email: <span className="font-medium">{email}</span>
            </div>
            <div>
              Phone: <span className="font-medium">{mobileNumber}</span>
            </div>
            <div>Business Hours: 10:00 AM – 7:00 PM (IST)</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Quick message</div>
          <p className="mt-2 text-sm text-slate-600">
            Send us a message and we’ll reply soon.
          </p>

          {status.message && (
            <div
              className={
                status.type === 'success'
                  ? 'mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
                  : 'mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
              }
            >
              {status.message}
            </div>
          )}

          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Your name"
              value={form.name}
              onChange={onChange('name')}
            />
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Email"
              value={form.email}
              onChange={onChange('email')}
            />
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Message"
              value={form.message}
              onChange={onChange('message')}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  )
}
