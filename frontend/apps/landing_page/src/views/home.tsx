import { HeroSection } from "../components/hero-section";
import { ProductsSection } from "../components/products-section";
import { WhoSkolistForSection } from "../components/who-skolist-for-section";
import { HowSkolistHelpsSection } from "../components/how-skolist-helps-section";
import { EcosystemSection } from "../components/ecosystem-section";
import { BuiltWithRigorSection } from "../components/built-with-rigor-section";
import { TestimonialsSection } from "../components/testimonials-section";
import { CommunityCTA } from "../components/community-cta";

export function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProductsSection />
      <WhoSkolistForSection />
      <HowSkolistHelpsSection />
      <EcosystemSection />
      <BuiltWithRigorSection />
      <TestimonialsSection />
      <CommunityCTA />
    </div>
  );
}
