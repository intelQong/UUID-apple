import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-neutral-100 bg-neutral-50/50 py-8 text-center text-xs text-neutral-400">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} UDID Tools. Free &amp; Open Source.</p>
        <div className="flex items-center gap-6">
          <Link href="/guides" className="transition-colors hover:text-neutral-900">
            Guides
          </Link>
          <Link href="/privacy-policy" className="transition-colors hover:text-neutral-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-neutral-900">
            Terms
          </Link>
          <a
            href="https://github.com/intelQong/UUID-apple"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-neutral-900"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
