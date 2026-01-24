const points = [
  {
    title: "Built by IIT Founders",
    description:
      "Created by engineers and educators from IIT with deep expertise in technology and learning science",
    bgClass: "bg-[#D9EBFF]",
  },
  {
    title: "Research-Driven Approach",
    description:
      "Every feature is grounded in research on learning assessment and personalized education",
    bgClass: "bg-[#E3F2FD]",
  },
  {
    title: "Built with Teachers",
    description:
      "Developed in collaboration with educators who understand classroom realities",
    bgClass: "bg-[#F0F7FF]",
  },
  {
    title: "Early School Pilots",
    description:
      "Currently working with multiple schools to pilot the platform, gather feedback, and iterate continuously",
    bgClass: "bg-[#D6E9FF]",
  },
];

export function BuiltWithRigorSection() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start gap-16 lg:flex-row">
          {/* Left Content */}
          <div className="mt-8 lg:w-1/3">
            <h2 className="mb-8 text-5xl font-bold leading-tight text-gray-900">
              Built with Rigor <br /> and Empathy
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500">
              Skolist is only platform in the world that identifies student weak
              areas and delivers end-to-end implementation to address them
            </p>
          </div>

          {/* Right Grid */}
          <div className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-2 lg:w-2/3">
            {points.map((point, idx) => (
              <div
                key={point.title}
                className={`rounded-3xl p-10 ${point.bgClass} shadow-sm transition-transform hover:scale-[1.02] ${idx % 2 !== 0 ? "md:translate-y-8" : ""}`}
              >
                <h3 className="mb-6 text-xl font-bold text-gray-900">
                  {point.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-gray-700">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
