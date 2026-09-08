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

## Step-by-Step Tutorial: Deploy on Vercel for Personal Use

You can deploy your own private, 100% free Apple UDID retrieval utility on Vercel in under 5 minutes without an Apple Developer account or paid certificates.

### Step 1: Fork or Clone the Repository

Fork this repository to your GitHub account, or clone and push it to your own repository:

```bash
git clone https://github.com/intelQong/UUID-apple.git
cd UUID-apple
```

### Step 2: Generate Cryptographic Secrets

Generate two random 32-byte base64 keys in your terminal using `openssl`:

```bash
# 1. Challenge secret (for stateless HMAC challenges)
openssl rand -base64 32

# 2. Result token encryption key (for AES-256-GCM bearer tokens)
openssl rand -base64 32
```

Save these two output strings for the next step.

### Step 3: Import Project into Vercel

1. Sign in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New… → Project**.
3. Locate and click **Import** next to your `UUID-apple` repository.
4. Set a lowercase project name (e.g. `my-udid-tool`).

### Step 4: Configure Environment Variables

Under the **Environment Variables** section in the Vercel import page, add the following variables:

| Name                                         | Example Value                                      | Description                                                  |
| :------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------- |
| `UDID_TOOLS_PUBLIC_ORIGIN`                   | `https://my-udid-tool.vercel.app`                  | Your Vercel deployment URL (HTTPS).                          |
| `UDID_TOOLS_PROFILE_SIGNING_MODE`            | `unsigned`                                         | Enables free, certificate-less profile generation.           |
| `UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64` | `dGhpcy1pcy1hLXNhbXBsZS0zMi1ieXRlLWJhc2U2NC1rZXk=` | Your 32-byte base64 secret from Step 2.                      |
| `UDID_TOOLS_RESULT_TOKEN_ACTIVE_KEY_ID`      | `2026-09`                                          | Active key identifier.                                       |
| `UDID_TOOLS_RESULT_TOKEN_KEYS`               | `{"2026-09":"<KEY_FROM_STEP_2>"}`                  | JSON keyring containing your 32-byte base64 key from Step 2. |

> **Note on `UDID_TOOLS_PUBLIC_ORIGIN`**: If you don't know your exact Vercel URL yet, you can enter your expected domain (e.g. `https://<your-project-name>.vercel.app`). After the initial deployment, you can verify your assigned Vercel URL in Project Settings and update this variable if needed.

### Step 5: Deploy & Retrieve your UDID

1. Click **Deploy**. Vercel will build and deploy the application in ~30 seconds.
2. Open your deployment link (`https://my-udid-tool.vercel.app`) in **Mobile Safari** on your iPhone or iPad.
3. Tap **Get iPhone UDID**.
4. Tap **Allow** when prompted to download the configuration profile.
5. Open your iPhone **Settings** app → tap **Profile Downloaded** near the top.
6. Tap **Install** in the top right (enter your passcode, and confirm the unsigned warning).
7. iOS will instantly query your hardware metadata and redirect back to Safari, displaying your **UDID**, **Serial Number**, **IMEI**, and **Model** with 1-tap copy buttons!

---

### Alternative: Fast CLI Deployment

If you prefer deploying directly from the command line:

```bash
# 1. Install dependencies and authenticate Vercel CLI
npm ci --ignore-scripts --no-audit --no-fund
npx vercel login

# 2. Link your project (must be lowercase)
npx vercel link --project my-udid-tool --yes

# 3. Add required environment variables
printf "https://my-udid-tool.vercel.app" | npx vercel env add UDID_TOOLS_PUBLIC_ORIGIN production
printf "unsigned" | npx vercel env add UDID_TOOLS_PROFILE_SIGNING_MODE production
openssl rand -base64 32 | npx vercel env add UDID_TOOLS_PROFILE_CHALLENGE_SECRET_BASE64 production
printf "2026-09" | npx vercel env add UDID_TOOLS_RESULT_TOKEN_ACTIVE_KEY_ID production
node -e 'console.log(JSON.stringify({"2026-09": require("crypto").randomBytes(32).toString("base64")}))' | npx vercel env add UDID_TOOLS_RESULT_TOKEN_KEYS production

# 4. Deploy to production
npx vercel --prod
```

---

## License

[MIT](LICENSE) © UDID Tools contributors.
