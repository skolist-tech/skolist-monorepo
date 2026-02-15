import { useState } from "react";
import { LatexRenderer } from "../LatexRenderer";

interface ExplanationToggleProps {
  explanation: string;
}

export function ExplanationToggle({ explanation }: ExplanationToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 underline hover:text-blue-800 focus:outline-none"
      >
        {isExpanded ? "Hide Explanation" : "View Explanation"}
      </button>
      {isExpanded && (
        <div className="mt-2 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
          <LatexRenderer content={explanation} />
        </div>
      )}
    </div>
  );
}
