import { Link } from 'react-router-dom'
import Container from './Container.jsx'
import { useContact } from '../context/ContactContext.jsx'

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7h2.3l.4-3h-2.7V9.1c0-.9.3-1.6 1.6-1.6H16V4.9c-.4-.1-1.2-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7V11H8v3h2.3v7h3.2Z" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  )
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.56c0-1.05-.79-1.94-1.91-1.94c-1.12 0-1.91.89-1.91 1.94c0 1.03.77 1.93 1.87 1.93h.02c1.14 0 1.93-.9 1.93-1.93ZM20.44 13.02c0-3.48-1.86-5.1-4.35-5.1c-2 0-2.9 1.1-3.4 1.87V8.5H9.31c.04.85 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.13-.92c.27-.68.88-1.39 1.91-1.39c1.35 0 1.89 1.03 1.89 2.53V20H20v-6.98c0-.01 0-.01 0 0h.44Z" />
    </svg>
  )
}

export default function Footer() {
  const { email, emailHref, mobileNumber, mobileHref } = useContact()

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-200">
      <Container className="py-10 relative">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-sm font-semibold text-white">
              QR<span className="text-brand">serv</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              QR code ordering for restaurants — simple setup, faster service, happier customers.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Pages</div>
            <div className="mt-2 grid gap-2 text-sm">
              <Link className="text-slate-300 hover:text-white" to="/">
                Home
              </Link>
              <Link className="text-slate-300 hover:text-white" to="/about">
                About Us
              </Link>
              <Link className="text-slate-300 hover:text-white" to="/contact">
                Contact Us
              </Link>
              <Link className="text-slate-300 hover:text-white" to="/terms">
                Terms & Conditions
              </Link>
              <Link className="text-slate-300 hover:text-white" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="text-slate-300 hover:text-white" to="/refund">
                Refund Policy
              </Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Contact</div>
            <div className="mt-2 text-sm text-slate-300">
              <div>
                Email:{' '}
                <a className="font-medium hover:text-white" href={emailHref}>
                  {email}
                </a>
              </div>
              <div className="mt-1">
                Phone:{' '}
                <a className="font-medium hover:text-white" href={mobileHref}>
                  {mobileNumber}
                </a>
              </div>
              <div className="mt-1">Location: India</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Social</div>
            <div className="mt-3 flex items-center gap-3">
              <a
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-brand/40 hover:bg-brand/10 hover:text-white"
                href="https://www.facebook.com/profile.php?id=61587897532697"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-brand/40 hover:bg-brand/10 hover:text-white"
                href="https://www.instagram.com/qrservv?igsh=MW1qa2lpaHlrazhvYQ=="
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-brand/40 hover:bg-brand/10 hover:text-white"
                href="https://www.linkedin.com/company/qrserv-services/about/?viewAsMember=true"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <LinkedInIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-slate-400">
          © {new Date().getFullYear()} QRserv. All rights reserved.
        </div>
        {/* Decorative QR image (half visible / half off-screen) */}
        {/* <img
          src="/img/QR_CODE_WHITE_TOP.png"
          alt="QR code"
          className="pointer-events-none hidden w-[220px] absolute right-0 bottom-0 opacity-50 md:block"
        /> */}
      </Container>
    </footer>
  )
}
