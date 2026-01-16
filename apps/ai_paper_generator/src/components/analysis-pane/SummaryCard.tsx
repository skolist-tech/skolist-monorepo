import { Card } from "@skolist/ui";

interface SummaryCardProps {
  totalMarks: number;
  questionCount: number;
}

export function SummaryCard({ totalMarks, questionCount }: SummaryCardProps) {
  return (
    <Card className="flex flex-col p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">Total Stats</h3>
      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-1">
        <div className="text-3xl font-bold text-primary">{totalMarks}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Total Marks
        </div>
      </div>
      <div className="mt-auto border-t pt-2 text-center text-xs text-muted-foreground">
        {questionCount} Questions
      </div>
    </Card>
  );
}
