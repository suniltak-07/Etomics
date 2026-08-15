import { Leaf, FlaskConical, Truck } from "lucide-react";

const REASONS = [
  {
    icon: FlaskConical,
    title: "Engineered nutrition",
    body: "Every plate is macro-balanced by nutritionists — not guesswork, not trends.",
  },
  {
    icon: Leaf,
    title: "Fresh ingredients",
    body: "Seasonal produce, lean proteins, and whole foods prepared the same day they ship.",
  },
  {
    icon: Truck,
    title: "Reliable delivery",
    body: "Chilled drops on your schedule so wellness fits the life you already live.",
  },
] as const;

export function WhyEatOmics() {
  return (
    <section
      id="why-etomics"
      className="bg-brand-sand scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-brand-navy text-3xl font-semibold tracking-tight sm:text-4xl">
            Why EatOmics
          </h2>
          <p className="text-brand-muted mt-3 text-base leading-relaxed sm:text-lg">
            We treat daily meals like a system — precise, calm, and built for
            lasting energy. Please do not expect oily, spicy, junk, or typical
            tiffin-shop food; we cook only wellness plates.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {REASONS.map((reason) => (
            <div key={reason.title} className="space-y-4">
              <div className="bg-brand-green-muted text-brand-green inline-flex size-11 items-center justify-center rounded-full">
                <reason.icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-brand-navy text-xl font-semibold">
                {reason.title}
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed sm:text-base">
                {reason.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
