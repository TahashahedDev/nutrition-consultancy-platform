# Nutrition Consultancy Platform

A client-facing web platform for an independent nutrition consultant (Sara
Shahed): a marketing site, paid nutrition plans with manual UPI checkout, a
client dashboard for diet plans and progress tracking, and an admin panel
for managing clients, plans, and coupons.

**Live site:** https://sarashahed.vercel.app/

## Overview

Nutrition consulting is typically run over WhatsApp and spreadsheets. This
platform gives the consultant a proper storefront and back office while
keeping the parts of the workflow (payment confirmation, meal-photo
check-ins) that already work well over WhatsApp — rather than replacing
them wholesale.

- **Visitors** learn about the consultant and her plans, and reach her
  directly via WhatsApp.
- **Clients** register, purchase a plan (via UPI QR code, manually
  confirmed), and then use a dashboard to view their diet plan day-by-day
  and log their progress (weight and body measurements).
- **The consultant (admin)** manages clients, activates subscriptions after
  verifying payment, builds diet plans, and manages discount coupons — all
  from an in-app admin panel, no spreadsheets required.

## Key Features

- Marketing landing page (hero, about, plans, testimonials, contact, CTA)
  with a persistent WhatsApp contact button
- Email/password authentication (registration, login, forgot password)
- Nutrition plan checkout: UPI QR code payment with coupon code support;
  payment is confirmed manually by the admin, not processed automatically
- Client dashboard: day-by-day diet plan view, meal photo submission via
  WhatsApp, and progress logging (weight, waist, chest, hip, thigh
  measurements) visualized with charts
- Admin panel: client list with subscription status, per-client management
  (diet plan builder, notes, progress review), nutrition plan management,
  and coupon management
- Static Terms of Service / Privacy Policy / Refund policy page
- Responsive layout with light/dark theme support

## User Flow

```
Visitor
  -> Browses plans on the landing page
  -> Registers an account
  -> Selects a plan -> Checkout (UPI QR + optional coupon)
  -> Marks "I have paid" -> account flagged as payment-pending
  -> Admin verifies the payment and activates the subscription
  -> Client dashboard unlocks: diet plan, meal check-ins, progress logging
```

## Technology Stack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with shadcn/ui (Radix UI primitives)
- React Hook Form + Zod for form handling and validation
- Recharts for progress charts, Framer Motion for animation

**Backend / Data**
- Firebase Authentication (email/password) — admin access is controlled by
  an `isAdmin` custom claim on the user's auth token
- Cloud Firestore, accessed directly from the client SDK and secured by
  the rules in [`src/firestore.rules`](src/firestore.rules)
- No custom server (no API routes or server actions handle business
  logic); all reads/writes go through the Firestore SDK under those rules

**Hosting**
- Deployed on Vercel (see [Deployment](#deployment))

## Architecture

```
Browser (Next.js client components)
  |
  |  Firebase Web SDK (Auth + Firestore)
  v
Firebase Authentication  <-->  Cloud Firestore
                                 (secured by src/firestore.rules)
```

There is no application server between the browser and Firebase — the
Next.js app is effectively a static/SSR frontend that talks to Firebase
directly. Data access control lives entirely in the Firestore security
rules and in the `isAdmin` custom claim, not in server-side code.

## Data Flow & Privacy

This app collects personal and health-related information: name, email,
phone number, and progress data (weight and body measurements). All of it
is stored in Cloud Firestore under the `users/{userId}` document and its
subcollections. Access is restricted so that a user can only read/write
their own data, and an admin (identified by the `isAdmin` custom claim)
can read/write any client's data. See [`src/firestore.rules`](src/firestore.rules)
for the exact rules, and the in-app [Policies](https://sarashahed.vercel.app/policies)
page for the policy shown to clients.

No compliance certification (e.g. HIPAA, GDPR) is claimed — this section
describes the technical access-control behavior only.

## Local Development

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # optional — see Environment Variables below
npm run dev
```

The app runs at http://localhost:3000 by default.

Other scripts:

```bash
npm run build       # production build
npm run start        # run a production build locally
npm run lint          # ESLint (Next.js config)
npm run typecheck  # TypeScript, no emit
```

## Environment Variables

The app ships with working Firebase configuration defaults in
`src/firebase/config.ts`, so it runs out of the box. The variables below
are **optional overrides** that let you point the app at a different
Firebase project (e.g. a staging environment) without editing code. Copy
`.env.example` to `.env.local` and fill in values from your own Firebase
project settings if you need this.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | Firebase Web SDK API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | No | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | No | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase Cloud Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | No | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID |

Firebase Web SDK config values identify a project to the client SDK; they
are not treated as secrets by Firebase (see
[Firebase's guidance on API keys](https://firebase.google.com/docs/projects/api-keys)).
Access control is enforced by `src/firestore.rules`, not by hiding this
config. Never commit `.env.local`.

## Project Structure

```
src/
  app/            # Next.js App Router pages (public site, auth, checkout,
                   # client dashboard, admin panel)
  components/
    sections/      # Landing page sections (hero, about, plans, ...)
    layout/         # Header / footer
    admin/           # Admin-only components (diet plan builder)
    dashboard/       # Client dashboard components
    ui/               # shadcn/ui primitives
  firebase/          # Firebase initialization, providers, and data hooks
  hooks/               # Data-fetching and utility hooks
  lib/                  # Shared types and utilities
  firestore.rules        # Firestore security rules
docs/
  blueprint.md           # Original product/design brief
  backend.json            # Firestore data model reference
```

## Testing

There is no automated test suite in this repository. Available checks:

```bash
npm run typecheck   # verified clean
npm run build           # verified clean
npm run lint               # not yet configured — running it prompts to set up ESLint
```

## Deployment

The app is deployed on Vercel at https://sarashahed.vercel.app/, building
directly from this repository's `main` branch. `apphosting.yaml` and
`.idx/` are leftover configuration from the project's origin in Firebase
Studio / Firebase App Hosting and are not part of the current Vercel
deployment path.

## Security & Privacy

- Data access is enforced by Firestore Security Rules
  (`src/firestore.rules`), not by application code.
- Admin access is granted via a Firebase custom claim (`isAdmin`) set on a
  user's auth token; there is no separate admin credential system.
- Payments are confirmed manually by the admin — no payment processor or
  card data is handled by this application.
- See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## Known Limitations

- Payment confirmation is manual (admin reviews and activates each
  subscription); there is no automated payment gateway integration.
- Granting/revoking the `isAdmin` custom claim is done outside this
  codebase (Firebase Console or Admin SDK), not through the app itself.
- No automated test suite yet.
- No CI pipeline is configured in this repository.
- ESLint (`npm run lint`) is a declared script but has not been
  initialized in this repository yet.

## License

Copyright © 2026 Sara Shahed. All rights reserved. This is proprietary,
source-available software — see [LICENSE](LICENSE) for terms and the
third-party component carve-out.

## Security Reporting

See [SECURITY.md](SECURITY.md).

## Contact

- Sara Shahed (project owner) — sarashabbirshahed@gmail.com
- Taha Shahed (technical contact) — tahashahed88@gmail.com
