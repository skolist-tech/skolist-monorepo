import { GraduationCap, Microscope, Users, Rocket } from "lucide-react";

const points = [
  {
    title: "Built by IIT Founders",
    description:
      "Created by engineers and educators from IIT with deep expertise in technology and learning science",
    bgClass: "bg-blue-50/50",
    icon: <GraduationCap className="h-5 w-5 text-blue-600" />,
  },
  {
    title: "Research-Driven Approach",
    description:
      "Every feature is grounded in research on learning assessment and personalized education",
    bgClass: "bg-indigo-50/50",
    icon: <Microscope className="h-5 w-5 text-indigo-600" />,
  },
  {
    title: "Built with Teachers",
    description:
      "Developed in collaboration with educators who understand classroom realities",
    bgClass: "bg-sky-50/50",
    icon: <Users className="h-5 w-5 text-sky-600" />,
  },
  {
    title: "Early School Pilots",
    description:
      "Currently working with multiple schools to pilot the platform, gather feedback, and iterate continuously",
    bgClass: "bg-blue-100/40",
    icon: <Rocket className="h-5 w-5 text-blue-700" />,
  },
];

export function BuiltWithRigorSection() {
  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-start gap-12 lg:flex-row">
          {/* Left Content: Fixed width and top-aligned */}
          <div className="lg:w-1/3 lg:pr-8">
            <span className="mb-3 block text-sm font-bold uppercase tracking-widest text-blue-600">
              Our Foundation
            </span>
            <h2 className="mb-6 max-w-2xl text-4xl md:text-5xl font-semibold leading-[1.1] tracking-tight text-slate-800">
              Built with Rigor <br />
              <span className="text-black-600">and Empathy</span>
            </h2>
            <div className="max-w-sm border-l-2 border-blue-100 py-4 pl-6">
              <p className="text-lg font-medium italic leading-relaxed text-slate-500">
                "Skolist is the only platform identifying weak areas with
                end-to-end implementation."
              </p>
            </div>
          </div>

          {/* Right Grid: Using translate instead of margin to prevent layout shifts */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
              {points.map((point, idx) => (
                <div
                  key={point.title}
                  className={`group relative rounded-[2.5rem] md:p-10 p-6 ${point.bgClass} border border-white/80 shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 ${idx % 2 !== 0 ? "md:translate-y-12 md:hover:translate-y-10" : ""}`}
                >
                  <div className="md:mb-8 mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:rotate-6">
                    {point.icon}
                  </div>

                  <h3 className="md:mb-4 mb-2 text-xl font-bold text-slate-900">
                    {point.title}
                  </h3>
                  <p className="md:text-[15px] text-[14px] font-medium leading-relaxed text-slate-600">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
