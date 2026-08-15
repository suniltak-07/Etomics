import { Check } from "lucide-react";

const BENEFITS = [
  "Portion-controlled meals calibrated to your plan",
  "Transparent macros and ingredient lists",
  "Flexible pause and resume controls",
  "City-scheduled chilled delivery windows",
  "Nutritionist-reviewed menus that rotate seasonally",
  "Dashboard tracking for subscriptions and payments",
] as const;

export function Benefits() {
  return (
    <section className="bg-brand-navy relative overflow-hidden px-4 py-20 text-white sm:px-6 lg:px-8">
      <div
        className="bg-brand-green/20 pointer-events-none absolute top-0 -right-24 size-72 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Benefits that stay with you
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            EatOmics is built for people who want wellness without the daily
            decision fatigue of cooking, shopping, and portioning.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 rounded-lg bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/90 transition hover:bg-white/10"
            >
              <Check
                className="text-brand-green-light mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
