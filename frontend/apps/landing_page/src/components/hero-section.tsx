"use client";

import { Button } from "@skolist/ui";

// Replace this with your actual YouTube video ID
const YOUTUBE_VIDEO_ID = "2k7kQeecEVQ";

// Autoplay YouTube embed - plays muted on page load (browser requirement)
function AutoplayYouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <iframe
      className="absolute inset-0 h-full w-full rounded-[10px]"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&loop=1&playlist=${videoId}&vq=hd1080`}
      title="Skolist Demo Video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

export function HeroSection() {
  return (
    <section className="bg-white py-8 md:py-10">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-4 text-3xl font-normal leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
          Empowering School with <br />
          <span className="font-bold">Personalized</span> <br />
          Student Strategies
        </h1>

        <p className="mx-auto mb-10 hidden max-w-2xl text-base text-gray-500 md:block md:text-lg">
          Skolist helps schools identify each student&apos;s learning gaps and
          implement strategic solutions through technologically empowered,
          hassle-free integration
        </p>

        {/* Video Container with autoplay YouTube embed */}
        <div className="relative mx-auto mb-12 aspect-[2108/895] max-w-5xl overflow-hidden rounded-[10px] bg-gray-200 shadow-lg md:aspect-[2108/896]">
          <AutoplayYouTubeEmbed videoId={YOUTUBE_VIDEO_ID} />
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-black px-8 text-lg font-medium hover:bg-black/90"
            onClick={() => window.open("https://qgen.skolist.com", "_blank")}
          >
            Get Started
          </Button>
          <p className="text-sm font-bold text-red-500">QGEN is live!</p>
          <p className="text-sm font-bold text-gray-500">
            INSTANTLY CHOOSE FROM MILLIONS OF QUESTIONS WITH AUTO-FORMATTING
          </p>
        </div>
      </div>
    </section>
  );
}
