import { Card } from "@skolist/ui";

export function FeedbackSection() {
  // Placeholder data - eventually this would come from an AI analysis endpoint
  const suggestions = [
    "Consider adding more questions on 'Quantum Mechanics' to balance the difficulty.",
    "The distribution of 'Easy' questions is slightly low.",
    "Try to include more application-based questions for better gratification.",
  ];

  return (
    <Card className="flex h-full flex-col p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Feedback / Suggestions
      </h3>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
