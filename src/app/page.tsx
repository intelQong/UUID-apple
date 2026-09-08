import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, Download, Lock, ShieldCheck } from "lucide-react";
import { DesktopQrCode } from "@/components/home/DesktopQrCode";
import { QrAttributionTracker } from "@/components/home/QrAttributionTracker";
import { PageShell } from "@/components/PageShell";
import { SAMPLE_RESULT_URL } from "@/lib/site";

const steps = [
  {
    num: "01",
    title: "Download Profile",
    desc: 'Tap "Get UDID" in Mobile Safari to download the lightweight enrollment profile.',
  },
  {
    num: "02",
    title: "Review in Settings",
    desc: "Open Settings → Profile Downloaded and tap Install with your device passcode.",
  },
  {
    num: "03",
    title: "Instant Copy",
    desc: "Safari automatically opens displaying your verified UDID, Serial Number, IMEI, and Model.",
  },
];

const faqs = [
  {
    q: "Can I retrieve my iPhone or iPad UDID without cables?",
    a: "Yes. By using Apple's official Profile Service specification, iOS sends device attributes directly from Mobile Safari without iTunes, Finder, cables, or desktop software.",
  },
  {
    q: "Is it safe to install this profile?",
    a: "Yes. The profile is temporary and only requests read access to device identification attributes (UDID, IMEI, Serial Number). It cannot access your photos, messages, apps, or private data.",
  },
  {
    q: "Does this website store or log my device data?",
    a: "No. The system is completely stateless with zero databases. Payloads are encrypted in volatile memory using AES-256-GCM tokens and immediately handed back to Safari.",
  },
  {
    q: "How do I remove the profile after getting my UDID?",
    a: "iOS automatically removes single-use enrollment profiles, or you can verify in Settings → General → VPN & Device Management.",
  },
];

export default function Home() {
  return (
    <PageShell>
      <QrAttributionTracker />
      <main className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        {/* Minimal Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Direct in Safari • Zero Storage • Free</span>
        </div>

        {/* Headline */}
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl md:text-6xl">
          Get your Apple UDID
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-500">
          Retrieve your device identifiers directly in Mobile Safari without iTunes, Finder, cables,
          or third-party software.
        </p>

        {/* Primary Action Card */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs sm:p-8">
          <a
            href="/api/register.signed.mobileconfig"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99]"
          >
            <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Get iPhone / iPad UDID</span>
          </a>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-400">
            <Link
              href={SAMPLE_RESULT_URL}
              className="inline-flex items-center gap-1 transition-colors hover:text-neutral-700"
            >
              <span>View sample result</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <span>•</span>
            <span>iOS 12+ required</span>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-6">
            <DesktopQrCode />
          </div>
        </div>

        {/* Minimal 3-Step Process */}
        <div className="mt-16 text-left">
          <h2 className="text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            How it works
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5"
              >
                <span className="font-mono text-xs text-neutral-400">{step.num}</span>
                <h3 className="mt-2 text-sm font-medium text-neutral-900">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-neutral-400" />
            Zero databases or disk storage
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-neutral-400" />
            AES-256-GCM encrypted tokens
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-neutral-400" />
            100% Free &amp; Open Source
          </span>
        </div>

        {/* Minimal Expandable FAQ */}
        <div className="mx-auto mt-16 max-w-xl border-t border-neutral-100 pt-12 text-left">
          <h2 className="text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 divide-y divide-neutral-100">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-neutral-800 transition-colors hover:text-neutral-600">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-xs leading-relaxed text-neutral-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
