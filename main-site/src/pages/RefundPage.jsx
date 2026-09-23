import PageShell from '../components/PageShell.jsx'
import { useContact } from '../context/ContactContext.jsx'

export default function RefundPage() {
  const { email, mobileNumber } = useContact()

  return (
    <PageShell title="Refund Policy" subtitle="Refunds and cancellations.">
      {/* Decorative QR image (half visible / half off-screen) */}
      <img
        src="/img/QR_CODE_GREEN_HALF_1.png"
        alt="QR code"
        className="pointer-events-none absolute right-0 hidden w-[220px] opacity-20 md:block"
      />
      <div className="prose prose-slate max-w-3xl">
        <p className='mb-3'><strong>Last Updated:</strong> 11 March 2026</p>

        <p className='mb-3'>
          This Refund & Subscription Policy describes the rules regarding
          subscriptions, payments, cancellations, and refunds for services provided
          by <strong>QRserv</strong> through its Point of Sale (POS) platform and
          related software services.
        </p>

        <p className='mb-3'>
          By purchasing or subscribing to our services, you agree to the terms
          outlined in this policy.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Subscription Plans</h2>
        <p className='mb-3'>Our POS platform may offer different subscription plans, which may include:</p>

        <ul className='list-disc'>
          <li>Monthly subscription plans</li>
          <li>Annual subscription plans</li>
          <li>Custom enterprise plans for large restaurant businesses</li>
        </ul>

        <p className='mb-3'>
          Each plan may include different features, usage limits, and pricing.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Payment Terms</h2>
        <p className='mb-3'>
          All subscription fees must be paid in advance before accessing the services.
        </p>

        <p className='mb-3'>
          Payments may be processed through secure third-party payment providers. By
          providing payment details, you authorize us to charge the applicable
          subscription fees according to the selected plan.
        </p>

        <p className='mb-3'>
          If automatic renewal is enabled, your subscription may renew automatically
          at the end of each billing cycle unless canceled before the renewal date.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Free Trials (If Applicable)</h2>
        <p className='mb-3'>
          We may offer a free trial period for new users. During the trial period,
          users can explore the platform features without payment.
        </p>

        <p className='mb-3'>
          At the end of the trial period, access to services may be restricted unless
          a paid subscription is activated.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Refund Policy</h2>
        <p className='mb-3'>
          Due to the nature of digital software services, subscription fees are
          generally non-refundable once the service has been activated.
        </p>

        <p className='mb-3'>However, refunds may be considered in the following cases:</p>

        <ul className='list-disc'>
          <li>Duplicate payment or accidental billing</li>
          <li>Technical issues that prevent access to the platform and cannot be resolved</li>
          <li>Billing errors caused by our system</li>
        </ul>

        <p className='mb-3'>
          Refund requests must be submitted within <strong>7 days</strong> of the
          transaction date.
        </p>

        <p className='mb-3'>
          Approved refunds will be processed through the original payment method.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Non-Payment</h2>
        <p className='mb-3'>
          If payment for a subscription fails or is not completed, access to certain
          features or the entire platform may be suspended until payment is
          successfully processed.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Changes to Pricing</h2>
        <p className='mb-3'>
          We reserve the right to modify subscription pricing or service plans at any
          time. Users will be notified in advance of any pricing changes before they
          take effect.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Service Termination</h2>
        <p className='mb-3'>
          We may suspend or terminate access to services if users violate our Terms of
          Service or misuse the platform.
        </p>

        <h2 h2 className='text-xl font-bold mt-10'>Contact for Billing Issues</h2>
        <p className='mb-3'>
          If you have any questions regarding billing, subscription plans, or refund
          requests, please contact us:
        </p>

        <p className='mb-3'>
          <strong>Company Name:</strong> QRserv<br />
          <strong>Email:</strong> {email}<br />
          <strong>Contact:</strong> {mobileNumber}
        </p>
      </div>
    </PageShell>
  )
}
