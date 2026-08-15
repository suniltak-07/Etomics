const TESTIMONIALS = [
  {
    quote:
      "I stopped negotiating breakfast with myself. EatOmics shows up, and my mornings feel quieter.",
    name: "Priya N.",
    role: "Product designer, Bengaluru",
  },
  {
    quote:
      "The Diabetic Care plan keeps my evenings consistent — portions I trust without living in a spreadsheet.",
    name: "Arjun P.",
    role: "Founder, Mumbai",
  },
  {
    quote:
      "Family Duo means we both eat well on busy weeks. Delivery is reliable and the food actually tastes considered.",
    name: "Neha G.",
    role: "Consultant, Delhi NCR",
  },
] as const;

export function Testimonials() {
  return (
    <section className="bg-brand-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-brand-navy text-3xl font-semibold tracking-tight sm:text-4xl">
            What subscribers say
          </h2>
          <p className="text-brand-muted mt-3 text-base leading-relaxed sm:text-lg">
            Real routines, fewer decisions, steadier energy.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.name}
              className="border-brand-green flex h-full flex-col border-l-2 pl-5"
            >
              <p className="text-brand-navy/90 flex-1 text-base leading-relaxed">
                “{item.quote}”
              </p>
              <footer className="mt-6">
                <p className="text-brand-navy font-medium">{item.name}</p>
                <p className="text-brand-muted text-sm">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
