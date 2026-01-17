import { Card } from "@skolist/ui";
import { AlertTriangle, BookX } from "lucide-react";

export function MissingTopicsSection() {
  // Placeholder data
  const missingTopics = [
    "Thermodynamics - Entropy",
    "Optics - Wave Nature",
    "Modern Physics - Semiconductors",
  ];

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-0 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-100/50 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-orange-100/50 blur-xl" />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-500/10 to-orange-500/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-md">
          <BookX className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Missing Topics
          </h3>
          <p className="text-xs text-gray-500">Topics not yet covered</p>
        </div>
        <AlertTriangle className="ml-auto h-4 w-4 text-orange-400" />
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto px-5 py-4">
        {missingTopics.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-xl">✓</span>
            </div>
            <p className="text-sm font-medium text-green-600">
              All topics covered!
            </p>
            <p className="text-xs text-gray-500">Great job on your paper</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {missingTopics.map((topic, index) => (
              <li
                key={index}
                className="group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-rose-100 hover:bg-rose-50/50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-orange-400 shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                  {topic}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
