import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'

export default function NotFoundPage() {
  return (
    <PageShell title="Page not found" subtitle="The page you are looking for doesn’t exist.">
      <Link
        to="/"
        className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Back to Home
      </Link>
    </PageShell>
  )
}
