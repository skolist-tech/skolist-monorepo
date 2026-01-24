import { Button } from "@skolist/ui";

export function CommunityCTA() {
  return (
    <section className="bg-white px-4 py-12">
      <div className="container mx-auto">
        <div className="relative z-10 mx-auto max-w-4xl translate-y-24 transform rounded-[50px] bg-[#47b1e7] px-4 py-8 text-center shadow-lg md:py-8">
          <h2 className="mb-6 text-2cxl lg:text-4xl font-bold text-gray-900">
            Let&apos;s Connect & Build Community
          </h2>
          <p className="mx-auto mb-4 max-w-2xl text-sm font-medium text-gray-800 md:mb-10">
            Inviting teachers, school leaders, parents, and students to build
            the future of schooling with us
          </p>
          <Button className="rounded-2xl bg-black px-6 py-2 text-sm font-bold text-white hover:bg-black/90 md:px-12 md:py-6">
            Join now
          </Button>
        </div>
      </div>
    </section>
  );
}
