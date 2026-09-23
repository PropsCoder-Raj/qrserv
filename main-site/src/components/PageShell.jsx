import Container from './Container.jsx'

export default function PageShell({ title, subtitle, children }) {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="qr-card overflow-hidden">
          <div className="bg-gradient-to-r from-brand/10 via-white to-amber-50 px-6 py-6 sm:px-8">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
              {subtitle ? <p className="mt-2 text-slate-600">{subtitle}</p> : null}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {children}
          </div>
        </div>
      </Container>
    </div>
  )
}
