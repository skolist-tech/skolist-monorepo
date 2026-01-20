import { Card } from "@skolist/ui";
import { Lock } from "lucide-react";

interface QualityCardProps {
  percentile: number; // A number between 1 and 100
  isLocked?: boolean;
}

export function QualityCard({
  percentile,
  isLocked = false,
}: QualityCardProps) {
  // Clamp the percentile to be between 1 and 100
  const clampedPercentile = Math.max(1, Math.min(100, Math.round(percentile)));

  return (
    <Card className="relative flex h-full flex-col border-sky-200 bg-sky-100 p-3 shadow-sm">
      <h3 className="text-sm font-medium">Paper Quality</h3>

      {isLocked ? (
        <>
          {/* Blur overlay */}
          <div className="absolute inset-0 z-10 rounded-lg backdrop-blur-sm" />

          {/* Lock icon and message */}
          <div className="relative z-20 mt-4 flex flex-1 flex-col items-center justify-center gap-3">
            <Lock className="h-8 w-8 text-gray-600" strokeWidth={2} />
            <p className="px-2 text-center text-sm font-medium text-gray-700">
              Paper quality will be shown once draft is created
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 text-2xl font-bold">
            In top{" "}
            <span className="font-semibold text-green-600">
              {clampedPercentile}%
            </span>{" "}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">of teachers</p>

          <div className="flex-1" />

          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <span className="flex h-4 w-4 items-center justify-center text-xs text-yellow-600">
              ⭐
            </span>
            <span className="font-medium">Based on all papers created</span>
          </div>
        </>
      )}
    </Card>
  );
}
