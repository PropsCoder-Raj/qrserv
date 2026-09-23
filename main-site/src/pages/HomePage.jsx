import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/Container.jsx'

function Feature({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
    </div>
  )
}

function Step({ number, title, children }) {
  return (
    <div className="qr-card p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand font-extrabold">
          {number}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-2 text-sm text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <div className="qr-card p-6">
      <div className="text-sm font-semibold text-slate-900">{q}</div>
      <div className="mt-2 text-sm text-slate-600">{a}</div>
    </div>
  )
}

export default function HomePage() {
  const adminPanelUrl =
    import.meta.env.VITE_ADMIN_PANEL_URL || 'http://localhost:5173'

  const slides_1 = [
    {
      image: '/img/Slide_1_1.webp',
      label: 'Smart Restaurant Management',
      description: 'Manage your restaurant smarter with the QRserv Dashboard.',
    },
    {
      image: '/img/Slide_1_2.webp',
      label: 'Restaurant Setup',
      description: 'Set up and manage restaurants for seamless QR ordering with QRserv.',
    },
    {
      image: '/img/Slide_1_3.webp',
      label: 'Menu Management',
      description: 'Create and update dishes for your digital menu with ease.',
    },
    {
      image: '/img/Slide_1_4.webp',
      label: 'Table Management',
      description: 'Manage table flow and customer ordering points efficiently.',
    },
    {
      image: '/img/Slide_1_5.webp',
      label: 'Order Tracking',
      description: 'Track and manage all customer orders in real time.',
    },
    {
      image: '/img/Slide_1_6.webp',
      label: 'Payments & Fulfillment',
      description: 'Monitor order status, payments, and fulfillment seamlessly.',
    },
    {
      image: '/img/Slide_1_7.webp',
      label: 'User & Role Management',
      description: 'Manage managers and staff access, roles, and permissions easily.',
    },
    {
      image: '/img/Slide_1_8.webp',
      label: 'Subscription Management',
      description: 'Manage subscription plans, pricing, and features in one place.',
    },
    {
      image: '/img/Slide_1_9.webp',
      label: 'QR Experience',
      description: 'Manage QR codes, staff access, and customer menu experience effortlessly.',
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedProductImage, setSelectedProductImage] = useState(null)
  const activeSlideData = slides_1[activeSlide]

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % slides_1.length)
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [slides_1.length])

  useEffect(() => {
    if (!selectedProductImage) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedProductImage(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedProductImage])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg_section">

        <Container className="py-14 sm:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="inline-flex items-center rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
                QRserv
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl text-white">
                QR Code Ordering System for Restaurants
              </h1>
              <p className="mt-4 text-base text-slate-600 sm:text-lg text-white">
                Digital menu, table QR, live ordering, and smoother operations — built for modern
                restaurants.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-slate-50"
                >
                  Book a Demo
                </Link>
                <Link
                  to="/privacy"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-transparent px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  View Privacy Policy
                </Link>
              </div>

              <div className="mt-6 text-xs text-white">
                By using this site you agree to our{' '}
                <Link className="underline" to="/terms">
                  Terms
                </Link>
                .
              </div>
            </div>

            <div className="qr-card rounded-3xl p-6">
              <img src='/img/qr_code_top_section.webp' loading="lazy" />
              {/* <div className="grid gap-4 sm:grid-cols-2">
                <Feature title="Digital Menu">
                  Show categories, items and prices on mobile in seconds.
                </Feature>
                <Feature title="Table QR">Scan QR at the table and start ordering instantly.</Feature>
                <Feature title="Live Orders">Orders flow to staff/kitchen with real-time status.</Feature>
                <Feature title="Faster Service">Reduce wait time and improve table turnover.</Feature>
              </div> */}
            </div>
          </div>
        </Container>
      </section>

      {/* <section className="relative h-screen h-[90vh] w-full overflow-hidden bg-slate-950">
          <div className="relative h-full w-full bg-slate-900">
            {slides_1.map((slide, index) => (
              <div
                key={slide}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === activeSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={slide}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover object-center blur-sm scale-105 opacity-35"
                />
                <img
                  src={slide}
                  alt={`QRserv dashboard slide ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-contain object-center"
                />
              </div>
            ))}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-slate-950/20" />

          <div className="absolute inset-x-0 bottom-0 px-4 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto flex w-full max-w-7xl items-end justify-between gap-4">
              <div className="text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  Product Preview
                </div>
                <div className="mt-1 text-sm sm:text-base">
                  QR ordering screens for menu, checkout, and live operations.
                </div>
              </div>

              <div className="flex items-center gap-2">
                {slides_1.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <section className="bg-slate-950 py-8 sm:py-12">
        <Container>
          <div className="mb-6 text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-center md:text-4xl">
              Run Your Restaurant Smarter with QRserv Dashboard
            </h2>
          </div>

          <div className="overflow-hidden rounded-[24px] bg-white/5 p-2 shadow-2xl ring-1 ring-white/10 sm:rounded-[32px] sm:p-3">
            <div className="relative h-[40vh] min-h-[360px] max-h-[720px] overflow-hidden rounded-[20px] bg-slate-900 sm:h-[72vh] sm:rounded-[24px] lg:aspect-[12/8] lg:h-auto">
              {slides_1.map((slide, index) => (
                <img
                  key={slide.image}
                  src={slide.image}
                  alt={`QRserv dashboard slide ${index + 1}`}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-contain object-top transition-opacity duration-700 sm:object-cover sm:object-center ${index === activeSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                />
              ))}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent px-3 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="max-w-xl text-white">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 sm:text-xs sm:tracking-[0.3em]">
                      {activeSlideData.label}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-white/90 sm:text-base">
                      {activeSlideData.description}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {slides_1.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => setActiveSlide(index)}
                        className={`h-2 rounded-full transition-all sm:h-2.5 ${index === activeSlide ? 'w-6 bg-white sm:w-8' : 'w-2 bg-white/40 hover:bg-white/70 sm:w-2.5'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(52,211,153,0.16),_transparent_34%),linear-gradient(180deg,_#f6fffb_0%,_#edf8f2_42%,_#ffffff_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-0 h-80 w-80 animate-pulse rounded-full bg-brand/20 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
          <div className="absolute right-[-8rem] top-16 h-80 w-80 animate-pulse rounded-full bg-amber-200/40 blur-3xl [animation-delay:700ms] sm:h-[30rem] sm:w-[30rem]" />
          <div className="absolute bottom-[-6rem] left-1/2 h-72 w-[26rem] -translate-x-1/2 animate-pulse rounded-full bg-emerald-200/35 blur-3xl [animation-delay:1400ms] sm:h-[24rem] sm:w-[44rem]" />
          <div className="absolute left-1/4 top-1/3 h-64 w-64 animate-pulse rounded-full bg-teal-200/20 blur-3xl [animation-delay:1000ms] sm:h-80 sm:w-80" />
        </div>

        <Container className="py-12 sm:py-16">
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Built for Both Restaurant Teams and Customers
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              QRserv connects front-of-house operations with a smooth customer ordering experience,
              so your team can work faster while guests order with less friction.
            </p>
          </div>

          <div className="relative mt-10 grid gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                  Manager & Staff
                </div>
                <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Control daily operations without slowing service
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                  View menus, manage orders, and update order status in real time from a single
                  dashboard built for restaurant teams.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <img
                  src="/img/Manager_Staff_controller.webp"
                  alt="QRserv manager and staff dashboard"
                  loading="lazy"
                  className="w-full rounded-[20px] border border-slate-200 bg-white object-contain shadow-sm"
                />

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Real-time order queue</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Monitor new, preparing, and completed orders as they move through service.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Menu control</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Update items, pricing, and availability quickly when stock or timing changes.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Status updates</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep customers informed by changing order progress instantly from the panel.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Smoother coordination</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Give staff a clear operational view so service stays fast during busy hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(16,185,129,0.14)] backdrop-blur">
              <div className="border-b border-slate-200 bg-gradient-to-br from-brand/95 via-brand to-emerald-700 p-6 text-white sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                  Customer App
                </div>
                <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Give guests a faster way to order and follow every step
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
                  Browse menu, manage cart, checkout, and track orders from a mobile-first ordering
                  flow that feels simple from scan to service.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <img
                  src="/img/Customer_App.webp"
                  alt="QRserv customer ordering app"
                  loading="lazy"
                  className="w-full rounded-[20px] border border-slate-200 bg-white object-contain shadow-sm"
                />

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Menu browsing made easy</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Guests can explore categories, open item details, and decide at their own pace.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Simple cart and checkout</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      The cart keeps quantities and selections clear, making checkout quick on mobile.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Live order visibility</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Customers can track order progress in real time instead of wondering what comes next.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-950 text-white">
        <Container className="py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                Physical Product
              </div>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                Premium Acrylic Double-Sided QR Code and NFC Enabled Stand
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                QRserv is not only a digital ordering platform. We also provide a premium table-side
                stand designed to make scanning and tap-to-open ordering fast, clean, and reliable
                inside real restaurant environments.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="text-sm font-semibold text-white">Double-sided visibility</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    The acrylic stand displays the QR clearly from both sides, making it easier for
                    guests seated across the table to scan without repositioning it.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="text-sm font-semibold text-white">NFC tap support</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Alongside QR scanning, NFC-enabled access gives customers another quick way to
                    open the menu with a simple tap on supported phones.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="text-sm font-semibold text-white">Premium restaurant finish</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Built with a polished acrylic look that feels more presentable on tables than
                    paper stickers or temporary printouts.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="text-sm font-semibold text-white">Practical for daily use</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    The format is compact, table-friendly, and easy to place across dine-in setups,
                    helping restaurants maintain a consistent ordering touchpoint.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2">
                  Table-ready design
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  QR scan access
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  NFC enabled
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Built for dine-in service
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedProductImage({
                    src: '/img/QR_CODE_1.webp',
                    alt: 'Premium acrylic QR and NFC stand front view',
                  })
                }
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-3 text-left shadow-2xl transition-transform duration-300 hover:scale-[1.01] sm:col-span-2"
              >
                <img
                  src="/img/QR_CODE_1.webp"
                  alt="Premium acrylic QR and NFC stand front view"
                  loading="lazy"
                  className="h-full w-full rounded-[22px] bg-white object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedProductImage({
                    src: '/img/QR_CODE_2.webp',
                    alt: 'Premium acrylic QR stand side view',
                  })
                }
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-3 text-left shadow-xl transition-transform duration-300 hover:scale-[1.01]"
              >
                <img
                  src="/img/QR_CODE_2.webp"
                  alt="Premium acrylic QR stand side view"
                  loading="lazy"
                  className="h-full w-full rounded-[22px] bg-white object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedProductImage({
                    src: '/img/QR_CODE_3.webp',
                    alt: 'Premium acrylic QR and NFC stand product detail',
                  })
                }
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-3 text-left shadow-xl transition-transform duration-300 hover:scale-[1.01]"
              >
                <img
                  src="/img/QR_CODE_3.webp"
                  alt="Premium acrylic QR and NFC stand product detail"
                  loading="lazy"
                  className="h-full w-full rounded-[22px] bg-white object-cover"
                />
              </button>
            </div>
          </div>
        </Container>
      </section>


      {/* How it works */}
      <section className="bg-white">
        <Container className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              How QRserv works
            </h2>
            <p className="mt-2 text-slate-600">
              A simple flow your customers will instantly understand.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Step number="1" title="Scan table QR">
              Customers scan the QR at the table to open the menu—no app required.
            </Step>
            <Step number="2" title="Browse & order">
              Customers add items to cart and place the order in seconds.
            </Step>
            <Step number="3" title="Prepare & serve">
              Staff/kitchen receive orders with live status updates for smooth operations.
            </Step>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="relative bg-slate-50">
        {/* Decorative QR image (half visible / half off-screen) */}
        <img
          src="/img/QR_CODE_GREEN_HALF_1.webp"
          alt="QR code"
          loading="lazy"
          className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
        />
        <Container className="py-12 sm:py-16">
          <div className="grid gap-8 md:grid-cols-2 md:items-start">
            <div className="qr-card p-7">
              <h3 className="text-lg font-bold text-slate-900">For restaurant owners</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• Reduce ordering mistakes with a clear digital flow</li>
                <li>• Faster table turnover and improved customer satisfaction</li>
                <li>• Easy menu updates (prices, availability, categories)</li>
                <li>• Better operational visibility</li>
              </ul>
            </div>

            <div className="qr-card p-7">
              <h3 className="text-lg font-bold text-slate-900">For customers & staff</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• Customers can order at their own pace</li>
                <li>• Staff can focus on service instead of taking orders</li>
                <li>• Clear order status for better transparency</li>
                <li>• Works great on mobile devices</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Subscription Plans teaser */}
      <section className="bg-white">

        <Container className="py-12 sm:py-16">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Flexible subscription plans
              </h2>
              <p className="mt-3 text-slate-600">
                Start small or scale to multiple outlets. Plans include limits for outlets, menu items,
                categories, and tables — so you always know what you’re getting.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/subscriptions"
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  View Subscription Plans
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>

            <div className="qr-card p-7 bg-gradient-to-br from-white to-brand/5">
              <div className="text-sm font-semibold text-slate-900">What’s included</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• Outlet limits (single to multi-branch)</li>
                <li>• Menu items & categories limits</li>
                <li>• Tables (QR codes) capacity</li>
                <li>• Customer data access (none / optional / included)</li>
              </ul>
              <div className="mt-5 text-xs text-slate-500">
                See full plan breakdown on the subscriptions page.
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-950 text-white">
        <Container className="py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Admin Access
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Open the QRserv admin control panel
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Restaurant owners, managers, and admin teams can use the control panel
                to manage restaurants, menus, tables, subscriptions, orders, and team access.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={adminPanelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Open Admin Panel
                </a>
                <a
                  href={adminPanelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Access Control URL
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-6">
                <div className="text-sm font-semibold text-emerald-300">Control panel URL</div>
                <div className="mt-3 break-all rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white/90">
                  {adminPanelUrl}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">Operations</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Manage orders, menus, tables, restaurant setup, and staff access.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">Business control</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Review subscriptions, organization settings, QR flows, and reporting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-white">

        {/* Decorative QR image (half visible / half off-screen) */}
        <img
          src="/img/QR_CODE_GREEN_HALF_1.webp"
          alt="QR code"
          loading="lazy"
          className="pointer-events-none absolute left-0 hidden w-[220px] opacity-20 md:block rotate-180"
        />
        <Container className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">FAQ</h2>
            <p className="mt-2 text-slate-600">Common questions about QRserv.</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <FaqItem
              q="Do customers need to install an app?"
              a="No. Customers can scan the QR and use the web menu directly on their phone."
            />
            <FaqItem
              q="Can I update my menu anytime?"
              a="Yes. You can update items, prices, categories, and availability whenever needed."
            />
            <FaqItem
              q="Is it mobile responsive?"
              a="Yes. The website and menu experience are built mobile-first and work on all screen sizes."
            />
            <FaqItem
              q="How can I contact support?"
              a="Use the Contact Us page and we’ll help you with setup and onboarding."
            />
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg_section">
        <Container className="py-12">
          <div className="qr-card bg-white/10 border-white/20 text-white p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-black">Ready to launch QR ordering?</h2>
                <p className="mt-2 text-black">
                  Tell us about your restaurant and we’ll help you get started.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-brand/100 px-6 py-3 text-sm font-semibold text-brand hover:bg-slate-50"
                >
                  Contact Us
                </Link>
                <Link
                  to="/terms"
                  className="inline-flex items-center justify-center rounded-xl border border-brand/100 bg-transparent px-6 py-3 text-sm font-semibold text-brand hover:bg-white/10"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {selectedProductImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProductImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedProductImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
            <img
              src={selectedProductImage.src}
              alt={selectedProductImage.alt}
              loading="lazy"
              className="max-h-[90vh] w-full rounded-[24px] bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
