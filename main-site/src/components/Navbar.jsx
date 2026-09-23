import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Container from './Container.jsx'
import Logo from './Logo.jsx'

const navLinkClass = ({ isActive }) =>
  [
    'block rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-brand text-white'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/subscriptions" className={navLinkClass}>
            Subscriptions
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
          <NavLink to="/privacy" className={navLinkClass}>
            Privacy
          </NavLink>
          <NavLink to="/terms" className={navLinkClass}>
            Terms
          </NavLink>
          <NavLink to="/refund" className={navLinkClass}>
            Refund
          </NavLink>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </Container>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <Container className="py-3">
            <div className="grid gap-2">
              <NavLink to="/" className={navLinkClass} end onClick={() => setOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/about" className={navLinkClass} onClick={() => setOpen(false)}>
                About Us
              </NavLink>
              <NavLink
                to="/subscriptions"
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                Subscriptions
              </NavLink>
              <NavLink
                to="/contact"
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                Contact
              </NavLink>
              <NavLink
                to="/privacy"
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                Privacy Policy
              </NavLink>
              <NavLink to="/terms" className={navLinkClass} onClick={() => setOpen(false)}>
                Terms & Conditions
              </NavLink>
              <NavLink to="/refund" className={navLinkClass} onClick={() => setOpen(false)}>
                Refund Policy
              </NavLink>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
