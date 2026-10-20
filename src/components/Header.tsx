"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Translate" },
  { href: "/history", label: "History" },
  { href: "/about", label: "Guide" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-line/80 bg-bg/90 px-5 py-4 backdrop-blur md:px-8">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold text-bg shadow-[0_0_24px_rgba(232,184,109,0.35)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7 11V6.5a1.5 1.5 0 1 1 3 0V11h1V4.5a1.5 1.5 0 1 1 3 0V11h1V6.75a1.5 1.5 0 1 1 3 0V14a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6v-2.5a1.5 1.5 0 1 1 3 0V11z"
            />
          </svg>
        </span>
        <span>
          <span className="block font-display text-lg leading-none tracking-tight">Sign Language Translator</span>
          <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-muted">Hand to English</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex items-center gap-1 rounded-full border border-line bg-panel/80 p-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active ? "bg-gold text-bg" : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
