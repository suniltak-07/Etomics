import Link from "next/link";

export function CTABand() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="bg-brand-green mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-10">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready for wellness on autopilot?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Choose a plan, set your address, and let EatOmics handle the daily
          nutrition engineering.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/plans"
            className="text-brand-green hover:bg-brand-sand inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-medium transition"
          >
            Browse plans
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-md border border-white/40 px-6 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
