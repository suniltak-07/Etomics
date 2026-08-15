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
import { getFeaturedPlans } from "@/features/plans/services/planServer";

export default function HomePage() {
  const featuredPlans = getFeaturedPlans();

  return (
    <>
      <Hero />
      <WhyEatOmics />
      <FeaturedPlans plans={featuredPlans} />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <FAQ />
      <CTABand />
    </>
  );
}
