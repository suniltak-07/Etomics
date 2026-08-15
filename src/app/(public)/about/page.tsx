import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how EatOmics engineers daily wellness through nutritionist-designed meal subscriptions.",
};

export default function AboutPage() {
  return (
    <div className="bg-brand-sand">
      <section className="bg-brand-navy relative isolate min-h-[50vh] overflow-hidden text-white">
        <Image
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600&q=80"
          alt="Fresh vegetables and prepared wellness meals"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="bg-brand-navy/75 absolute inset-0" />
        <div className="relative mx-auto flex min-h-[50vh] max-w-6xl flex-col justify-end px-4 py-16 sm:px-6 lg:px-8">
          <p className="animate-fade-up font-display text-2xl font-semibold tracking-tight">
            EatOmics
          </p>
          <h1 className="animate-fade-up animate-delay-100 font-display mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Wellness, engineered with care
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-brand-navy/90 text-lg leading-relaxed">
          EatOmics was built for people who want nutrition to feel intentional —
          not chaotic. We pair culinary craft with clear macros, chilled
          logistics, and subscriptions you can pause when life shifts.
        </p>
        <p className="text-brand-muted mt-6 text-base leading-relaxed">
          Our kitchens focus on portion control, seasonal ingredients, and menus
          designed with nutritionists. Whether you start with breakfast or
          commit to full-day care, every plan is engineered for daily wellness.
        </p>
        <div className="mt-10">
          <Link
            href="/plans"
            className="bg-brand-green hover:bg-brand-green-light inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium text-white transition"
          >
            Explore meal plans
          </Link>
        </div>
      </section>
    </div>
  );
}
