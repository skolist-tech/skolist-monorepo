import { Button } from "@skolist/ui";

export function HeroSection() {
  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-4 text-3xl font-normal leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
          Empowering School with <br />
          <span className="font-bold">Personalized</span> <br />
          Student Strategies
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base text-gray-500 md:text-lg">
          Skolist helps schools identify each student&apos;s learning gaps and
          implement strategic solutions through Technologically empowered,
          hassle-free integration
        </p>

        <div className="mx-auto mb-12 aspect-[16/7] max-w-5xl rounded-[40px] bg-[#D9D9D9] shadow-sm">
          {/* Video/Image Placeholder */}
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-black px-8 text-lg font-medium hover:bg-black/90"
            onClick={() => window.open("https://qgen.skolist.com", "_blank")}
          >
            Get Started
          </Button>

          <p className="max-w-xl text-sm leading-relaxed text-gray-400">
            We are launching our free pilot program soon and invite teachers,
            school leaders, parents, and students to build the future of
            schooling with us
          </p>
        </div>
      </div>
    </section>
  );
}
