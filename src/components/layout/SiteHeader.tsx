"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/plans", label: "Meal Plans" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = isHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background,border,box-shadow,backdrop-filter] duration-300",
        overHero
          ? "border-b border-transparent bg-transparent"
          : "border-brand-border/50 bg-brand-sand/85 border-b shadow-[0_8px_30px_-18px_rgba(11,31,58,0.35)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={cn(
            "group flex items-center gap-2.5 transition-opacity hover:opacity-90",
            overHero ? "text-white" : "text-brand-navy",
          )}
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl transition-colors",
              overHero
                ? "bg-white/15 text-white ring-1 ring-white/25"
                : "bg-brand-navy text-brand-green-muted",
            )}
          >
            <Leaf className="size-4" aria-hidden />
          </span>
          <span className="font-display text-[1.35rem] font-semibold tracking-tight">
            Eat
            <span className={overHero ? "text-white" : "text-brand-green"}>
              Omics
            </span>
          </span>
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-1 rounded-full p-1 md:flex",
            overHero
              ? "bg-white/10 ring-1 ring-white/15"
              : "bg-brand-navy/[0.04]",
          )}
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  overHero
                    ? active
                      ? "text-brand-navy bg-white shadow-sm"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                    : active
                      ? "bg-brand-surface text-brand-navy ring-brand-border/70 shadow-sm ring-1"
                      : "text-brand-navy/70 hover:bg-brand-surface/80 hover:text-brand-navy",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
              overHero
                ? "text-white hover:bg-white/10"
                : "text-brand-ink hover:bg-brand-green-muted/50",
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all duration-200",
              overHero
                ? "text-brand-navy hover:bg-brand-sand bg-white"
                : "bg-brand-green hover:bg-brand-green-light text-white shadow-[0_10px_24px_-12px_rgba(45,106,79,0.9)] hover:shadow-[0_14px_28px_-12px_rgba(45,106,79,0.95)]",
            )}
          >
            Get started
          </Link>
        </div>

        <MobileNav overHero={overHero} />
      </div>
    </header>
  );
}
