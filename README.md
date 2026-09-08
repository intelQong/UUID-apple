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

## Privacy & Zero Personal Data Retention

This repository and website are architected from the ground up to guarantee strict user privacy:

- **Zero Databases & Persistent Storage**: There is no database (no SQL, MongoDB, Redis, or KV storage) and no disk storage. Device attributes are never saved, cached, or persisted anywhere on the server.
- **In-Memory Ephemeral Processing**: When iOS transmits the device payload to `/api/retrieve`, the data exists purely in volatile server memory for the few milliseconds required to construct the encrypted result token.
- **Authenticated Encryption (AES-256-GCM)**: Device attributes are delivered to the user's browser using versioned AES-256-GCM bearer tokens. Plaintext identifiers are never exposed in URLs or stored on the backend.
- **Zero Logging Policy**: Serverless functions contain zero `console.log` statements and return generic error responses. Device identifiers, UDIDs, IMEIs, MEIDs, and serial numbers are never placed in logs.
- **Telemetry & PII Scrubbing**: Request body capture and default PII in Sentry are disabled. All query strings, cookies, and sensitive payload keys are stripped before error events are dispatched. Analytics track only categorical user actions (e.g. "copy button clicked"), never raw device identifiers.
- **No Apple Developer Certificate Required**: Supports unsigned `.mobileconfig` profiles out of the box. iOS allows installing unsigned configuration profiles with standard on-device user confirmation, requiring no Apple Developer accounts or paid certificates.

---

## Environment Variables

| Variable                                        | Description                                                                  | Default / Example             |
| :---------------------------------------------- | :--------------------------------------------------------------------------- | :---------------------------- |
| `UDID_TOOLS_PUBLIC_ORIGIN`                      | Public base URL of the deployment (e.g., `https://uuid-apple.vercel.app`)    | `http://localhost:3000` (dev) |
| `UDID_TOOLS_PROFILE_SIGNING_MODE`               | Profile signing mode (`unsigned` or `signed`)                                | `unsigned`                    |
| `UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64`    | Canonical 32-byte base64 secret key for stateless HMAC challenges            | `openssl rand -base64 32`     |
| `UDID_TOOLS_RESULT_TOKEN_ACTIVE_KEY_ID`         | Active key ID for the AES-256-GCM keyring                                    | `2026-09`                     |
| `UDID_TOOLS_RESULT_TOKEN_KEYS`                  | JSON keyring of 32-byte base64 AES keys: `{"2026-09":"<base64-key>"}`        | `{"2026-09":"..."}`           |
| `UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE` | Apple device response verification (`signature`, `none`, or `trust-chain`)   | `signature`                   |
| `UDID_TOOLS_PROFILE_SIGNING_PKCS12_BASE64`      | (Optional) Base64 Apple Developer `.p12` certificate for signed profile mode |                               |
| `UDID_TOOLS_PROFILE_SIGNING_PKCS12_PASSPHRASE`  | (Optional) Passphrase for the PKCS#12 certificate                            |                               |

---

## Deployment on Vercel

This repository is optimized for one-click or CLI deployment on [Vercel](https://vercel.com):

1. Import the repository into your Vercel dashboard (or run `npx vercel`).
2. Configure the required environment variables listed above.
3. Deploy. Vercel automatically compiles `next build` and hosts both the static assets and the serverless profile endpoints.

---

## License

[MIT](LICENSE) © UDID Tools contributors.
