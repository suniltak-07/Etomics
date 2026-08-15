const FAQS = [
  {
    q: "How are meals portioned?",
    a: "Each plan specifies calories and servings. Meals are cooked to those targets so you do not need to weigh or measure at home.",
  },
  {
    q: "Can I pause my subscription?",
    a: "Yes. From your customer dashboard you can pause for up to 7 days per cycle, or cancel at least 48 hours before renewal.",
  },
  {
    q: "Which cities do you deliver to?",
    a: "We currently deliver across Mumbai, Bengaluru, and Delhi NCR with morning and evening windows depending on your plan.",
  },
  {
    q: "Is EatOmics medical treatment?",
    a: "No. Our meals support wellness goals and may be nutritionist-designed, but they are not a substitute for medical advice or treatment.",
  },
] as const;

export function FAQ() {
  return (
    <section className="bg-brand-sand px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-brand-navy text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-brand-muted mt-3 text-base leading-relaxed sm:text-lg">
            Clear answers before you subscribe.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group border-brand-border/80 bg-brand-surface rounded-xl border px-5 py-4 open:shadow-sm"
            >
              <summary className="text-brand-navy cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-brand-green transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="text-brand-muted mt-3 text-sm leading-relaxed sm:text-base">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
