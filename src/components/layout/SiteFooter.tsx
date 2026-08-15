import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/plans", label: "Meal Plans" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Log in" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-brand-border/70 bg-brand-navy mt-auto border-t text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <div className="space-y-4">
          <p className="font-display text-2xl font-semibold tracking-tight">
            Eat<span className="text-brand-green-muted">Omics</span>
          </p>
          <p className="max-w-md text-sm leading-relaxed text-white/70">
            Wellness, Engineered Daily — nutritionist-designed meal
            subscriptions delivered fresh to your door.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              Explore
            </p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              Contact
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a
                  href="mailto:hello@etomics.com"
                  className="transition-colors hover:text-white"
                >
                  hello@etomics.com
                </a>
              </li>
              <li>Mumbai · Bengaluru · Delhi NCR</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} EatOmics. All rights reserved.</p>
          <p>Portion-controlled meals for everyday wellness.</p>
        </div>
      </div>
    </footer>
  );
}
