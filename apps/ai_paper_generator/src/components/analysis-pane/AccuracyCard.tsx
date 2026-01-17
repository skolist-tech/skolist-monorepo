import { Card } from "@skolist/ui";

interface AccuracyCardProps {
  accuracy: number;
}

export function AccuracyCard({ accuracy }: AccuracyCardProps) {
  return (
    <Card className="flex h-full flex-col border-green-200 bg-green-50 p-3 shadow-sm">
      <h3 className="text-sm font-medium">Paper Accuracy</h3>
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
    </Card>
  );
}
