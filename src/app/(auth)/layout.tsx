import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-brand-sand relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(216,232,223,0.9),_transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-brand-navy inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="bg-brand-navy text-brand-green-muted flex size-10 items-center justify-center rounded-xl">
              <Leaf className="size-4" aria-hidden />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">
              Eat<span className="text-brand-green">Omics</span>
            </span>
          </Link>
          <p className="text-brand-muted mt-2 text-sm">
            Wellness, Engineered Daily
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
