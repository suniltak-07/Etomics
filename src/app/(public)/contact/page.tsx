import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/portals/customer/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the EatOmics team for plan questions, delivery, or partnerships.",
};

export default function ContactPage() {
  return (
    <div className="bg-brand-sand">
      <section className="border-brand-border/60 bg-brand-navy border-b px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="animate-fade-up mx-auto max-w-6xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Contact
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Questions about plans, delivery windows, or partnerships? We are
            here to help.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="bg-brand-green-muted text-brand-green inline-flex size-10 shrink-0 items-center justify-center rounded-full">
              <Mail className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-brand-navy font-medium">Email</p>
              <a
                href="mailto:hello@etomics.com"
                className="text-brand-muted hover:text-brand-green text-sm transition-colors"
              >
                hello@etomics.com
              </a>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-brand-green-muted text-brand-green inline-flex size-10 shrink-0 items-center justify-center rounded-full">
              <Phone className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-brand-navy font-medium">Phone</p>
              <p className="text-brand-muted text-sm">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-brand-green-muted text-brand-green inline-flex size-10 shrink-0 items-center justify-center rounded-full">
              <MapPin className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-brand-navy font-medium">Delivery cities</p>
              <p className="text-brand-muted text-sm">
                Mumbai · Bengaluru · Delhi NCR
              </p>
            </div>
          </div>
        </div>

        <ContactForm />
      </section>
    </div>
  );
}
