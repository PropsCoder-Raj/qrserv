# Main Site

React + Vite marketing site for QRserv. It includes the public landing pages, contact form, subscription plan listing, and links into the admin panel.

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 3
- React Router

## Requirements

- Node.js 20+
- npm 10+
- Running backend API for contact form and subscription plan APIs

## Environment Variables

Create `main-site/.env`:

```env
VITE_API_BASE_URL=http://localhost:7000
VITE_ADMIN_PANEL_URL=http://localhost:5173
VITE_SUBSCRIPTION_PLANS_API_KEY=change-me
```

Notes:

- `VITE_API_BASE_URL` should not include `/api`.
- `VITE_SUBSCRIPTION_PLANS_API_KEY` must match backend `SUBSCRIPTION_PLANS_API_KEY`.
- `VITE_ADMIN_PANEL_URL` is used by the landing page CTA that opens the control panel.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

Build output:

```text
dist/
```

Preview production build locally:

```bash
npm run preview
```

## Deployment

This is a static frontend. Deploy the `dist` folder to Netlify, Vercel, Hostinger static hosting, or Nginx/Apache.

Recommended production env:

```env
VITE_API_BASE_URL=https://your-backend-domain
VITE_ADMIN_PANEL_URL=https://your-admin-domain
VITE_SUBSCRIPTION_PLANS_API_KEY=match-your-backend-key
```

### Netlify or Vercel

Build settings:

```text
Base directory: main-site
Build command: npm run build
Publish directory: dist
```

Because this is a React SPA, configure your host to rewrite unknown routes to `index.html`.

### Nginx

Serve `dist` and add SPA fallback routing to `index.html`.

## Backend Endpoints Used

- `POST /api/contact`
- `GET /api/subscriptions/public/plans`

## Related Services

- Backend API: `../backend`
- Admin panel: `../admin-panel`
- Customer app: `../customer-app`
