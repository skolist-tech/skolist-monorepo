import { Card } from "@skolist/ui";

interface GratificationCardProps {
  currentQuestions: number;
  targetQuestions: number;
}

export function GratificationCard({
  currentQuestions,
  targetQuestions,
}: GratificationCardProps) {
  const percent =
    targetQuestions > 0
      ? Math.min(100, (currentQuestions / targetQuestions) * 100)
      : 0;

  return (
    <Card className="flex flex-col p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">
        Gratification
      </h3>
      <div className="mt-4 flex flex-1 flex-col justify-center">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs text-muted-foreground">
          {percent >= 100 ? (
            <span className="flex items-center justify-end gap-1 font-medium text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Completed
            </span>
          ) : (
            <span>{Math.round(percent)}% Complete</span>
          )}
        </div>
      </div>
      <div className="mt-auto pt-2 text-xs text-muted-foreground">
        Draft Progress
      </div>
    </Card>
  );
}
