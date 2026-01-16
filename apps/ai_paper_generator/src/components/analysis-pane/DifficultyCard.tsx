import { Card } from "@skolist/ui";

interface DifficultyCardProps {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export function DifficultyCard({
  easyCount,
  mediumCount,
  hardCount,
}: DifficultyCardProps) {
  const total = easyCount + mediumCount + hardCount;
  const easyPercent = total > 0 ? (easyCount / total) * 100 : 0;
  const mediumPercent = total > 0 ? (mediumCount / total) * 100 : 0;
  // Last one fills the rest to avoid rounding gaps, but for visual width we use calculated
  const hardPercent = total > 0 ? (hardCount / total) * 100 : 0;

  return (
    <Card className="flex flex-col p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">
        Difficulty Balance
      </h3>
      <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${easyPercent}%` }}
          title={`Easy: ${easyCount}`}
        />
        <div
          className="h-full bg-yellow-500 transition-all duration-500"
          style={{ width: `${mediumPercent}%` }}
          title={`Medium: ${mediumCount}`}
        />
        <div
          className="h-full bg-red-500 transition-all duration-500"
          style={{ width: `${hardPercent}%` }}
          title={`Hard: ${hardCount}`}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Easy ({easyCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span>Med ({mediumCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span>Hard ({hardCount})</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
        {/* Placeholder for "Looks Good" checkmark as in sketch */}
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 p-0.5">
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
        <span className="font-medium">Looks Good</span>
      </div>
    </Card>
  );
}
