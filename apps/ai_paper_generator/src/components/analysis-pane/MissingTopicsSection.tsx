import { Card } from "@skolist/ui";

export function MissingTopicsSection() {
  // Placeholder data
  const missingTopics = [
    "Thermodynamics - Entropy",
    "Optics - Wave Nature",
    "Modern Physics - Semiconductors",
  ];

  return (
    <Card className="flex h-full flex-col p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Missing Topics
      </h3>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {missingTopics.map((topic, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              <span className="text-muted-foreground">{topic}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
