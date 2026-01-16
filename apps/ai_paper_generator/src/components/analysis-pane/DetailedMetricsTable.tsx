import {
  Card,
} from "@skolist/ui";
import { type GeneratedQuestionWithConcepts } from "../../context/QuestionsContext";

interface DetailedMetricsTableProps {
  questions: GeneratedQuestionWithConcepts[];
}

interface TopicMetric {
  name: string;
  chapter: string; // Assuming we can group by chapter, or just use topic as primary
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export function DetailedMetricsTable({ questions }: DetailedMetricsTableProps) {
  // Aggregate data by Topic (Concept)
  const metricsMap = new Map<string, TopicMetric>();

  questions.forEach((q) => {
    // If no concepts, put in "Uncategorized"
    const concepts =
      q.concepts && q.concepts.length > 0
        ? q.concepts.map((c) => c.name)
        : ["Uncategorized"];

    concepts.forEach((topicName) => {
      if (!metricsMap.has(topicName)) {
        metricsMap.set(topicName, {
          name: topicName,
          chapter: "General", // Placeholder as we don't have chapter data in concept directly yet
          easy: 0,
          medium: 0,
          hard: 0,
          total: 0,
        });
      }

      const metric = metricsMap.get(topicName)!;
      metric.total += 1;
      if (q.hardness_level === "easy") metric.easy += 1;
      else if (q.hardness_level === "medium") metric.medium += 1;
      else if (q.hardness_level === "hard") metric.hard += 1;
    });
  });

  const metrics = Array.from(metricsMap.values());

  return (
    <Card className="flex flex-col overflow-hidden shadow-sm">
      <div className="border-b bg-muted/50 px-4 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Detailed Metrics
        </h3>
      </div>
      <div className="h-[300px] w-full overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-muted-foreground bg-muted/20 sticky top-0">
            <tr className="border-b">
              {/* <th className="h-10 px-4 font-medium">Chapter</th> */}
              <th className="h-10 px-4 font-medium w-[40%]">Topic / Concepts</th>
              <th className="h-10 px-4 font-medium text-center">Easy</th>
              <th className="h-10 px-4 font-medium text-center">Medium</th>
              <th className="h-10 px-4 font-medium text-center">Hard</th>
              <th className="h-10 px-4 font-medium text-right">Total Qs</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr className="border-b">
                <td
                  colSpan={5}
                  className="p-4 text-center h-24 text-muted-foreground"
                >
                  No data available. Generate questions to see metrics.
                </td>
              </tr>
            ) : (
                metrics.map((metric, idx) => (
                <tr key={idx} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    {/* <td className="p-4">{metric.chapter}</td> */}
                    <td className="p-4 font-medium">{metric.name}</td>
                    <td className="p-4 text-center text-muted-foreground">
                    {metric.easy > 0 ? metric.easy : "-"}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                    {metric.medium > 0 ? metric.medium : "-"}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                    {metric.hard > 0 ? metric.hard : "-"}
                    </td>
                    <td className="p-4 text-right font-medium">
                    {metric.total}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
        Grand Total: {questions.length} Questions
      </div>
    </Card>
  );
}
