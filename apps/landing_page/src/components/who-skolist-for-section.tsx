import {
  Building2,
  Users,
  GraduationCap,
  UserCircle,
  Check,
} from "lucide-react";

const targetAudiences = [
  {
    title: "For Schools",
    icon: Building2,
    color: "blue",
    accentColor: "#A5CCFF",
    features: [
      "Improve overall learning outcomes",
      "Data-driven academic decisions",
      "Scalable personalization",
      "Clear ROI on student performance",
    ],
  },
  {
    title: "For Teachers",
    icon: Users,
    color: "orange",
    accentColor: "#FFE4A5",
    features: [
      "Know exactly what each student needs",
      "Save time on diagnosis",
      "Focus on teaching, not guessing",
      "Track individual student progress",
    ],
  },
  {
    title: "For Students",
    icon: GraduationCap,
    color: "blue-light",
    accentColor: "#A5CCFF",
    features: [
      "Understand their own learning gaps",
      "Get targeted practice",
      "Build confidence through progress",
      "Learn at their own pace",
    ],
  },
  {
    title: "For Parents",
    icon: UserCircle,
    color: "green",
    accentColor: "#C1E4BA",
    features: [
      "See exactly where their child needs help",
      "Track real progress, not just grades",
      "Get early indications when their child is falling behind",
      "Trust the school's personalized approach",
    ],
  },
];

export function WhoSkolistForSection() {
  return (
    <section className="bg-white py-20 pb-0">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
          Who Skolist Is For
        </h2>
        <p className="mx-auto mb-20 max-w-2xl text-center text-xs font-medium text-gray-500">
          For students seeking clarity, teachers enabling personalization,
          parents demanding transparency, and schools building trust through
          measurable learning outcomes.
        </p>

        <div className="grid h-full grid-cols-1 items-center gap-12 pb-20 sm:gap-16 md:grid-cols-2 lg:grid-cols-4">
          {targetAudiences.map((audience, idx) => (
            <div
              key={audience.title}
              className={`group relative ${idx % 2 !== 0 ? "lg:translate-y-12" : ""}`}
            >
              {/* Stacked Background Card */}
              <div
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-[32px] opacity-100 transition-transform group-hover:translate-x-4 group-hover:translate-y-4"
                style={{ backgroundColor: audience.accentColor }}
              />

              {/* Main Foreground Card */}
              <div className="relative flex h-full flex-col items-center rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mb-6 flex items-center justify-center">
                  <audience.icon
                    className="h-10 w-10 text-gray-800"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="mb-8">
                  <span className="rounded-full border border-blue-100 bg-[#EBF5FF] px-5 py-1.5 text-xs font-bold italic text-gray-900">
                    {audience.title}
                  </span>
                </div>

                <ul className="w-full space-y-4 text-left">
                  {audience.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-[11px] font-semibold leading-tight text-gray-700"
                    >
                      <Check
                        className="mt-[-2px] h-4 w-4 flex-shrink-0 text-gray-900"
                        strokeWidth={3}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
