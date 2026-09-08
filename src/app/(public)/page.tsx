import {
  Benefits,
  CTABand,
  FAQ,
  FeaturedPlans,
  Hero,
  HowItWorks,
  Testimonials,
  WhyEatOmics,
} from "@/portals/customer/components/home";
import { getActivePlans } from "@/features/plans/services/planServer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const plans = await getActivePlans();

  return (
    <>
      <Hero />
      <WhyEatOmics />
      <FeaturedPlans plans={plans} />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <FAQ />
      <CTABand />
    </>
  );
}
