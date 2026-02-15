"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface Founder {
  id: number;
  name: string;
  role: string;
  institute: string;
  image: string;
  linkedin: string;
}

const founders: Founder[] = [
  {
    id: 1,
    name: "Saurav Kumar Singh",
    role: "Founder",
    institute: "IIT Delhi",
    image: "/saurav.png",
    linkedin: "https://www.linkedin.com/in/saurav-kumar-singh",
  },
  {
    id: 2,
    name: "Purushottam Dafure",
    role: "Co-Founder",
    institute: "IIT Delhi",
    image: "/purushottam.jpeg",
    linkedin: "https://www.linkedin.com/in/purushottam-dafure",
  },
];

export function FoundersSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();

    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Meet Our Founders
        </h2>

        <div className="relative">
          {/* Embla viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {founders.map((founder) => (
                <div
                  key={founder.id}
                  className="flex-[0_0_100%] px-3 md:flex-[0_0_50%]"
                >
                  <div className="h-full overflow-hidden rounded-lg border bg-white shadow-md transition hover:shadow-xl">
                    <div className="h-80 w-full overflow-hidden bg-gray-50">
                      <img
                        src={founder.image}
                        alt={founder.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="mb-1 text-xl font-bold text-gray-900">
                        {founder.name}
                      </h3>
                      <p className="mb-1 text-sm text-gray-600">
                        {founder.role}
                      </p>
                      <p className="mb-4 text-sm text-gray-500">
                        {founder.institute}
                      </p>
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev button */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full border bg-white p-3 shadow hover:bg-gray-50 md:-translate-x-12"
            aria-label="Previous founder"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next button */}
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full border bg-white p-3 shadow hover:bg-gray-50 md:translate-x-12"
            aria-label="Next founder"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === selectedIndex
                  ? "w-8 bg-[#0A1F44]"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to founder ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
