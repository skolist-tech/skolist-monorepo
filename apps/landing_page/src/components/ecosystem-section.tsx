import { useEffect, useRef } from "react";

import { EcosystemSvg } from "./ecosystem_svg_laptop";
import { EcosystemSVGMobile } from "./ecosystem_svg_mobile";


export function EcosystemSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      // Centers the horizontal scroll for mobile users on load
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    }
  }, []);

  return (
    <section className="bg-blue-100/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-10 text-center md:mb-16">
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Skolist Ecosystem
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
            Each Skolist product solves a specific problem, but together they
            create a complete learning loop.
          </p>
        </div>

        {/* The Scroll & Scaling Container */}
        <div
          ref={scrollRef}
          className="-overflow-x-auto md:pb-4 md:overflow-visible custom-scrollbar"
        >
          <div className="flex origin-top scale-[0.4] justify-center transition-transform duration-300 md:min-w-0 md:scale-100 -mb-[85%] md:mb-0">
            {/* Conditional SVG Logic Merged Here */}
            <div className="w-full flex justify-center">
              <div className="md:hidden">
                <EcosystemSVGMobile />
              </div>
              <div className="hidden md:block w-full max-w-5xl">
                <EcosystemSvg />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}