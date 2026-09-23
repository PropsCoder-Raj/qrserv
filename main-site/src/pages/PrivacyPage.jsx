import PageShell from '../components/PageShell.jsx'
import { useContact } from '../context/ContactContext.jsx'

export default function PrivacyPage() {
  const { email, mobileNumber } = useContact()

  return (
    <PageShell title="Privacy Policy" subtitle="How we collect and use information.">
      {/* Decorative QR image (half visible / half off-screen) */}
      <img
        src="/img/QR_CODE_GREEN_HALF_1.png"
        alt="QR code"
        className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
      />
      <div className="prose prose-slate max-w-3xl">
        <p className='mb-3'><strong>Last Updated:</strong> 11 March 2026</p>

        <p className='mb-3'>
          This Privacy Policy describes how <strong>QRserv</strong> collects, uses,
          and protects information when you use our POS platform and website.
        </p>

        <h2 className='text-xl font-bold mt-10'>Information We Collect</h2>

        <h3 className='text-md font-bold mt-3'>Personal Information</h3>
        <ul className='list-disc'>
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Business details</li>
        </ul>

        <h3 className='text-md font-bold mt-3'>Business Data</h3>
        <ul className='list-disc'>
          <li>Menu items</li>
          <li>Orders and transactions</li>
          <li>Customer details</li>
          <li>Restaurant analytics</li>
        </ul>

        <h3 className='text-md font-bold mt-3'>Technical Information</h3>
        <ul className='list-disc'>
          <li>IP address</li>
          <li>Device information</li>
          <li>Browser type</li>
          <li>Usage logs</li>
        </ul>

        <h2 className='text-xl font-bold mt-10'>How We Use Information</h2>
        <p className='mb-3'>We use collected information to:</p>
        <ul className='list-disc'>
          <li>Provide POS services</li>
          <li>Process transactions</li>
          <li>Improve platform functionality</li>
          <li>Provide customer support</li>
          <li>Send service updates and notifications</li>
        </ul>

        <h2 className='text-xl font-bold mt-10'>Data Security</h2>
        <p className='mb-3'>
          We implement industry-standard security measures to protect data from
          unauthorized access, alteration, or disclosure.
        </p>
        <p className='mb-3'>
          However, no online system can guarantee 100% security.
        </p>

        <h2 className='text-xl font-bold mt-10'>Data Sharing</h2>
        <p className='mb-3'>We do not sell your personal information.</p>

        <p className='mb-3'>We may share data with trusted third-party providers for:</p>
        <ul className='list-disc'>
          <li>Payment processing</li>
          <li>Cloud hosting</li>
          <li>Technical infrastructure</li>
          <li>Customer support services</li>
        </ul>

        <p className='mb-3'>These providers are required to maintain confidentiality.</p>

        <h2 className='text-xl font-bold mt-10'>Cookies and Tracking</h2>
        <p className='mb-3'>
          Our website may use cookies and tracking technologies to improve user
          experience and analyze website traffic.
        </p>

        <p className='mb-3'>
          Users may disable cookies through browser settings.
        </p>

        <h2 className='text-xl font-bold mt-10'>Data Retention</h2>
        <p className='mb-3'>We retain data only for as long as necessary to:</p>
        <ul className='list-disc'>
          <li>Provide services</li>
          <li>Comply with legal obligations</li>
          <li>Resolve disputes</li>
        </ul>

        <h2 className='text-xl font-bold mt-10'>Your Rights</h2>
        <p className='mb-3'>
          Depending on your jurisdiction, you may have the right to:
        </p>

        <ul className='list-disc'>
          <li>Access your data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of data</li>
          <li>Withdraw consent for processing</li>
        </ul>

        <p className='mb-3'>Requests can be made by contacting us.</p>

        <h2 className='text-xl font-bold mt-10'>Third-Party Links</h2>
        <p className='mb-3'>
          Our platform may contain links to third-party websites. We are not
          responsible for their privacy practices.
        </p>

        <h2 className='text-xl font-bold mt-10'>Children's Privacy</h2>
        <p className='mb-3'>
          Our services are not intended for individuals under 18 years of age.
        </p>

        <p className='mb-3'>
          We do not knowingly collect data from minors.
        </p>

        <h2 className='text-xl font-bold mt-10'>Updates to Privacy Policy</h2>
        <p className='mb-3'>
          We may update this Privacy Policy periodically. Changes will be posted on
          this page with the updated date.
        </p>

        <h2 className='text-xl font-bold mt-10'>Contact Information</h2>
        <p className='mb-3'>
          <strong>Company Name:</strong> QRserv<br />
          <strong>Email:</strong> {email}<br />
          <strong>Contact:</strong> {mobileNumber}
        </p>
      </div>
    </PageShell>
  )
}
