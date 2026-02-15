import { Input, Label } from "@skolist/ui";
// import type { QuestionType } from "@skolist/db";
import { cn } from "@skolist/utils";

interface QuestionTypeCardProps {
  type: string;
  label: string;
  count: number;
  onCountChange: (count: number) => void;
  icon?: React.ReactNode;
}

export function QuestionTypeCard({
  type,
  label,
  count,
  onCountChange,
  icon,
}: QuestionTypeCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2 transition-all",
        count > 0
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="font-medium leading-none">{label}</Label>
        </div>

        <Input
          id={`count-${type}`}
          type="number"
          min="0"
          max="100"
          value={count || ""}
          onChange={(e) => onCountChange(parseInt(e.target.value) || 0)}
          className="always-show-spin-button h-8 w-16"
          placeholder="0"
        />
      </div>
    </div>
  );
}
