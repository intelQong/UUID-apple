# Apple UDID Retrieval Utility

[![CI](https://github.com/intelQong/UUID-apple/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/intelQong/UUID-apple/actions/workflows/ci.yml)
[![Security](https://github.com/intelQong/UUID-apple/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/intelQong/UUID-apple/actions/workflows/security.yml)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.14-339933?logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A minimal, privacy-first Apple UDID retrieval utility and developer guide for iPhone and iPad. Retrieve your device UDID, Serial Number, IMEI, MEID, and model directly in Mobile Safari without iTunes, Finder, cables, or third-party desktop software. Built with Next.js App Router and deployed seamlessly on Vercel.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Project Structure](#project-structure)
- [API Endpoints Reference](#api-endpoints-reference)
- [Local Development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Setup & Running](#setup--running)
  - [Quality Verification & Testing](#quality-verification--testing)
- [Privacy & Zero Data Retention](#privacy--zero-data-retention)
- [Environment Variables](#environment-variables)
- [Step-by-Step Vercel Deployment Tutorial](#step-by-step-vercel-deployment-tutorial)
  - [Option A: Free Personal Deployment (Unsigned Profile)](#option-a-free-personal-deployment-unsigned-profile)
  - [Option B: Enterprise Deployment (Signed Profile)](#option-b-enterprise-deployment-signed-profile)
  - [CLI Fast Deployment](#cli-fast-deployment)
- [Developer Guides](#developer-guides)
- [License](#license)

---

## Features

- **Direct Mobile Safari Flow**: Retrieve device identifiers directly in Mobile Safari on iOS 12+. No Mac, PC, Lightning/USB-C cables, Apple ID, iTunes, Finder, or Xcode required.
- **Minimal, Distraction-Free Interface**: Modern, ultra-clean UI with responsive design and instant feedback.
- **Desktop-to-Mobile QR Handoff**: Desktop visitors see an interactive QR code to instantly transition to Safari on their iPhone or iPad with zero friction.
- **Zero Server-Side Storage**: No database (no SQL, MongoDB, Redis, or KV stores) and no disk storage. Device attributes are processed strictly in volatile memory.
- **Authenticated Cryptography (AES-256-GCM)**: Device attributes are delivered to the results page using versioned AES-256-GCM bearer tokens with keyring rotation support. Identifiers are never exposed in plaintext URLs.
- **Stateless Anti-Replay Challenges**: HMAC-SHA256 enrollment challenge tokens with clock-skew bounds and cryptographic expiration prevent tampering and replay attacks.
- **Strict Privacy & Scrubbed Telemetry**: Automated redaction of UDID, IMEI, MEID, serial numbers, result tokens, and query strings in monitoring and error telemetry.
- **1-Tap Quick Copy**: Instant copying for individual fields (UDID, Serial Number, IMEI, Model) or export as plain text and JSON.
- **Dual Profile Modes**: Works out of the box with unsigned profiles (100% free, no Apple Developer account required) or signed profiles using PKCS#12 Apple Developer certificates.

---

## How It Works

The service leverages Apple's official **Profile Service** mobile device attribute query specification:

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

1. **Profile Request**: User taps **Get iPhone / iPad UDID** in Mobile Safari. The server serves a lightweight `.mobileconfig` payload containing an embedded, cryptographically signed HMAC challenge callback URL (`/api/retrieve`).
2. **Profile Download & Approval**: iOS downloads the profile and prompts the user to review and install it in **Settings → Profile Downloaded**.
3. **Hardware Query**: iOS verifies user consent via passcode, queries internal device hardware attributes (`UDID`, `SERIAL`, `IMEI`, `MEID`, `PRODUCT`, `VERSION`), and posts a signed CMS response back to `/api/retrieve`.
4. **Validation & Token Creation**: The server validates the cryptographic challenge and payload signature, serializes device attributes into an encrypted versioned AES-256-GCM bearer token, and issues an HTTP 301 redirect back to `/success?result=<token>`.
5. **Display & Copy**: Safari loads the results view, decrypts the token server-side, resolves the Apple model code (e.g., `iPhone16,1` → _iPhone 15 Pro_), and provides 1-tap copy tools.

---

## Tech Stack & Architecture

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) with Turbopack compilation.
- **Runtime**: [Node.js](https://nodejs.org) >= 22.14.0 (LTS).
- **UI & Styling**: [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Lucide React](https://lucide.dev) icons.
- **Core Cryptography & Enrollment**: [`@udid-tools/core`](https://github.com/udid-tools/core) for Apple Profile Service generation and device CMS response parsing.
- **Device Metadata**: [`@udid-tools/device-info`](https://github.com/udid-tools/device-info) for hardware identifier to marketing name resolution.
- **Testing**: [Vitest 4](https://vitest.dev) with V8 code coverage, [fast-check](https://github.com/dubzzz/fast-check) for property-based fuzz testing.
- **Code Quality**: [ESLint 9](https://eslint.org) and [Prettier](https://prettier.io).
- **Hosting & Edge**: [Vercel](https://vercel.com) Serverless Functions and Edge Middleware.

---

## Project Structure

```
UUID-apple/
├── .github/
│   └── workflows/                # CI, security scanning, fuzz testing, and release actions
├── public/                       # Static brand assets, icons, and desktop QR code
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── register.signed.mobileconfig/  # Serves Apple enrollment profile
│   │   │   ├── retrieve/                      # Receives Apple device payload & redirects
│   │   │   └── analytics/result-action/       # Privacy-safe categorical event tracking
│   │   ├── guides/                            # Developer guides & SEO resources
│   │   │   ├── [slug]/page.tsx                # Dynamic guide renderer
│   │   │   └── page.tsx                       # Guide index
│   │   ├── privacy-policy/                    # Comprehensive privacy policy
│   │   ├── terms/                             # Terms of service
│   │   ├── success/                           # Result display page with 1-tap copy
│   │   ├── layout.tsx                         # Root layout shell with metadata
│   │   ├── page.tsx                           # Minimal home page with desktop QR handoff
│   │   ├── robots.ts                          # Dynamic robots.txt
│   │   └── sitemap.ts                         # Dynamic sitemap.xml
│   ├── components/
│   │   ├── home/                              # DesktopQrCode and QrAttributionTracker
│   │   ├── legal/                             # Shared LegalPage container
│   │   └── success/                           # DeviceInfoCard and ResultView
│   ├── content/
│   │   └── guides.ts                          # Hardcoded guide content & FAQs
│   ├── lib/
│   │   ├── __tests__/                         # Comprehensive unit & fuzz tests
│   │   ├── observability/                     # Sentry telemetry & PII scrubbers
│   │   ├── profile-challenge.ts               # HMAC-SHA256 stateless challenge handling
│   │   ├── profile-service.ts                 # Profile generation & parsing bridge
│   │   ├── result-token.ts                    # AES-256-GCM token encryption & keyring
│   │   ├── server-config.ts                   # Environment variable parser & validator
│   │   └── site.ts                            # Site constants & URLs
│   └── utils/
│       ├── __tests__/                         # Utility unit tests
│       └── clipboard.ts                       # Clipboard writing helper with fallbacks
├── vitest.config.ts                           # Vitest and coverage configuration
├── next.config.ts                             # Next.js security headers & Turbopack settings
└── package.json                               # Exactly pinned project dependencies
```

---

## API Endpoints Reference

### 1. Enrollment Profile Endpoint

```http
GET /api/register.signed.mobileconfig
```

- **Description**: Generates an Apple `.mobileconfig` XML payload with an embedded HMAC-SHA256 challenge.
- **Content-Type**: `application/x-apple-aspen-config`
- **Headers**:
  - `Content-Disposition: attachment; filename="udid-tools.mobileconfig"`
  - `Cache-Control: private, no-cache, no-store, must-revalidate`

### 2. Device Callback Endpoint

```http
POST /api/retrieve
```

- **Description**: Callback URL specified in the profile. Receives the Apple device payload, validates challenge expiration and CMS signature, encrypts attributes into a bearer token, and redirects.
- **Content-Type**: `application/pkcs7-signature` or `application/x-apple-aspen-config`
- **Response**: HTTP 301 Permanent Redirect to `/success?result=<AES-256-GCM_TOKEN>`

### 3. Analytics Endpoint

```http
POST /api/analytics/result-action
```

- **Description**: Privacy-safe categorical event logging (e.g., `copy_udid`, `export_json`).
- **Body**: `{ "eventName": string, "attributes": Record<string, string | number | boolean> }`
- **Guarantee**: Never accepts or logs device identifiers, query strings, or sensitive tokens.

---

## Local Development

### Prerequisites

- **Node.js**: `>= 22.14.0`
- **npm**: `>= 11.0.0`

### Setup & Running

```bash
# 1. Clone the repository
git clone https://github.com/intelQong/UUID-apple.git
cd UUID-apple

# 2. Install exact pinned dependencies (without running lifecycle scripts)
npm ci --ignore-scripts --no-audit --no-fund

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Local development runs in unsigned profile mode by default.

### Quality Verification & Testing

Before proposing changes or pushing code, run the full verification gate:

```bash
npm run verify
```

The `verify` command runs all quality gates in strict mode:

- **Prettier**: `npm run format:check`
- **ESLint**: `npm run lint` (zero warnings allowed)
- **TypeScript**: `npm run typecheck` (`tsc --noEmit`)
- **Coverage**: `npm run test:coverage` (enforcing >= 90% lines, functions, statements, and branches)
- **Production Build**: `npm run build`

You can also run individual commands:

```bash
# Run unit tests
npm run test

# Run property-based cryptographic fuzz testing
npm run test:fuzz

# Auto-format codebase
npm run format

# Run audit checks
npm audit --audit-level=high
npm audit signatures
```

---

## Privacy & Zero Data Retention

This repository and service are designed with strict data minimization principles:

- **Zero Databases & Persistent Storage**: No SQL, NoSQL, Redis, disk caches, or key-value stores.
- **Ephemeral Processing**: Hardware attributes are held in volatile server memory only during the few milliseconds required to assemble the encrypted bearer token.
- **End-to-End Authenticated Encryption (AES-256-GCM)**: Device attributes are delivered to the user's browser inside an AES-256-GCM encrypted token. Plaintext device identifiers are never exposed in query strings, server logs, or database rows.
- **Zero Logging Policy**: Serverless routes contain zero logging statements for device identifiers (`UDID`, `IMEI`, `MEID`, `Serial Number`).
- **Telemetry Sanitization**: All error telemetry (Sentry) strips query strings, request bodies, cookies, and device identifiers before transmission.
- **No Apple Developer Account Required**: Fully supports unsigned configuration profiles for personal and self-hosted usage.

---

## Environment Variables

| Variable                                           |    Required    | Description                                                                               | Default / Example                                                     |
| :------------------------------------------------- | :------------: | :---------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| `UDID_TOOLS_PUBLIC_ORIGIN`                         | **Yes** (prod) | Canonical public HTTPS base URL of your site.                                             | `https://my-udid-tool.vercel.app` (or `http://localhost:3000` in dev) |
| `UDID_TOOLS_PROFILE_SIGNING_MODE`                  |       No       | Profile signing mode (`unsigned` or `signed`).                                            | `unsigned`                                                            |
| `UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64`       | **Yes** (prod) | 32-byte base64 secret key for stateless HMAC-SHA256 challenges.                           | Generate with `openssl rand -base64 32`                               |
| `UDID_TOOLS_RESULT_TOKEN_ACTIVE_KEY_ID`            | **Yes** (prod) | Active key ID in the AES-256-GCM keyring.                                                 | `2026-09`                                                             |
| `UDID_TOOLS_RESULT_TOKEN_KEYS`                     | **Yes** (prod) | JSON keyring of 32-byte base64 AES keys: `{"<keyId>":"<base64-key>"}`.                    | `{"2026-09":"<32-byte-base64-key>"}`                                  |
| `UDID_TOOLS_PROFILE_RESPONSE_VERIFICATION_MODE`    |       No       | Apple response verification (`signature`, `none`, or `trust-chain`).                      | `signature`                                                           |
| `UDID_TOOLS_PROFILE_SIGNING_PKCS12_BASE64`         |  Conditional   | Base64-encoded Apple Developer `.p12` certificate (required if signing mode is `signed`). | Base64 string                                                         |
| `UDID_TOOLS_PROFILE_SIGNING_PKCS12_PASSPHRASE`     |  Conditional   | Passphrase for the `.p12` certificate.                                                    | `my-secret-passphrase`                                                |
| `UDID_TOOLS_PROFILE_SIGNING_CERTIFICATE_CHAIN_PEM` |       No       | Optional PEM intermediate certificate chain for profile signing.                          | `-----BEGIN CERTIFICATE-----...`                                      |
| `UDID_TOOLS_PROFILE_RESPONSE_TRUST_ANCHORS_PEM`    |  Conditional   | Root PEM trust anchors (required when verification mode is `trust-chain`).                | `-----BEGIN CERTIFICATE-----...`                                      |
| `UDID_TOOLS_PROFILE_RESPONSE_INTERMEDIATES_PEM`    |       No       | Intermediate PEM certificates when verification mode is `trust-chain`.                    | `-----BEGIN CERTIFICATE-----...`                                      |
| `NEXT_PUBLIC_SENTRY_DSN`                           |       No       | Sentry Data Source Name for privacy-scrubbed error monitoring.                            | `https://...@sentry.io/...`                                           |
| `UDID_TOOLS_FUZZ_RUNS`                             |       No       | Number of fuzz test iterations executed during `npm run test:fuzz`.                       | `1000`                                                                |

---

## Step-by-Step Vercel Deployment Tutorial

Deploy your own private, 100% free Apple UDID retrieval utility on Vercel in under 5 minutes.

### Option A: Free Personal Deployment (Unsigned Profile)

_No Apple Developer account or paid certificate required._

#### Step 1: Fork or Clone the Repository

Fork this repository to your GitHub account, or clone and push it to your personal repository:

```bash
git clone https://github.com/intelQong/UUID-apple.git
cd UUID-apple
```

#### Step 2: Generate Cryptographic Secrets

Generate two random 32-byte base64 keys using `openssl`:

```bash
# 1. Challenge secret (HMAC-SHA256 challenges)
openssl rand -base64 32

# 2. Result token encryption key (AES-256-GCM tokens)
openssl rand -base64 32
```

#### Step 3: Import Project into Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New… → Project**.
3. Locate and click **Import** next to your repository.
4. Name your project (e.g. `my-udid-tool`).

#### Step 4: Configure Environment Variables

Under **Environment Variables**, add:

| Name                                         | Value                               | Note                                         |
| :------------------------------------------- | :---------------------------------- | :------------------------------------------- |
| `UDID_TOOLS_PUBLIC_ORIGIN`                   | `https://<your-project>.vercel.app` | Deployment domain (must use HTTPS).          |
| `UDID_TOOLS_PROFILE_SIGNING_MODE`            | `unsigned`                          | Enables certificate-less profile generation. |
| `UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64` | _[Key 1 from Step 2]_               | 32-byte base64 secret.                       |
| `UDID_TOOLS_RESULT_TOKEN_ACTIVE_KEY_ID`      | `2026-09`                           | Active key identifier.                       |
| `UDID_TOOLS_RESULT_TOKEN_KEYS`               | `{"2026-09":"[Key 2 from Step 2]"}` | JSON keyring mapping key ID to AES key.      |

#### Step 5: Deploy & Retrieve

1. Click **Deploy**. Vercel compiles and publishes the application in seconds.
2. Open your Vercel URL in **Mobile Safari** on your iPhone or iPad.
3. Tap **Get iPhone / iPad UDID** → Tap **Allow**.
4. Open **Settings → Profile Downloaded** → Tap **Install** (enter passcode and confirm the unsigned warning).
5. iOS automatically redirects to Safari displaying your **UDID**, **Serial Number**, **IMEI**, and **Model** with 1-tap copy!

---

### Option B: Enterprise Deployment (Signed Profile)

_Shows a verified green checkmark in iOS Settings without an unsigned profile warning._

1. Export an Apple Developer certificate and private key as a `.p12` file from Keychain Access on macOS.
2. Convert the `.p12` file to base64:
   ```bash
   base64 -i my-cert.p12 | tr -d '\n'
   ```
3. In Vercel Environment Variables, set:
   - `UDID_TOOLS_PROFILE_SIGNING_MODE`: `signed`
   - `UDID_TOOLS_PROFILE_SIGNING_PKCS12_BASE64`: _[Base64 output from step 2]_
   - `UDID_TOOLS_PROFILE_SIGNING_PKCS12_PASSPHRASE`: _[Passphrase set during export]_
   - `UDID_TOOLS_PROFILE_SIGNING_CERTIFICATE_CHAIN_PEM`: _(Optional)_ Apple Worldwide Developer Relations Intermediate CA certificate in PEM format.

---

### CLI Fast Deployment

Deploy directly from your terminal using Vercel CLI:

```bash
# 1. Install dependencies and authenticate
npm ci --ignore-scripts --no-audit --no-fund
npx vercel login

# 2. Link your project
npx vercel link --project my-udid-tool --yes

# 3. Add required production environment variables
printf "https://my-udid-tool.vercel.app" | npx vercel env add UDID_TOOLS_PUBLIC_ORIGIN production
printf "unsigned" | npx vercel env add UDID_TOOLS_PROFILE_SIGNING_MODE production
openssl rand -base64 32 | npx vercel env add UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64 production
printf "2026-09" | npx vercel env add UDID_TOOLS_RESULT_TOKEN_ACTIVE_KEY_ID production
node -e 'console.log(JSON.stringify({"2026-09": require("crypto").randomBytes(32).toString("base64")}))' | npx vercel env add UDID_TOOLS_RESULT_TOKEN_KEYS production

# 4. Deploy to production
npx vercel --prod
```

---

## Developer Guides

The application includes in-depth developer documentation covering iOS device registration and provisioning:

- [`/guides/how-to-find-iphone-udid`](https://www.udid.tools/guides/how-to-find-iphone-udid): Step-by-step walkthrough to find iPhone UDID in Safari.
- [`/guides/get-udid-without-itunes`](https://www.udid.tools/guides/get-udid-without-itunes): How to retrieve UDID without iTunes, Finder, or desktop software.
- [`/guides/what-is-udid`](https://www.udid.tools/guides/what-is-udid): Technical explanation of Apple Unique Device Identifiers.
- [`/guides/udid-for-app-testing`](https://www.udid.tools/guides/udid-for-app-testing): Using UDIDs for Ad-Hoc provisioning and TestFlight internal builds.
- [`/guides/is-it-safe-to-share-udid`](https://www.udid.tools/guides/is-it-safe-to-share-udid): Security implications and best practices for sharing device identifiers.
- [`/guides/udid-vs-serial-number-vs-imei`](https://www.udid.tools/guides/udid-vs-serial-number-vs-imei): Comparison between UDID, Serial Number, IMEI, and MEID.

---

## License

[MIT](LICENSE) © UDID Tools contributors.
