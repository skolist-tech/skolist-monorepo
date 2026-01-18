import { Input, Label } from "@skolist/ui";

interface TotalInputsProps {
  totalQuestions: number;
  totalMarks: number;
  totalTime: number;
  onTotalQuestionsChange: (value: number) => void;
  onTotalMarksChange: (value: number) => void;
  onTotalTimeChange: (value: number) => void;
}

export function TotalInputs({
  totalQuestions,
  totalMarks,
  totalTime,
  onTotalQuestionsChange,
  onTotalMarksChange,
  onTotalTimeChange,
}: TotalInputsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="total-questions">Total Questions</Label>
        <Input
          id="total-questions"
          type="number"
          min="1"
          max="50"
          value={totalQuestions || ""}
          onChange={(e) =>
            onTotalQuestionsChange(parseInt(e.target.value) || 0)
          }
          placeholder="0"
          className="[&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-marks">Total Marks</Label>
        <Input
          id="total-marks"
          type="number"
          min="1"
          max="500"
          value={totalMarks || ""}
          onChange={(e) => onTotalMarksChange(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="[&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-time">Time (minutes)</Label>
        <Input
          id="total-time"
          type="number"
          min="1"
          max="240"
          value={totalTime || ""}
          onChange={(e) => onTotalTimeChange(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="[&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
        />
      </div>
    </div>
  );
}
