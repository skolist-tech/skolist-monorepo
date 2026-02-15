import {
  RiUserStarLine,
  RiBarChartLine,
  RiBookOpenLine,
  RiMagicLine,
  RiShieldCheckLine,
} from "react-icons/ri";

const cards = [
  {
    title: "Teacher-Friendly",
    description:
      "No training required, designed for teachers to use from day one",
    icon: <RiUserStarLine className="h-6 w-6 text-blue-600" />,
    className: "lg:col-span-7 bg-blue-50/50",
  },
  {
    title: "Actionable Insights",
    description:
      "Clear reports on each student's progress for targeted interventions",
    icon: <RiBarChartLine className="h-6 w-6 text-indigo-600" />,
    className: "lg:col-span-5 bg-slate-50",
  },
  {
    title: "Curriculum-Aligned",
    description: "Matches your existing syllabus",
    icon: <RiBookOpenLine className="h-6 w-6 text-blue-600" />,
    className: "lg:col-span-4 bg-slate-50",
  },
  {
    title: "Hassle-Free Integration",
    description: "Agentic AI models complete setup in clicks",
    icon: <RiMagicLine className="h-6 w-6 text-amber-500" />,
    className: "lg:col-span-4 bg-blue-50/50",
  },
  {
    title: "Privacy First",
    description: "Secure and compliant by design",
    icon: <RiShieldCheckLine className="h-6 w-6 text-indigo-600" />,
    className: "lg:col-span-4 bg-indigo-50/30",
  },
];

export function HowSkolistHelpsSection() {
  return (
    <section className="bg-white py-4 md:py-24">
      <div className="container mx-auto px-6">
        {/* Header Section */}
        <div className="mb-12 text-right md:mb-16">
          <h2 className="mb-6 hidden text-4xl font-bold tracking-tight text-slate-900 md:block md:text-5xl">
            Easy to Adopt, Easy to Use.
          </h2>
          <h2 className="mb-6 block text-4xl font-bold tracking-tight text-slate-900 md:hidden md:text-5xl">
            Easy to Adopt, <br /> Easy to Use.
          </h2>
        </div>

        {/* Modern Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-[2rem] border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 md:p-8 ${card.className}`}
            >
              {/* Subtle Background Pattern or Glow */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/50 blur-2xl transition-colors group-hover:bg-blue-200/50" />

              <div
                className={`relative z-10 ${
                  idx % 2 === 0
                    ? "flex flex-col items-end text-right md:block md:text-left"
                    : ""
                }`}
              >
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-110 md:mb-6">
                  {card.icon}
                </div>

                <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-900 md:mb-3 md:text-xl">
                  {card.title}
                </h3>
                <p className="text-[14px] font-medium leading-relaxed text-slate-600 md:text-[15px]">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
