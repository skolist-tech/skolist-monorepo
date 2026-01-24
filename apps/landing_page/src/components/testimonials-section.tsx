import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const testimonials = [
  {
    quote:
      "Even at an early stage, Skolist is helping teachers identify specific areas where students struggle. The pilot feedback has been encouraging, and we're interested in how it evolves.",
    author: "Manoj Gandhi",
    role: "Head of Academics",
  },
  {
    quote:
      "During the pilot, Skolist has helped us better visualize student progress beyond test scores. We see potential in using these insights to guide more focused classroom interventions.",
    author: "Rajesh Kumar",
    role: "Academic Director",
  },
  {
    quote:
      "After discussing the concept with the founders, we found the idea compelling and well-thought-out. We're keen to pilot this and see how it works in a real classroom setting.",
    author: "Dr. Jaya Agarwal",
    role: "Principal",
  },
  {
    quote:
      "The AI doubt solver has been a game-changer for our students. It provides immediate, personalized support that allows our teachers to focus on higher-level conceptual guidance.",
    author: "Sanjay Mehta",
    role: "Senior Coordinator",
  },
  {
    quote:
      "Skolist's ability to pinpoint the exact root cause of a student's learning gap—rather than just giving a percentage score—is exactly what modern personalized education needs.",
    author: "Anita Sharma",
    role: "Lead Educator",
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

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;
      if (emblaApi.internalEngine().options.loop) {
        emblaApi.internalEngine().slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }
      // Increased multiplier for more dramatic scaling/overlap
      return Math.max(-1, Math.min(1, diffToTarget * 3));
    });
    setTweenValues(styles);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi
      .on("select", onSelect)
      .on("scroll", onScroll)
      .on("reInit", onScroll);
    onSelect();
    onScroll();
  }, [emblaApi, onScroll]);

  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-20 text-center text-4xl font-bold tracking-tight text-[#1a2b3b]">
          Know What Other Schools Have To Say!
        </h2>

        <div className="relative mx-auto max-w-6xl">
          {/* Controls */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute -left-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-3 shadow-xl transition-transform hover:scale-110"
          >
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute -right-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-3 shadow-xl transition-transform hover:scale-110"
          >
            <ChevronRight className="h-6 w-6 text-slate-700" />
          </button>

          <div className="overflow-visible" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {testimonials.map((t, i) => {
                const tweenValue = tweenValues[i] || 0;
                // isActive is true when the card is perfectly centered
                const isActive = Math.abs(tweenValue) < 0.1;

                // Scale logic: 1.15 for center, 0.85 for sides
                const scale = 1.15 - Math.abs(tweenValue) * 0.3;
                const opacity = 1 - Math.abs(tweenValue) * 0.6;
                const zIndex = isActive ? 30 : 10;

                return (
                  <div
                    key={i}
                    // flex-[0_0_33.33%] ensures exactly 3 cards fit the view width
                    className="min-w-0 flex-[0_0_100%] px-2 py-10 md:flex-[0_0_33.33%]"
                    style={{
                      transform: `scale(${scale})`,
                      opacity: opacity,
                      zIndex: zIndex,
                      transition: "transform 0.4s ease, opacity 0.4s ease",
                    }}
                  >
                    <div
                      className={`relative h-full rounded-[2.5rem] p-8 text-center transition-colors duration-500 ${
                        isActive
                          ? "border border-blue-200 bg-[#e5f1ff] shadow-[0_20px_50px_rgba(0,102,255,0.15)]"
                          : "border border-transparent bg-[#f1f8ff] shadow-md"
                      }`}
                    >
                      <div className="mb-6 flex justify-center">
                        <Quote
                          className={`h-10 w-10 ${isActive ? "fill-slate-800 text-slate-800" : "fill-slate-400 text-slate-400 opacity-40"}`}
                        />
                      </div>

                      <p
                        className={`mb-8 text-base font-medium italic leading-relaxed text-slate-600 ${isActive ? "opacity-100" : "opacity-80"}`}
                      >
                        "{t.quote}"
                      </p>

                      <div className="mt-auto">
                        <h4 className="text-lg font-extrabold text-[#1a2b3b]">
                          -{t.author}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500">
                          ({t.role})
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots */}
          <div className="mt-12 flex justify-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === selectedIndex
                    ? "w-10 bg-slate-800"
                    : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
