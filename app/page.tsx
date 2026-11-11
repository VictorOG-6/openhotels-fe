import Destinations from "@/components/home/destinations";
import ExclusiveRates from "@/components/home/exclusive-rates";
import Hero from "@/components/home/hero";
import { Editorial, Facilities, HowItWorks, Testimonials } from "@/components/home/marketing";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ExclusiveRates />
      <Facilities />
      <Destinations />
      <Testimonials />
      <HowItWorks />
      <Editorial />
    </>
  );
}
