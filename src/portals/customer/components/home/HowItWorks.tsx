const STEPS = [
  {
    step: "01",
    title: "Choose your plan",
    body: "Pick breakfast, dinner, full-day care, or family servings — matched to your goals.",
  },
  {
    step: "02",
    title: "Set delivery",
    body: "Share your address and preferred window. Pause or adjust anytime from your dashboard.",
  },
  {
    step: "03",
    title: "Eat with intention",
    body: "Fresh meals arrive chilled and ready — portioned, labeled, and ready for your day.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-brand-sand px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-brand-navy text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="text-brand-muted mt-3 text-base leading-relaxed sm:text-lg">
            Three calm steps from browse to first delivery.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step} className="relative space-y-3">
              <p className="font-display text-brand-green/30 text-4xl font-semibold">
                {item.step}
              </p>
              <h3 className="font-display text-brand-navy text-xl font-semibold">
                {item.title}
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed sm:text-base">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
