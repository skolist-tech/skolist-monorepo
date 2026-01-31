import { useState } from "react";
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@skolist/ui";
import { ChevronDown } from "lucide-react";
import type { GeneratedQuestion, HardnessLevel } from "@skolist/db";

interface QuestionTagsProps {
  concepts: string[];
  hardness: GeneratedQuestion["hardness_level"] | null;
  showHardness?: boolean;
  editable?: boolean;
  onHardnessUpdate?: (newHardness: HardnessLevel) => Promise<void>;
}

const hardnessColors: Record<HardnessLevel, string> = {
  easy: "bg-green-100 text-green-700 hover:bg-green-200",
  medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  hard: "bg-orange-100 text-orange-700 hover:bg-orange-200",
};

const hardnessOptions: HardnessLevel[] = ["easy", "medium", "hard"];

export function QuestionTags({
  concepts,
  hardness,
  showHardness = true,
  editable = false,
  onHardnessUpdate,
}: QuestionTagsProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleHardnessChange = async (newHardness: HardnessLevel) => {
    if (newHardness === hardness || !onHardnessUpdate) return;

    try {
      setIsSaving(true);
      await onHardnessUpdate(newHardness);
    } catch (error) {
      console.error("Failed to update hardness:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hardnessBadge = hardness && (
    <Badge
      variant="secondary"
      className={`${hardnessColors[hardness]} capitalize`}
    >
      {hardness}
    </Badge>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showHardness && hardness && (
        <>
          {editable && onHardnessUpdate ? (
            <Select
              value={hardness}
              onValueChange={(value) =>
                handleHardnessChange(value as HardnessLevel)
              }
              disabled={isSaving}
            >
              <SelectTrigger
                className={`h-6 w-auto gap-1 border-0 px-2 py-0 text-xs font-bold capitalize ${hardnessColors[hardness]} ${isSaving ? "opacity-50" : ""}`}
              >
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {hardnessOptions.map((level) => (
                  <SelectItem
                    key={level}
                    value={level}
                    className={`capitalize ${hardnessColors[level]}`}
                  >
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            hardnessBadge
          )}
        </>
      )}
      {concepts.map((concept, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {concept}
        </Badge>
      ))}
    </div>
  );
}
