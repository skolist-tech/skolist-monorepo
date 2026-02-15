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
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val)) {
              onTotalQuestionsChange(0);
            } else if (val > 50) {
              onTotalQuestionsChange(50);
            } else {
              onTotalQuestionsChange(val);
            }
          }}
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
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val)) {
              onTotalMarksChange(0);
            } else if (val > 500) {
              onTotalMarksChange(500);
            } else {
              onTotalMarksChange(val);
            }
          }}
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
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (isNaN(val)) {
              onTotalTimeChange(0);
            } else if (val > 240) {
              onTotalTimeChange(240);
            } else {
              onTotalTimeChange(val);
            }
          }}
          placeholder="0"
          className="[&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
        />
      </div>
    </div>
  );
}
