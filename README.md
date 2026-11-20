# Moz Deli Foods

A Next.js App Router website for Moz Delicious Foods, trading as Moz Deli Foods in Daveyton, Benoni.

## Development

```bash
npm install
npm run db:generate
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploying to Vercel

1. Import the repository into Vercel and use the detected Next.js settings. The project build command is `npm run build`; `postinstall` generates the Prisma client.
2. Provision a production PostgreSQL database with TLS. Add `DATABASE_URL` and `APP_BASE_URL` to Vercel’s Production environment. Set `APP_BASE_URL` to the canonical custom HTTPS domain, without a trailing path (for example, `https://your-domain.example`), not a preview deployment URL.
3. Add the production secrets from `.env.example` in Vercel Project Settings → Environment Variables. Use separate credentials and databases for Preview and Production. Do not expose server secrets with a `NEXT_PUBLIC_` prefix.
4. Apply the database migrations to the production database with `npm run db:migrate` from a trusted deployment environment. Seed only if the restaurant owner has reviewed the seed data; seeded items are intentionally unavailable and unpriced.
5. Before enabling ordering, verify approved prices, item availability, service areas and fees, collection/delivery arrangements, business contact details, photo permissions, and payment notifications. Ordering settings are disabled by default; keep them disabled until the owner approves operations and a full sandbox test succeeds.
6. Configure a public HTTPS PayFast ITN URL at `https://your-domain.example/api/payments/payfast/itn` and verify the trusted proxy overwrites the configured source-IP header. Test payment, cancellation, retry, and notification handling before switching from sandbox to production credentials.
7. After deployment, verify the production domain, `/robots.txt`, `/sitemap.xml`, legal pages, checkout configuration, database connectivity, and monitoring. Keep a database backup and restore plan.

### Stripe production webhook

The Stripe handler verifies each signature using `STRIPE_WEBHOOK_SECRET`, validates the paid ZAR total against Stripe’s line items, and creates the order and payment notification in one database transaction. A unique Checkout Session ID makes event retries idempotent. It handles `checkout.session.completed` when paid and `checkout.session.async_payment_succeeded` for delayed payment methods.

1. Deploy the application and apply `npm run db:migrate`. Set `STRIPE_SECRET_KEY` and `APP_BASE_URL` for the same Stripe mode/domain as the webhook.
2. In Stripe Dashboard → Developers → Webhooks, add `https://your-domain.example/api/webhooks/stripe` as an endpoint and subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
3. Reveal the endpoint signing secret (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET` in Vercel’s Production environment. Test and live endpoints have different signing secrets; configure each in its matching environment.
4. Redeploy, then test a successful payment and a duplicate webhook delivery in Stripe test mode. Confirm that one paid order appears in `/admin`, its items and ZAR total are correct, and configured email notifications are delivered. Do not accept live orders until the restaurant has confirmed prices, availability and fulfilment details.

## Ordering and deployment

### Coolify deployment

The `build` script generates Prisma Client, deploys migrations, seeds the menu and settings, and then builds Next.js:

```bash
prisma generate && prisma migrate deploy && node prisma/seed.mjs && next build
```

Set `DATABASE_URL`, `APP_BASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH` in Coolify. Generate `ADMIN_PASSWORD_HASH` with `npm run admin:password`. If the deployment platform preserves backslashes before `$` in the bcrypt hash, the application normalizes escaped dollar signs automatically.

The ordering backend uses PostgreSQL, Prisma, Auth.js credentials for the single administrator, PayFast Onsite, and optional Resend email. The online ordering, menu availability, collection and delivery settings are all disabled by default. Keep them disabled until the restaurant owner approves the menu and operational details.

The public storefront also provides a Stripe Checkout flow for the 13 menu items in `data/menu.ts`. The server sets item prices and metadata, and the signed Stripe webhook at `/api/webhooks/stripe` creates each successfully paid order in the shared admin dashboard. The customer return page independently verifies payment status. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_BASE_URL`, and `DATABASE_URL`; apply the Stripe order migration before accepting payments.

The admin photo uploader accepts JPEG, PNG and WebP files up to 5 MB and stores them in PostgreSQL so uploads persist with the configured database. The application serves uploaded assets from immutable public image URLs; retain database backups and include image storage in the database capacity plan.

1. Provision PostgreSQL with TLS and set `DATABASE_URL` in the deployment environment. Copy `.env.example` to a private `.env` for local work; never commit credentials.
2. Set `APP_BASE_URL` to the canonical HTTPS origin. For local development, `http://localhost:3000` is permitted outside production.
3. Generate an Auth.js secret with `openssl rand -base64 32`. Set `ADMIN_EMAIL` to the administrator's email or username. Generate the password hash in an interactive terminal using `npm run admin:password`, then store the output as `ADMIN_PASSWORD_HASH`. The password itself is not printed.
4. Configure `STRIPE_SECRET_KEY` for hosted Stripe Checkout. Separately, configure the PayFast sandbox merchant ID, key and passphrase in `PAYFAST_*` for the existing database-backed admin order flow. `PAYFAST_SANDBOX` defaults to `true`. `PAYFAST_SOURCE_IP_HEADER` must name a header that the trusted reverse proxy **overwrites** with the actual client IP; do not trust a client-supplied forwarding header. ITN source verification resolves PayFast's documented hosts and checks that trusted source IP, then verifies the ordered signature, merchant, amount, reference and PayFast server-validation response.
5. Apply the schema and seed the unpriced, unavailable menu entries: `npm run db:migrate && npm run db:seed`. Do not enable ordering until approved product prices and availability, fulfillment settings, and PayFast sandbox notifications are verified.
6. Configure a public HTTPS callback at `/api/payments/payfast/itn` before testing PayFast sandbox payments. Test the return/cancel URLs and ITN retries through the deployment’s trusted proxy. Browser redirects never mark orders as paid.
7. Optionally configure `RESEND_API_KEY`, `EMAIL_FROM`, and `ORDER_NOTIFICATION_EMAIL`. These send customer and restaurant payment-confirmation emails after verified ITN; email is not required for order persistence.
8. Use `/admin/login` to access order management. The administrator must process refunds in the payment provider used for the order (Stripe or PayFast) before marking it refunded in the dashboard.

Before going live, the owner must provide approved registered merchant details and production PayFast credentials, approved menu/prices/availability, collection and delivery arrangements and areas/fees, restaurant notification email, operating hours, and permission for photographs. Keep sandbox enabled until a complete payment and notification test succeeds. Configure backups, TLS, a trusted proxy, production database access controls, and monitoring before accepting real payments.

## Business data and authenticity

- `data/business.ts` contains the public business details and order/service switches.
- `data/menu.ts` contains the 13 items and prices supplied for the storefront menu. Categories without supplied items remain empty and prompt customers to contact the restaurant.
- `prisma/seed.mjs` stores the original public listing highlights as unavailable and unpriced in the database; the existing PayFast order flow remains disabled by default.
- `docs/business-confirmation.md` records research findings and owner confirmations needed before launch.
- `docs/image-manifest.md` tracks existing project photographs, permission status and missing approved assets.

The admin dashboard accepts only owner-approved prices and local or uploaded image paths. The Stripe storefront prices and 24-hour platter notice are supplied in the implementation request; confirm all current prices, availability, service details, and photograph permissions with the restaurant before taking live orders. The existing PayFast seed data remains separate from the storefront catalog.

Tailwind 4 theme colors and font tokens are defined CSS-first in `app/globals.css` using `@theme`; this project does not use a legacy `tailwind.config.ts`.
