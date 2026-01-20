import { Card } from "@skolist/ui";
import { Lock } from "lucide-react";

interface DifficultyCardProps {
  easyMarks: number;
  mediumMarks: number;
  hardMarks: number;
  isLocked?: boolean;
}

export function DifficultyCard({
  easyMarks,
  mediumMarks,
  hardMarks,
  isLocked = false,
}: DifficultyCardProps) {
  const getOverallDifficulty = () => {
    if (easyMarks >= mediumMarks && easyMarks >= hardMarks) {
      return {
        label: "Easy",
        description: "This paper is designed to be approachable",
        backgroundColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
      };
    }
    if (mediumMarks >= easyMarks && mediumMarks >= hardMarks) {
      return {
        label: "Medium",
        description: "This paper is well-balanced",
        backgroundColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
      };
    }
    return {
      label: "Hard",
      description: "This paper is rigorous",
      backgroundColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
    };
  };

  const { label, description, backgroundColor, borderColor, textColor } =
    getOverallDifficulty();

  return (
    <Card
      className={`relative flex h-full flex-col border p-3 shadow-sm ${backgroundColor} ${borderColor}`}
    >
      <h3 className="text-sm font-medium">Overall Difficulty</h3>

      {isLocked ? (
        <>
          {/* Blur overlay */}
          <div className="absolute inset-0 z-10 rounded-lg backdrop-blur-[2px]" />

          {/* Lock icon and message */}
          <div className="relative z-20 mt-4 flex flex-1 flex-col items-center justify-center gap-3">
            <Lock className="h-8 w-8 text-gray-600" strokeWidth={2} />
            <p className="px-2 text-center text-sm font-medium text-gray-700">
              Overall difficulty level will be shown once draft is created
            </p>
          </div>
        </>
      ) : (
        <>
          <div className={`mt-2 text-2xl font-bold ${textColor}`}>{label}</div>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          <div className="flex-1" />

          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <span className="text-sm text-green-600">👍</span>

            <span className="font-medium">Looks Good</span>
          </div>
        </>
      )}
    </Card>
  );
}
