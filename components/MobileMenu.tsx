"use client";

import { useState } from "react";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}

// Skládací mobilní navigace (hamburger). Na desktopu je skrytá (sm:hidden).
export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Zavřít menu" : "Otevřít menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-kraj-border text-kraj-fg"
      >
        {/* jednoduchá hamburger / křížek ikona */}
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${
              open ? "top-2 rotate-45" : "top-0.5"
            }`}
          />
          <span
            className={`absolute left-0 top-2 h-0.5 w-5 bg-current transition-opacity ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${
              open ? "top-2 -rotate-45" : "top-3.5"
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          {/* podklad pro zavření klepnutím mimo */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default bg-black/20"
          />
          <nav className="absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-kraj-border bg-kraj-bg/95 p-3 backdrop-blur">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-kraj-muted hover:bg-kraj-panel hover:text-kraj-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
