import { Card } from "@skolist/ui";

interface SyllabusCardProps {
  draftConceptCount: number;
  totalActivityConcepts: number;
}

export function SyllabusCard({
  draftConceptCount,
  totalActivityConcepts,
}: SyllabusCardProps) {
  // SVG Circle calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const coveragePercent =
    totalActivityConcepts > 0
      ? (draftConceptCount / totalActivityConcepts) * 100
      : 0;
  const strokeDashoffset =
    circumference - (coveragePercent / 100) * circumference;

  const getColors = () => {
    if (coveragePercent < 60) {
      return {
        backgroundColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        strokeColor: "text-red-500",
      };
    }
    if (coveragePercent <= 80) {
      return {
        backgroundColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
        strokeColor: "text-yellow-500",
      };
    }
    return {
      backgroundColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      strokeColor: "text-green-500",
    };
  };

  const { backgroundColor, borderColor, textColor, strokeColor } = getColors();

  return (
    <Card
      className={`flex h-full flex-col items-center border p-3 shadow-sm ${backgroundColor} ${borderColor}`}
    >
      <h3 className="w-full text-left text-sm font-medium">
        Syllabus Coverage
      </h3>
      <div className="relative mt-1 flex items-center justify-center">
        <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 96 96">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
          <circle
            className={`${strokeColor} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-md font-bold ${textColor}`}>
            {Math.round(coveragePercent)}%
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="mt-1 flex items-center gap-2 text-sm text-green-600">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 bg-green-100 p-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="font-medium">
          {draftConceptCount} / {totalActivityConcepts} Concepts Covered
        </span>
      </div>
    </Card>
  );
}
