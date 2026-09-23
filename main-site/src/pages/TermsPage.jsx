import PageShell from '../components/PageShell.jsx'
import { useContact } from '../context/ContactContext.jsx'

export default function TermsPage() {
  const { email, mobileNumber } = useContact()

  return (
    <PageShell
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using QRserv."
    >
      {/* Decorative QR image (half visible / half off-screen) */}
      <img
        src="/img/QR_CODE_GREEN_HALF_1.png"
        alt="QR code"
        className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
      />
      <div className="prose prose-slate max-w-3xl">
        <p className='mb-3'><strong>Last Updated:</strong> 11 March 2026</p>

        <p className='mb-3'>
          These Terms of Service ("Terms") govern your access to and use of the website,
          software, and services provided by <strong>QRserv</strong> ("Company", "we",
          "our", or "us") through [Website URL].
        </p>

        <p className='mb-3'>
          By accessing or using our services, you agree to be bound by these Terms.
        </p>

        <h2 className='text-xl font-bold mt-10'>Description of Services</h2>
        <p className='mb-3'>
          QRserv provides cloud-based Point of Sale (POS) software and related services
          designed for restaurants, cafes, food service providers, and hospitality
          businesses.
        </p>

        <p className='mb-3'>Our services may include:</p>
        <ul className='list-disc'>
          <li>Order management</li>
          <li>Billing and invoicing</li>
          <li>Menu management</li>
          <li>Payment integrations</li>
          <li>Analytics and reporting</li>
          <li>Customer data management</li>
          <li>Online ordering and QR ordering systems</li>
        </ul>

        <p className='mb-3'>We may modify, update, or discontinue services at any time.</p>

        <h2 className='text-xl font-bold mt-10'>Eligibility</h2>
        <p className='mb-3'>
          You must be at least 18 years old and legally capable of entering into a
          binding contract to use our services.
        </p>

        <p className='mb-3'>
          If you are using the service on behalf of a business, you represent that you
          have authority to bind that business to these Terms.
        </p>

        <h2 className='text-xl font-bold mt-10'>User Accounts</h2>
        <p className='mb-3'>To access certain features, you may be required to create an account.</p>

        <p className='mb-3'>You agree to:</p>
        <ul>
          <li>Provide accurate information</li>
          <li>Maintain confidentiality of login credentials</li>
          <li>Be responsible for all activities under your account</li>
        </ul>

        <p className='mb-3'>
          We reserve the right to suspend or terminate accounts suspected of
          unauthorized activity.
        </p>

        <h2 className='text-xl font-bold mt-10'>Subscription and Fees</h2>
        <p className='mb-3'>
          Certain features of our POS platform may require a paid subscription.
        </p>

        <p className='mb-3'>You agree to:</p>
        <ul>
          <li>Pay all applicable subscription fees</li>
          <li>Provide valid payment information</li>
          <li>Authorize recurring billing where applicable</li>
        </ul>

        <p className='mb-3'>
          Failure to pay may result in suspension or termination of services.
        </p>

        <h2 className='text-xl font-bold mt-10'>Acceptable Use Policy</h2>
        <p className='mb-3'>You agree not to:</p>
        <ul>
          <li>Use the platform for unlawful activities</li>
          <li>Attempt to hack, reverse engineer, or disrupt services</li>
          <li>Upload malicious software or harmful code</li>
          <li>Misuse customer data collected through the platform</li>
        </ul>

        <p className='mb-3'>
          Violation of this policy may result in immediate termination.
        </p>

        <h2 className='text-xl font-bold mt-10'>Data Ownership</h2>
        <p className='mb-3'>
          Customers retain ownership of their business data, including menu data,
          transaction records, and customer information.
        </p>

        <p className='mb-3'>
          By using our service, you grant us a limited license to process and store
          this data solely to provide and improve our services.
        </p>

        <h2 className='text-xl font-bold mt-10'>Intellectual Property</h2>
        <p className='mb-3'>
          All software, design, trademarks, and intellectual property associated with
          the platform remain the exclusive property of QRserv.
        </p>

        <p className='mb-3'>
          You may not copy, distribute, or reproduce any part of the platform without
          written permission.
        </p>

        <h2 className='text-xl font-bold mt-10'>Third-Party Services</h2>
        <p className='mb-3'>Our platform may integrate with third-party services such as:</p>

        <ul>
          <li>Payment gateways</li>
          <li>Delivery platforms</li>
          <li>Accounting software</li>
        </ul>

        <p className='mb-3'>
          We are not responsible for the policies or performance of third-party
          providers.
        </p>

        <h2 className='text-xl font-bold mt-10'>Service Availability</h2>
        <p className='mb-3'>
          While we strive for uninterrupted service, we do not guarantee that the
          platform will be free from downtime, errors, or interruptions.
        </p>

        <p className='mb-3'>Maintenance and updates may occur periodically.</p>

        <h2 className='text-xl font-bold mt-10'>Limitation of Liability</h2>
        <p className='mb-3'>
          To the maximum extent permitted by law, QRserv shall not be liable for:
        </p>

        <ul>
          <li>Loss of business revenue</li>
          <li>Loss of customer data</li>
          <li>Indirect or consequential damages</li>
        </ul>

        <p className='mb-3'>Use of the service is at your own risk.</p>

        <h2 className='text-xl font-bold mt-10'>Termination</h2>
        <p className='mb-3'>We may suspend or terminate access to our services if:</p>

        <ul>
          <li>You violate these Terms</li>
          <li>Payment obligations are not met</li>
          <li>We discontinue services</li>
        </ul>

        <p className='mb-3'>Users may terminate their account at any time.</p>

        <h2 className='text-xl font-bold mt-10'>Governing Law</h2>
        <p className='mb-3'>
          These Terms shall be governed by and interpreted in accordance with the
          laws of [Country/State].
        </p>

        <h2 className='text-xl font-bold mt-10'>Changes to Terms</h2>
        <p className='mb-3'>
          We reserve the right to update these Terms at any time. Continued use of the
          platform constitutes acceptance of the updated terms.
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
