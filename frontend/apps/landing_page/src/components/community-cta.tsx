"use client";

import { Button } from "@skolist/ui";
import { LINKS } from "../constants/links";

export function CommunityCTA() {
  return (
    <section className="bg-white px-4 pb-16 md:py-12">
      <div className="container mx-auto">
        <div className="relative z-10 mx-auto max-w-4xl translate-y-24 transform rounded-[50px] bg-[#e8ee77] px-4 py-6 text-center shadow-lg md:py-8">
          <h2 className="text-2cxl mb-2 font-bold text-gray-900 md:mb-6 lg:text-4xl">
            Let&apos;s Connect & Build Community
          </h2>
          <p className="mx-auto mb-2 max-w-2xl text-sm font-medium text-gray-800 md:mb-10">
            Inviting teachers, school leaders, parents, and students to build
            the future of schooling with us
          </p>
          <Button
            className="rounded-2xl bg-black px-6 py-2 text-sm font-bold text-white hover:bg-black/90 md:px-12 md:py-6"
            onClick={() => window.open(LINKS.WHATSAPP_GROUP, "_blank")}
          >
            Join now
          </Button>
        </div>
      </div>
    </section>
  );
}
