import { Card } from "@skolist/ui";
import { Lightbulb, Sparkles } from "lucide-react";

export function FeedbackSection() {
  // Placeholder data - eventually this would come from an AI analysis endpoint
  const suggestions = [
    "Consider adding more questions on 'Quantum Mechanics' to balance the difficulty.",
    "The distribution of 'Easy' questions is slightly low.",
    "Try to include more application-based questions for better quality.",
  ];

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-0 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/50 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-indigo-100/50 blur-xl" />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
          <Lightbulb className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Feedback & Suggestions
          </h3>
          <p className="text-xs text-gray-500">AI-powered insights</p>
        </div>
        <Sparkles className="ml-auto h-4 w-4 text-blue-400" />
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto px-5 py-4">
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="group flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/50"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white shadow-sm">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-gray-600 group-hover:text-gray-800">
                {suggestion}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
