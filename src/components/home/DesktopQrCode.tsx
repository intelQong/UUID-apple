"use client";

import Image from "next/image";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useSyncExternalStore } from "react";
import { DESKTOP_QR_URL } from "@/lib/site";

function isAppleMobileDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function DesktopQrCode() {
  const visible = useSyncExternalStore(
    () => () => undefined,
    () => !isAppleMobileDevice(),
    () => false
  );
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center">
      <Link
        href={DESKTOP_QR_URL}
        className="group inline-flex flex-col items-center rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        aria-label="Open UDID Tools mobile link with desktop QR tracking parameters"
      >
        <div className="rounded-lg border border-neutral-100 bg-white p-1.5 shadow-xs">
          <Image
            src="/desktop-qr.svg"
            alt=""
            width={140}
            height={140}
            className="h-32 w-32"
            unoptimized
          />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-500 group-hover:text-neutral-700">
          <Smartphone
            className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600"
            aria-hidden="true"
          />
          <span>Scan with iPhone to open in Safari</span>
        </div>
      </Link>
    </div>
  );
}
