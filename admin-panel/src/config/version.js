/**
 * Application Version and Release Notes Configuration
 * Used for version tracking, release modals, and update announcements.
 */

export const APP_VERSION = 'v1.1.1';
export const APP_NAME = 'QRServ';
export const RELEASE_DATE = 'November 2026';
export const RELEASE_STORAGE_KEY = `qrserv_seen_release_${APP_VERSION}`;

export const RELEASE_HISTORY = [
  {
    version: 'v1.1.1',
    date: 'November 2026',
    isLatest: true,
    summary:
      'Thermal print, scanner clarity, and bold PDF typography upgrades across admin and customer receipts.',
    notes: [
      {
        id: 1,
        tag: 'Thermal Print & PDF',
        tagColor: 'emerald',
        icon: 'printer',
        title: 'Bold High-Contrast Bill PDF & Thermal Receipt Printing',
        description:
          'Upgraded 58mm, 80mm, and A4 invoice PDFs alongside thermal HTML printouts and KOT PDFs to render every label, item rate, tax line, and footer in bold pure-black (#000000) typography so thermal prints and scans stay sharp without blurry or faint text.',
        highlights: [
          'Bold pure-black (#000000) typography in admin & customer bill PDFs (58mm, 80mm, and A4) and KOT PDFs',
          'Removed faded opacity text and anti-aliasing blur in thermal print CSS (@media print)',
          'Enlarged small receipt metadata (CR No, date/time, rate, subtotal, tax, payment mode, and footer) for clear scanning',
        ],
      },
    ],
  },
  {
    version: 'v1.1.0',
    date: 'November 2026',
    isLatest: false,
    summary:
      'Menu category filtering fixes, Firebase FCM alerts, streamlined KDS flow, VAT tax engine, analytics, QR hub, and role-based table controls.',
    notes: [
      {
        id: 1,
        tag: 'Menu Management',
        tagColor: 'blue',
        icon: 'folder',
        title: 'Food Section Category Tab Filtering & Routing Fix',
        description:
          'Fixed category tab filtering and initial active state when opening the food menu section so category pills filter menu items accurately without missing items or navigation glitches.',
        highlights: [
          'Accurate active category tab tracking and URL parameter sync',
          'Instant dish filtering without unnecessary page reloads',
          'Preserved category counts across item modifications',
        ],
      },
      {
        id: 2,
        tag: 'System & Alerts',
        tagColor: 'amber',
        icon: 'bell',
        title: 'Browser Firebase FCM Web Push & Audible Alerts',
        description:
          'Integrated real-time Firebase Cloud Messaging (FCM) web push notifications accompanied by distinctive audible chimes and toast alerts for incoming orders, kitchen alerts, and waiter calls.',
        highlights: [
          'Audible chime rings immediately upon new order creation',
          'Background push alerts for Kitchen & Captain staff',
          'Interactive toast notifications with direct action triggers',
        ],
      },
      {
        id: 3,
        tag: 'Order Management & KDS',
        tagColor: 'emerald',
        icon: 'orders',
        title: 'Streamlined Status Flow & Completed-Only Revenue Aggregation',
        description:
          'Simplified order lifecycle to 4 clear states: Pending ➔ Confirmed ➔ Ready ➔ Completed. Kitchen KDS view is restricted to Confirmed & Ready orders only. Removed obsolete "Preparing" status and replaced "Served" with "Completed". Revenue aggregation now strictly counts Completed orders.',
        highlights: [
          'Clean state machine: Pending ➔ Confirmed ➔ Ready ➔ Completed',
          'Kitchen KDS display shows only actionable orders (Confirmed & Ready)',
          'Gross dashboard revenue & analytics only aggregate finalized Completed orders',
        ],
      },
      {
        id: 4,
        tag: 'Financials & Reports',
        tagColor: 'purple',
        icon: 'tax',
        title: 'Configurable VAT Tax Engine (Inclusive & Exclusive)',
        description:
          'Implemented a configurable VAT tax engine supporting inclusive vs. exclusive VAT rates (e.g. 15% ZATCA, 5%, 18%), calculating subtotal, taxable net base, itemized VAT breakdown on bills, and tax reports.',
        highlights: [
          'Dual tax engine: Inclusive (menu price contains VAT) & Exclusive (added on checkout)',
          'Itemized bill breakdown down to 2 decimal places with tax rate disclosure',
          'Aligned calculations between customer cart, receipt preview, and thermal printouts',
        ],
      },
      {
        id: 5,
        tag: 'Admin Panel Analytics',
        tagColor: 'indigo',
        icon: 'chart',
        title: 'Comprehensive Order Analytics Dashboard',
        description:
          'Upgraded Order Analytics to show full-spectrum operational counts and metrics: Total Orders, Pending/Processing pipeline, Completed/Delivered fulfillment rate (%), Cancelled/Refund value, volume trends over time, and recent orders table.',
        highlights: [
          'KPI Summary Cards with volume, fulfillment rates, and revenue impact',
          'Interactive Order Status Doughnut Chart & Volume Trends Timeline',
          'Flexible date range filtering (Today, Last 7 Days, This Month, Custom)',
        ],
      },
      {
        id: 6,
        tag: 'Restaurant Owner Panel',
        tagColor: 'sky',
        icon: 'qrcode',
        title: 'Dedicated QR Codes Management Hub',
        description:
          'Added a dedicated QR code management hub for Restaurant Owners to preview, generate, and download high-resolution QR codes for Customer Dine-In Ordering, Kitchen Display (KDS), Captain Login, and Digital Menu PDF.',
        highlights: [
          'One-click high-resolution QR code downloads',
          'Direct links for Customer Order, Captain Login, and Kitchen Station',
          'Smart Menu PDF QR generation based on restaurant plan subscription',
        ],
      },
      {
        id: 7,
        tag: 'Table Management',
        tagColor: 'rose',
        icon: 'printer',
        title: 'Role-Based Table Action Controls (Hidden Print for Org & Owner)',
        description:
          'Refined permissions across table management: hid bill and KOT print options from table order history and modals for Organization Admins and Restaurant Owners, ensuring proper operational separation between management and billing stations.',
        highlights: [
          'Removed bill and KOT print buttons from table orders for Org Admin & Restaurant Owner roles',
          'Preserved full order inspection view for audit and review',
          'Streamlined UI to prevent accidental prints from administrative panels',
        ],
      },
    ],
  },
];

export const RELEASE_NOTES = RELEASE_HISTORY[0].notes;
