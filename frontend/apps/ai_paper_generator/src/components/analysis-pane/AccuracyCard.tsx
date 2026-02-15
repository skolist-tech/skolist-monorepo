import { Card } from "@skolist/ui";
import { Lock } from "lucide-react";

interface AccuracyCardProps {
  accuracy: number;
  isLocked?: boolean;
}

export function AccuracyCard({
  accuracy,
  isLocked = false,
}: AccuracyCardProps) {
  return (
    <Card className="relative flex h-full flex-col border-green-200 bg-green-50 p-3 shadow-sm">
      <h3 className="text-sm font-medium">Paper Accuracy</h3>

      {isLocked ? (
        <>
          {/* Blur overlay */}
          <div className="absolute inset-0 z-10 rounded-lg backdrop-blur-[2px]" />

          {/* Lock icon and message */}
          <div className="relative z-20 mt-4 flex flex-1 flex-col items-center justify-center gap-3">
            <Lock className="h-8 w-8 text-gray-600" strokeWidth={2} />
            <p className="px-2 text-center text-sm font-medium text-gray-700">
              Paper accuracy will be shown once draft is created
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 flex flex-col items-center justify-center gap-1">
            <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Accurate & Curriculam Aligned
            </p>
          </div>

          <div className="flex-1" />

          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <span className="flex h-4 w-4 items-center justify-center text-xs text-yellow-600">
              🎯
            </span>
            <span className="font-medium">Based on selected class</span>
          </div>
        </>
      )}
    </Card>
  );
}
