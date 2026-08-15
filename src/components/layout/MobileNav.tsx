"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/plans", label: "Meal Plans" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function MobileNav({ overHero = false }: { overHero?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full transition-colors md:hidden",
          overHero
            ? "text-white hover:bg-white/15"
            : "text-brand-navy hover:bg-brand-green-muted/50",
        )}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          className={cn(
            "bg-brand-navy/50 absolute inset-0 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <div
          className={cn(
            "border-brand-border/60 bg-brand-sand absolute inset-x-3 top-3 overflow-hidden rounded-3xl border shadow-[0_30px_80px_-30px_rgba(11,31,58,0.55)] transition-all duration-300",
            open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}
        >
          <div className="border-brand-border/50 flex items-center justify-between border-b px-4 py-3">
            <p className="font-display text-brand-navy text-lg font-semibold">
              Eat<span className="text-brand-green">Omics</span>
            </p>
            <button
              type="button"
              className="text-brand-navy hover:bg-brand-green-muted/50 inline-flex size-9 items-center justify-center rounded-full"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-brand-navy hover:bg-brand-green-muted/45 rounded-2xl px-4 py-3.5 text-base font-medium transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-brand-border/60 mt-2 grid gap-2 border-t pt-3">
              <Link
                href="/login"
                className="text-brand-navy hover:bg-brand-green-muted/40 rounded-2xl px-4 py-3 text-center text-sm font-medium transition-colors"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-brand-green hover:bg-brand-green-light inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition-colors"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
