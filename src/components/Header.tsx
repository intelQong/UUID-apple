import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Logo />
        <nav className="flex items-center gap-6" aria-label="Main navigation">
          <Link
            href="/guides"
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Guides
          </Link>
          <a
            href="https://github.com/intelQong/UUID-apple"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            GitHub
          </a>
          <a
            href="/api/register.signed.mobileconfig"
            className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-neutral-800 active:scale-95"
          >
            Get UDID
          </a>
        </nav>
      </div>
    </header>
  );
}
