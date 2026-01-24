import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const testimonials = [
  {
    quote:
      "Even at an early stage, Skolist is helping teachers identify specific areas where students struggle. The pilot feedback has been encouraging, and we're interested in how it evolves",
    author: "Manoj Gandhi",
    role: "Head of Academics",
  },
  {
    quote:
      "During the pilot, Skolist has helped us better visualize student progress beyond test scores. We see potential in using these insights to guide more focused classroom interventions",
    author: "Rajesh Kumar",
    role: "Academic Director",
  },
  {
    quote:
      "After discussing the concept with the founders, we found the idea compelling and well-thought-out. We're keen to pilot this and see how it works in a real classroom setting",
    author: "Dr. Jaya Agarwal",
    role: "Principal",
  },
];

export function TestimonialsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tweenValues, setTweenValues] = useState<number[]>([]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onScroll = useCallback(() => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }

      // Clamp the value between -1 and 1 for consistent animation
      return Math.max(-1, Math.min(1, diffToTarget * 2.5));
    });

    setTweenValues(styles);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);

    onSelect();
    onScroll();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll]);

  return (
    <section className="overflow-hidden bg-[#F8F9FA] py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-20 text-4xl font-bold text-gray-900">
          Know What Other Schools Have To Say!
        </h2>

        <div className="relative mx-auto max-w-6xl">
          {/* Controls */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 z-10 hidden -translate-x-4 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl md:block lg:-translate-x-8"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-4 rounded-xl border border-gray-200 bg-white p-3 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl md:block lg:translate-x-8"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>

          <div className="overflow-hidden py-8" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((t, i) => {
                const tweenValue = tweenValues[i] || 0;
                const scale = 1 - Math.abs(tweenValue) * 0.15;
                const opacity = 1 - Math.abs(tweenValue) * 0.4;
                const zIndex = Math.abs(tweenValue) < 0.3 ? 20 : 10;

                return (
                  <div
                    key={i}
                    className="flex min-w-0 flex-[0_0_85%] items-center justify-center px-3 md:flex-[0_0_40%] md:px-4"
                    style={{
                      transform: `scale(${scale})`,
                      opacity: opacity,
                      zIndex: zIndex,
                      transition:
                        "transform 0.2s ease-out, opacity 0.2s ease-out",
                    }}
                  >
                    <div
                      className={`relative w-full rounded-3xl border bg-gradient-to-br from-[#E8F4FD] to-[#D6ECFB] px-8 py-12 shadow-xl transition-shadow md:px-10 md:py-14 ${
                        Math.abs(tweenValue) < 0.3
                          ? "border-blue-200 shadow-2xl"
                          : "border-blue-100 shadow-lg"
                      }`}
                    >
                      {/* Quote Icon */}
                      <div className="absolute left-6 top-6 md:left-8 md:top-8">
                        <Quote className="h-10 w-10 fill-gray-800 text-gray-800 md:h-12 md:w-12" />
                      </div>

                      {/* Quote Text */}
                      <p className="mb-8 mt-12 text-sm font-medium leading-relaxed text-gray-700 md:mb-10 md:mt-14 md:text-base">
                        {t.quote}
                      </p>

                      {/* Author */}
                      <div className="text-center">
                        <h4 className="text-base font-bold text-gray-900 md:text-lg">
                          –{t.author}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500 md:text-sm">
                          ({t.role})
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dot Navigation */}
          <div className="mt-8 flex justify-center gap-3">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  idx === selectedIndex
                    ? "scale-110 bg-gray-700"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
