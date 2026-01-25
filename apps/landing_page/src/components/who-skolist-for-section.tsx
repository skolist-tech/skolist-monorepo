import { Check } from "lucide-react";
import { GiTeacher } from "react-icons/gi";
import { PiStudentFill } from "react-icons/pi";
import { RiParentLine, RiSchoolLine } from "react-icons/ri";

const targetAudiences = [
  {
    title: "For Schools",
    icon: RiSchoolLine,
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
    icon: GiTeacher,
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
    icon: PiStudentFill,
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
    icon: RiParentLine,
    color: "green",
    accentColor: "#FFE4A5",
    features: [
      "See exactly where their child needs help",
      "Track real progress, not just grades",
      "Early signals when a child falls behind",
      "Trust the school's personalized approach",
    ],
  },
];

export function WhoSkolistForSection() {
  return (
    <section className="bg-white py-24 pb-0">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-left text-4xl font-bold text-gray-900 md:text-5xl">
          What You Get
        </h2>

        {/* Mobile: Flex layout with zigzag overlap | Desktop: Grid layout */}
        <div className="flex flex-col pb-20 md:grid md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          {targetAudiences.map((audience, idx) => {
            // On mobile: even cards (0,2) align left, odd cards (1,3) align right with negative margin
            const isEven = idx % 2 === 0;

            return (
              <div
                key={audience.title}
                className={`group relative w-[72%] md:w-full ${
                  // Mobile alignment: even=left, odd=right
                  isEven ? "self-start" : "self-end"
                } ${
                  // Mobile: odd cards get negative margin to overlap
                  !isEven ? "-mt-12 md:mt-0" : idx > 0 ? "mt-6 md:mt-0" : ""
                } ${
                  // Desktop: stagger effect
                  !isEven ? "lg:translate-y-12" : ""
                }`}
                style={{ zIndex: targetAudiences.length - idx }}
              >
                {/* Stacked Background Card */}
                <div
                  className="absolute inset-0 translate-x-2 translate-y-2 rounded-[24px] opacity-100 transition-transform group-hover:translate-x-3 group-hover:translate-y-3 md:translate-x-3 md:translate-y-3 md:rounded-[32px] md:group-hover:translate-x-4 md:group-hover:translate-y-4"
                  style={{ backgroundColor: audience.accentColor }}
                />

                {/* Main Foreground Card */}
                <div
                  className={`relative flex h-full flex-col rounded-[24px] border border-gray-200 bg-white p-5 shadow-md md:items-center md:rounded-[32px] md:p-8 md:text-center ${
                    !isEven ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  <div
                    className={`mb-4 flex items-center md:mb-6 md:justify-center ${
                      !isEven ? "justify-end" : "justify-start"
                    }`}
                  >
                    <audience.icon
                      className="h-8 w-8 text-gray-800 md:h-10 md:w-10"
                      strokeWidth={1.5}
                    />
                  </div>

                  <div className="mb-5 md:mb-8">
                    <span className="rounded-full border border-blue-100 bg-[#EBF5FF] px-4 py-1 text-[12px] font-bold text-gray-900 md:px-5 md:py-1.5 md:text-sm">
                      {audience.title}
                    </span>
                  </div>

                  <ul className="w-full space-y-2.5 text-left md:space-y-4">
                    {audience.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-[12px] font-semibold leading-tight text-gray-700 md:gap-3 md:text-[11px]"
                      >
                        <Check
                          className="mt-[-2px] h-3.5 w-3.5 flex-shrink-0 text-gray-900 md:h-4 md:w-4"
                          strokeWidth={3}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
