# Backend

NestJS API for the QRserv platform. It handles authentication, organizations, restaurants, menus, tables, orders, payments, subscriptions, contact form submissions, and withdraw requests.

## Tech Stack

- NestJS 10
- MongoDB + Mongoose
- JWT auth
- Razorpay
- Nodemailer
- Swagger

## Requirements

- Node.js 20+
- npm 10+
- MongoDB

## Environment Variables

Create `backend/.env`:

```env
PORT=7000
MONGODB_URI=mongodb://127.0.0.1:27017/qr-order

JWT_SECRET=change-me
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=change-me-refresh
JWT_REFRESH_EXPIRATION=7d

SUBSCRIPTION_PLANS_API_KEY=change-me

RAZORPAY_KEY_ID=change-me
RAZORPAY_KEY_SECRET=change-me
RAZORPAY_WEBHOOK_SECRET=change-me

WITHDRAW_CHARGE_PERCENTAGE=2.5
WITHDRAW_CHARGE_GST_PERCENTAGE=18

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-mail-user
MAIL_PASS=your-mail-password
MAIL_FROM=no-reply@example.com
MAIL_TO=ops@example.com
MAIL_SUBJECT_PREFIX=QRserve
```

Notes:

- `SUBSCRIPTION_PLANS_API_KEY` must match `VITE_SUBSCRIPTION_PLANS_API_KEY` in `main-site`.
- Uploaded files are served from `backend/uploads`.
- Keep uploads on persistent storage in production.

## Install

```bash
npm install
```

## Run Locally

Development:

```bash
npm run start:dev
```

Standard start:

```bash
npm run start
```

Default local API URL:

```text
http://localhost:7000
```

Swagger docs:

```text
http://localhost:7000/api/docs
```

Postman collection:

```text
http://localhost:7000/api/docs/postman
```

## Build

```bash
npm run build
```

Run compiled app:

```bash
npm run start:prod
```

## Seed Subscription Plans

```bash
npm run seed
```

Run this after configuring `MONGODB_URI`.

## Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Deployment

This app requires a Node.js server and MongoDB. It is not a static deployment.

### Recommended Production Flow

1. Install dependencies: `npm install`
2. Create production `.env`
3. Build: `npm run build`
4. Start: `npm run start:prod`

### PM2 Example

```bash
npm install -g pm2
pm2 start dist/main.js --name qr-code-order-backend
pm2 save
```

### Reverse Proxy

Put Nginx or Apache in front of the app and forward traffic to `http://127.0.0.1:7000`.

Make sure these routes are reachable:

- `/api/*`
- `/uploads/*`
- `/api/uploads/*`
- `/api/docs`

### Important Production Notes

- Rotate all JWT, Razorpay, mail, and API key secrets before going live.
- Use a managed MongoDB or a persistent MongoDB server.
- Keep the `uploads` directory outside ephemeral storage if you deploy to a container/VPS platform.
- Configure HTTPS at the proxy or hosting layer.

## Related Services

- Admin panel: `../admin-panel`
- Customer app: `../customer-app`
- Marketing site: `../main-site`
