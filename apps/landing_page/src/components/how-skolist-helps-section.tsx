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
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Row 1: Cards 1 & 2 + Header */}
          <div className={`${cards[0]?.span} col-span-1`}>
            <FeatureCard
              title={cards[0]?.title}
              description={cards[0]?.description}
            />
          </div>
          <div className={`${cards[1]?.span} col-span-1`}>
            <FeatureCard
              title={cards[1]?.title}
              description={cards[1]?.description}
            />
          </div>

          <div className="col-span-1 flex flex-col justify-center lg:col-span-4 lg:pl-8">
            <h2 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
              How Skolist Helps
            </h2>
            <p className="text-gray-600">
              Skolist makes learning gaps visible and actionable through
              personalized strategy and intelligent hassle-free integration
            </p>
          </div>

          {/* Row 2: Cards 3, 4, 5 */}
          <div className={`${cards[2]?.span} col-span-1`}>
            <FeatureCard
              title={cards[2]?.title}
              description={cards[2]?.description}
            />
          </div>
          <div className={`${cards[3]?.span} col-span-1`}>
            <FeatureCard
              title={cards[3]?.title}
              description={cards[3]?.description}
            />
          </div>
          <div className={`${cards[4]?.span} col-span-1`}>
            <FeatureCard
              title={cards[4]?.title}
              description={cards[4]?.description}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative h-full rounded-xl border-2 border-blue-400 bg-[#EBF5FF] p-6 shadow-[5px_5px_0px_#93C5FD]">
      <h3 className="mb-4 text-right text-lg font-bold leading-snug text-gray-900">
        {title}
      </h3>
      <p className="text-right text-xs leading-relaxed text-gray-600">
        {description}
      </p>
    </div>
  );
}
