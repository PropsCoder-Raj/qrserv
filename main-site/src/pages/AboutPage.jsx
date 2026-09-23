import PageShell from '../components/PageShell.jsx'
import { useContact } from '../context/ContactContext.jsx'

export default function AboutPage() {
  const { email, mobileNumber } = useContact()

  return (
    <PageShell
      title="About Us"
      subtitle="Building a simpler QR ordering experience for restaurants and their customers."
    >
      <img
        src="/img/QR_CODE_GREEN_HALF_1.png"
        alt="QR code"
        className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
      />

      <div className="prose prose-slate max-w-3xl">
        <p className="mb-3">
          <strong>QRserv</strong> helps restaurants move from traditional ordering to a
          faster and more reliable QR-based workflow.
        </p>

        <p className="mb-3">
          Our platform is designed to make menu discovery, ordering, and service
          smoother for everyone involved. Customers get a simple mobile ordering
          experience, while restaurant teams get a clearer operational flow.
        </p>

        <h2 className="mt-10 text-xl font-bold">What We Do</h2>
        <ul className="list-disc">
          <li>Digital menus that are easy to browse on mobile</li>
          <li>QR code ordering for tables and dine-in experiences</li>
          <li>Faster order handling for restaurant teams</li>
          <li>Flexible tools that support growing restaurant operations</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">Our Focus</h2>
        <p className="mb-3">
          We focus on practical software that restaurants can use without complex
          setup or heavy training. The goal is simple: reduce friction, improve
          service speed, and create a better ordering experience.
        </p>

        <h2 className="mt-10 text-xl font-bold">Why QRserv</h2>
        <p className="mb-3">
          Restaurants need tools that are dependable, easy to manage, and ready
          for real day-to-day operations. QRserv is built around those needs with
          a straightforward product approach.
        </p>

        <h2 className="mt-10 text-xl font-bold">Contact</h2>
        <p className="mb-3">
          If you want to learn more about our platform or discuss your restaurant
          setup, contact us at <strong>{email}</strong> or call
          <strong> {mobileNumber}</strong>.
        </p>
      </div>
    </PageShell>
  )
}
