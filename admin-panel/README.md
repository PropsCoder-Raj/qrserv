# Admin Panel

React + Vite admin application for QRserv. This app is used by admins, restaurant owners, managers, and staff to manage restaurants, menus, tables, orders, subscriptions, organizations, and withdraw requests.

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Axios
- React Router

## Requirements

- Node.js 20+
- npm 10+
- Running backend API

## Environment Variables

Create `admin-panel/.env`:

```env
VITE_API_URL=http://localhost:7000/api
VITE_CUSTOMER_APP_URL=http://localhost:5174
```

Notes:

- `VITE_API_URL` is the backend API base URL.
- `VITE_CUSTOMER_APP_URL` is used when generating/opening customer-facing table links from the tables and restaurants screens.

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

If `VITE_API_URL` is not set, the app falls back to `/api` and Vite proxies API requests to `https://srv1563916.hstgr.cloud` in development.

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
VITE_API_URL=https://your-backend-domain/api
VITE_CUSTOMER_APP_URL=https://your-customer-domain
```

### Netlify

Build settings:

```text
Base directory: admin-panel
Build command: npm run build
Publish directory: dist
```

SPA redirect is already included in `public/_redirects`.

### Nginx

Serve the built files from `dist` and rewrite unknown routes to `index.html` so React Router works on refresh.

## Related Services

- Backend API: `../backend`
- Customer app: `../customer-app`
- Marketing site: `../main-site`
