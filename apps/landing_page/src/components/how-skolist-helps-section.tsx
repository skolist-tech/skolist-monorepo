export function HowSkolistHelpsSection() {
  const cards = [
    {
      title: "Strategic Improvement Focused on Root Causes",
      description:
        "Students practice and improve their weak areas through continuous, personalized diagnosis with our real-time AI doubt solver",
      span: "lg:col-span-5",
    },
    {
      title: "Actionable Insights for Schools",
      description:
        "Schools get clear reports on each student's progress, enabling targeted classroom interventions",
      span: "lg:col-span-3",
    },
    {
      title: "Personalized AI-Generated Strategy",
      description:
        "Every teacher receives a school curriculum based personalized strategy for each student and can customize it based on the school needs to strengthen their weak areas",
      span: "lg:col-span-3",
    },
    {
      title: "Hassle-Free Integration",
      description:
        "We use agentic AI models to complete every step in just a few clicks! No technical knowledge required",
      span: "lg:col-span-3",
    },
    {
      title: "Identification of Exact Weak Concepts",
      description:
        "Skolist pinpoints specific topics where each student struggles, going beyond just scores to reveal root causes",
      span: "lg:col-span-6",
    },
  ];

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Mobile: Header first, then zigzag cards | Desktop: Grid layout */}

        {/* Mobile Header - shown only on mobile at top */}
        <div className="mb-8 text-center lg:hidden">
          <h2 className="mb-3 text-2xl font-bold leading-tight text-gray-900 md:text-4xl">
            How Skolist Helps
          </h2>
          <p className="text-sm text-gray-600 md:text-base">
            Skolist makes learning gaps visible and actionable through
            personalized strategy and intelligent hassle-free integration
          </p>
        </div>

        {/* Mobile: Zigzag overlapping cards */}
        <div className="flex flex-col lg:hidden">
          {cards.map((card, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={card.title}
                className={`w-[65%] ${isEven ? "self-start" : "self-end"} ${
                  idx > 0 ? "mt-3" : ""
                }`}
                style={{ zIndex: cards.length - idx }}
              >
                <FeatureCard
                  title={card.title}
                  description={card.description}
                  isMobile
                />
              </div>
            );
          })}
        </div>

        {/* Desktop: Two-row layout with equal heights per row */}
        <div className="hidden lg:flex lg:flex-col lg:gap-8">
          {/* Row 1: Cards 1 & 2 + Header */}
          <div className="grid grid-cols-12 items-stretch gap-8">
            <div className="col-span-5">
              <FeatureCard
                title={cards[0]?.title}
                description={cards[0]?.description}
              />
            </div>
            <div className="col-span-3">
              <FeatureCard
                title={cards[1]?.title}
                description={cards[1]?.description}
              />
            </div>
            <div className="col-span-4 flex flex-col justify-center pl-8">
              <h2 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
                How Skolist Helps
              </h2>
              <p className="text-gray-600">
                Skolist makes learning gaps visible and actionable through
                personalized strategy and intelligent hassle-free integration
              </p>
            </div>
          </div>

          {/* Row 2: Cards 3, 4, 5 */}
          <div className="grid grid-cols-12 items-stretch gap-8">
            <div className="col-span-3">
              <FeatureCard
                title={cards[2]?.title}
                description={cards[2]?.description}
              />
            </div>
            <div className="col-span-3">
              <FeatureCard
                title={cards[3]?.title}
                description={cards[3]?.description}
              />
            </div>
            <div className="col-span-6">
              <FeatureCard
                title={cards[4]?.title}
                description={cards[4]?.description}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  isMobile = false,
}: {
  title?: string;
  description?: string;
  isMobile?: boolean;
}) {
  return (
    <div className="relative h-full">
      {/* Background shadow/border layer */}
      <div
        className={`absolute border-[3px] border-[#4A8FDA] ${
          isMobile
            ? "inset-x-0 bottom-0 top-2 rounded-[16px]"
            : "inset-x-0 bottom-0 top-[10px] rounded-[21px]"
        }`}
        style={{ left: isMobile ? "-4px" : "-10px" }}
      />
      {/* Main card */}
      <div
        className={`relative h-full border-2 border-[#4A8FDA] bg-[#E4F1FF] ${
          isMobile ? "rounded-[16px] px-4 py-4" : "rounded-[21px] px-6 py-5"
        }`}
        style={{
          filter: "drop-shadow(0px 4px 8px #CCE5FF)",
        }}
      >
        <h3
          className={`font-semibold text-black ${
            isMobile
              ? "mb-2 text-right text-sm leading-tight"
              : "mb-4 text-right text-xl leading-[24px]"
          }`}
        >
          {title}
        </h3>
        <p
          className={`font-light text-black ${
            isMobile
              ? "text-right text-[11px] leading-[14px]"
              : "text-right text-base leading-[19px]"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
