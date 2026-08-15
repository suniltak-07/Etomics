import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=2000&q=85";

export function Hero() {
  return (
    <section className="bg-brand-navy relative isolate -mt-[4.25rem] min-h-[100svh] overflow-hidden text-white">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Fresh wellness meals prepared with care"
          fill
          priority
          sizes="100vw"
          className="animate-hero-ken object-cover object-[center_35%]"
        />
      </div>

      {/* Atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(45,106,79,0.45),transparent_55%)]" />
      <div className="from-brand-navy via-brand-navy/78 to-brand-navy/25 absolute inset-0 bg-gradient-to-r" />
      <div className="from-brand-navy via-brand-navy/20 to-brand-navy/40 absolute inset-0 bg-gradient-to-t" />
      <div className="hero-grain absolute inset-0 opacity-[0.18] mix-blend-overlay" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pt-28 pb-16 sm:justify-center sm:px-6 sm:pt-32 sm:pb-24 lg:px-8">
        <div className="max-w-2xl space-y-7">
          <p className="animate-fade-up font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem]">
            EatOmics
          </p>

          <h1 className="animate-fade-up animate-delay-100 font-display text-[2.35rem] leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Wellness,
            <span className="text-brand-green-muted block">
              Engineered Daily
            </span>
          </h1>

          <p className="animate-fade-up animate-delay-200 max-w-lg text-base leading-relaxed text-white/78 sm:text-lg">
            Nutritionist-designed meal subscriptions — fresh,
            portion-controlled, never oily junk. Try any plan for 7 days (plan
            price ÷ 7, Sundays off).
          </p>

          <div className="animate-fade-up animate-delay-300 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/plans"
              className="group bg-brand-green hover:bg-brand-green-light inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(64,145,108,0.95)] transition-all duration-300 hover:shadow-[0_22px_44px_-16px_rgba(64,145,108,1)]"
            >
              Explore meal plans
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/8 px-7 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/16"
            >
              Start your subscription
            </Link>
          </div>
        </div>

        <a
          href="#why-etomics"
          className="animate-fade-in animate-delay-400 mt-14 inline-flex w-fit items-center gap-2 text-xs font-medium tracking-[0.18em] text-white/55 uppercase transition-colors hover:text-white/85 sm:mt-16"
        >
          Discover more
          <ArrowDown className="animate-soft-bounce size-3.5" aria-hidden />
        </a>
      </div>
    </section>
  );
}
