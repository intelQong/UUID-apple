# Apple UDID Retrieval Utility

[![CI](https://github.com/intelQong/UUID-apple/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/intelQong/UUID-apple/actions/workflows/ci.yml)
[![Security](https://github.com/intelQong/UUID-apple/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/intelQong/UUID-apple/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A minimal, privacy-first Apple UDID retrieval utility and developer guide. Retrieve your iPhone or iPad UDID directly in Mobile Safari without iTunes, Finder, cables, or third-party software. Built with Next.js (App Router) and deployed on Vercel.

---

## Features

- **No Cables or Third-Party Software**: Retrieve your UDID directly in Safari on iPhone or iPad. No Mac, PC, USB cable, Apple ID, iTunes, Finder, or Xcode required.
- **Minimal, Uncluttered Design**: Focused, distraction-free user experience optimized for mobile and desktop handoff via QR code.
- **Zero Server-Side Storage**: No database, no accounts, and no data retention. Device attributes are delivered via encrypted bearer tokens directly to the results page.
- **Cryptographic Security**: Uses stateless HMAC-SHA256 challenges with clock skew and expiration controls to protect against replay and tampering.
- **Authenticated Encryption**: Result links use versioned AES-256-GCM tokens with key rotation support; device identifiers are never exposed in plaintext URLs or query strings.
- **Strict Privacy**: Automated redaction of device identifiers, result tokens, credentials, and query strings in monitoring and analytics.

---

## How It Works

The retrieval flow implements Apple's Profile Service specification for mobile device attribute query:

```
┌───────────┐                ┌─────────────────┐               ┌────────────┐
│   User    │                │   UDID Server   │               │ iOS Device │
└─────┬─────┘                └────────┬────────┘               └─────┬──────┘
      │  1. Tap "Get UDID"            │                              │
      │──────────────────────────────>│                              │
      │                               │  2. Download Profile         │
      │                               │<─────────────────────────────│
      │  3. Install Profile (Settings)│                              │
      │─────────────────────────────────────────────────────────────>│
      │                               │  4. Signed Device Response   │
      │                               │<─────────────────────────────│
      │                               │  5. 301 Redirect to /success │
      │                               │─────────────────────────────>│
      │  6. View & Copy UDID          │                              │
      │<──────────────────────────────│                              │
```

1. The user taps **Get iPhone UDID** in Mobile Safari.
2. The server delivers an enrollment profile (`.mobileconfig`) with an HMAC challenge.
3. iOS prompts the user to review and install the profile in **Settings → Profile Downloaded**.
4. iOS sends a cryptographic device payload containing the UDID and hardware metadata to `/api/retrieve`.
5. The server validates the signature and challenge, packages the payload into an AES-256-GCM bearer token, and redirects back to `/success`.
6. The user views their UDID, Serial Number, IMEI, and Model with 1-tap copy.

---

## Local Development

### Prerequisites

- Node.js >= 22.14.0
- npm >= 11.0.0

```bash
# Install pinned dependencies
npm ci --ignore-scripts --no-audit --no-fund

# Copy environment template
cp .env.example .env.local

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser. Local development defaults to unsigned configuration profiles.

### Quality Verification

Before proposing a change, run the full quality verification gate:

```bash
npm run verify
npm audit --audit-level=high
npm audit signatures
```

The verification gate enforces:

- Code formatting check (`prettier --check .`)
- Linting without warnings (`eslint . --max-warnings=0`)
- TypeScript strict checking (`tsc --noEmit`)
- Full test suite with coverage thresholds >= 90% (`vitest run --coverage`)
- Production build compilation (`next build`)

---

## Environment Variables

| Variable                            | Description                                        | Default / Example                |
| :---------------------------------- | :------------------------------------------------- | :------------------------------- |
| `NEXT_PUBLIC_SITE_ORIGIN`           | Public base URL of the deployment                  | `https://your-domain.vercel.app` |
| `PROFILE_SIGNING_MODE`              | Profile signing mode (`unsigned`, `pkcs12`, `pem`) | `unsigned` (dev only)            |
| `PROFILE_CHALLENGE_SECRET`          | Secret key for stateless HMAC challenges           | Random 32+ char string           |
| `RESULT_TOKEN_PRIMARY_KEY`          | Primary AES-256-GCM key for result URLs            | 64-character hex string          |
| `DEVICE_RESPONSE_VERIFICATION_MODE` | Verify Apple device responses (`none`, `strict`)   | `none`                           |

---

## Deployment on Vercel

This repository is optimized for deployment on [Vercel](https://vercel.com):

1. Import the repository into your Vercel dashboard.
2. Set the environment variables listed above.
3. Deploy. Vercel automatically runs `next build` and deploys the static routes and serverless API endpoints.

---

## License

[MIT](LICENSE) © UDID Tools contributors.
