import { Card } from "@skolist/ui";

interface SyllabusCardProps {
  coveragePercent: number;
}

export function SyllabusCard({ coveragePercent }: SyllabusCardProps) {
  // SVG Circle calculations
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (coveragePercent / 100) * circumference;

  return (
    <Card className="flex flex-col items-center justify-center p-4 shadow-sm">
      <h3 className="mb-2 w-full text-left text-sm font-medium text-muted-foreground">
        Syllabus Coverage
      </h3>
      <div className="relative flex items-center justify-center">
        <svg className="h-24 w-24 -rotate-90 transform">
          <circle
            className="text-secondary"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
          <circle
            className="text-primary transition-all duration-1000 ease-out"
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
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-bold">
            {Math.round(coveragePercent)}%
          </span>
          <span className="text-[10px] text-muted-foreground">covered</span>
        </div>
      </div>
      <div className="mt-2 w-full text-center text-xs text-muted-foreground">
        Based on concepts
      </div>
    </Card>
  );
}
